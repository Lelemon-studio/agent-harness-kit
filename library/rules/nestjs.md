# NestJS Backend Patterns

Opinionated, framework-honest rules for building a maintainable NestJS backend:
modular structure, a thin controller -> service -> DTO flow, dependency injection,
guards and pipes, RBAC, idempotent background jobs, a sanitizing exception filter,
multi-tenant isolation, and soft deletes.

These assume a multi-tenant SaaS where every row belongs to a tenant (here called a
`tenantId` — substitute `organizationId`, `accountId`, `workspaceId`, etc.) and where
JWT auth is global.

## Module structure

Keep one folder per feature. A module exposes a controller (transport), a service
(business logic), and DTOs (input contracts). Split large services into sub-services
rather than growing one god class.

```
modules/<feature>/
├── <feature>.module.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   └── update-<feature>.dto.ts
└── services/            # optional sub-services for complex logic
```

## Rules

### Controllers stay thin

Controllers parse the request, delegate to a service, and return the result. No
business logic, no database access, no error handling.

```typescript
@Controller('projects')
@UseGuards(RolesGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectService) {}

  @Post()
  @Roles('owner', 'admin')
  async create(
    @Body() dto: CreateProjectDto,
    @TenantId() tenantId: string,
  ): Promise<Project> {
    return this.projects.create({ ...dto, tenantId });
  }

  @Get()
  async findAll(@TenantId() tenantId: string): Promise<Project[]> {
    return this.projects.findAll(tenantId);
  }
}
```

- The tenant id comes from the JWT via a custom decorator (`@TenantId()`), never from
  the request body — the client must not be able to choose which tenant it writes to.
- Every `@Body()` is a validated DTO class (see below).
- Mark auth-free endpoints explicitly (`@Public()`), so "authenticated" is the default.
- Restrict by role with a `@Roles(...)` decorator backed by a guard.

### Services are pure business logic

Services know nothing about HTTP — no `Request`/`Response`, no status codes. They take
typed inputs, return typed outputs, and throw exceptions for failures. This keeps them
unit-testable and reusable from controllers, jobs, and other services.

```typescript
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(private readonly repo: ProjectRepository) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const slug = await this.generateUniqueSlug(input.name, input.tenantId);
    return this.repo.insert({ ...input, slug });
  }
}
```

- Explicit types on parameters and return values for public methods.
- One logger per class: `new Logger(ClassName.name)`.
- Inject dependencies through the constructor (DI) — never instantiate them with `new`
  or import singletons directly. This is what makes mocking in tests possible.

### Validate input with DTOs and a global ValidationPipe

Each write endpoint has a DTO class annotated with `class-validator` decorators. Enable
the `ValidationPipe` globally so you never repeat `@Body(ValidationPipe)` per route.

```typescript
export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: ProjectStatus;
}
```

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,         // strip properties not in the DTO
    forbidNonWhitelisted: true, // reject unknown properties outright
    transform: true,         // instantiate the DTO class and coerce types
  }),
);
```

- Format validation (required, length, pattern, enum) lives in the DTO.
- Business validation (e.g. "slug already taken", "over plan limit") lives in the
  service, where it can query state and throw the right exception.

### Use guards, pipes, and decorators for cross-cutting concerns

Authentication, authorization, and parsing belong in guards/pipes/decorators, not in
handler bodies. A typical setup:

| Concern         | Mechanism                                              |
| --------------- | ------------------------------------------------------ |
| Authentication  | Global `JwtAuthGuard` (registered as `APP_GUARD`)      |
| Public routes   | `@Public()` decorator read by the JWT guard            |
| Authorization   | `RolesGuard` + `@Roles('owner', 'admin')` decorator    |
| Tenant context  | `@TenantId()` param decorator reading `request.user`   |
| User context    | `@UserId()` param decorator reading `request.user`     |
| Internal/system | A dedicated guard (e.g. API-key guard) for system calls |

Keep the JWT guard global and opt routes out with `@Public()`, so forgetting a decorator
fails closed (locked) rather than open (exposed).

### Filter every query by tenant

In a multi-tenant system, every read and write must be scoped to the caller's tenant.
Treat an unscoped query as a security bug.

```typescript
// Always combine the tenant filter with the soft-delete filter
const rows = await this.db
  .select()
  .from(projects)
  .where(
    and(
      eq(projects.tenantId, tenantId),
      isNull(projects.deletedAt),
    ),
  );
```

### Soft delete by default

Set a `deletedAt` timestamp instead of removing rows, and exclude soft-deleted rows in
every read. This preserves audit history and makes accidental deletes recoverable.

```typescript
await this.db
  .update(projects)
  .set({ deletedAt: new Date(), updatedAt: new Date() })
  .where(and(eq(projects.id, id), eq(projects.tenantId, tenantId)));
```

### Offload heavy work to idempotent background jobs

The HTTP path should respond fast (target well under a second). Anything slow —
external API calls, batch processing, file generation — goes to a queue (e.g. BullMQ).
Return an acknowledgement immediately.

```typescript
@Post('reports')
async generate(@Body() dto: GenerateReportDto, @TenantId() tenantId: string) {
  await this.queue.add('generate-report', { ...dto, tenantId });
  return { queued: true };
}
```

Jobs run with retries, so they must be **idempotent** — running the same job twice must
not double-charge, double-send, or duplicate a row. Use a stable job id or an
idempotency key, and check for prior completion before doing side effects.

```typescript
@Processor('generate-report')
export class ReportProcessor extends WorkerHost {
  async process(job: Job<ReportJobData>): Promise<ReportJobResult> {
    const startedAt = Date.now();
    try {
      // re-check state, then perform the side effect exactly once
      return { success: true, durationMs: Date.now() - startedAt };
    } catch (error) {
      return { success: false, error: sanitize(error), durationMs: Date.now() - startedAt };
    }
  }
}
```

### Let a global exception filter shape error responses

Do not catch-and-rethrow in controllers. Throw typed NestJS exceptions and let one
global filter handle everything: log the full error server-side, return a sanitized,
safe message to the client (never a SQL string or stack trace), and optionally alert on
unexpected 5xx in production.

```typescript
// business errors: throw typed exceptions, the filter does the rest
throw new NotFoundException('Project not found');
throw new BadRequestException('Name is required');
throw new ForbiddenException('No access to this resource');
throw new ConflictException('Slug already in use');
```

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    // full detail server-side
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));

    // safe detail to the client
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    res.status(status).json({ statusCode: status, message });
  }
}
```

### Decouple modules with events, not direct imports

When one module needs to react to something in another, emit a typed event rather than
importing the other module's service. This avoids circular dependencies and keeps
modules independently deployable and testable.

```typescript
// producer (in a service)
this.eventEmitter.emit(EVENT_NAMES.PROJECT_CREATED, new ProjectCreatedEvent(project));

// consumer (in another module)
@OnEvent(EVENT_NAMES.PROJECT_CREATED)
async onProjectCreated(event: ProjectCreatedEvent) {
  // no compile-time coupling to the producing module
}
```

Define event names as constants in one place and reference the constant, not a string
literal, so renames are safe.

### Log with the framework logger, never PII

Use the NestJS `Logger` (or a structured logger behind it). Log identifiers, not
personal data — no emails, names, phone numbers, or tokens.

```typescript
this.logger.log(`Project created: ${project.id}`);
this.logger.warn(`Retry ${attempt} for job ${jobId}`);

// log the user id, not the email
this.logger.log(`User ${userId} invited to tenant ${tenantId}`);
```

## Anti-patterns

### Reading the tenant id from the request body

```typescript
// DON'T — a client can forge any tenant id
async create(@Body() dto: { tenantId: string; name: string }) {
  return this.service.create(dto.tenantId, dto.name);
}

// DO — take it from the verified JWT
async create(@Body() dto: CreateDto, @TenantId() tenantId: string) {
  return this.service.create(tenantId, dto.name);
}
```

### Queries without a tenant filter

```typescript
// DON'T — leaks data across tenants
const rows = await this.db.select().from(projects);

// DO — always scope by tenant (and exclude soft-deleted)
const rows = await this.db
  .select()
  .from(projects)
  .where(and(eq(projects.tenantId, tenantId), isNull(projects.deletedAt)));
```

### Hard deletes

```typescript
// DON'T — destroys audit history, unrecoverable
await this.db.delete(projects).where(eq(projects.id, id));

// DO — soft delete
await this.db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, id));
```

### Leaking internal errors to the client

```typescript
// DON'T — exposes SQL, stack traces, internal structure
catch (error) {
  throw new InternalServerErrorException(error.message);
}

// DO — let the global filter sanitize, or throw a typed business exception
throw new BadRequestException('Name is required');
```

### Blocking the request on heavy work

```typescript
// DON'T — ties up the event loop and the connection for 30s
@Post('process')
async process(@Body() dto: ProcessDto) {
  await this.heavyProcessing(dto);
  return { done: true };
}

// DO — enqueue and acknowledge
@Post('process')
async process(@Body() dto: ProcessDto) {
  await this.queue.add('process', dto);
  return { queued: true };
}
```

### Circular imports between modules

```typescript
// DON'T — direct cross-module import
import { OtherService } from '../other/other.service';
// DON'T — papering over the cycle
@Inject(forwardRef(() => OtherService))

// DO — communicate via events
this.eventEmitter.emit(EVENT_NAMES.SOMETHING_HAPPENED, event);
```

### Re-implementing format validation inside services

```typescript
// DON'T — hand-rolled checks that a DTO already covers
async create(input: any) {
  if (!input.name) throw new Error('name required');
  if (!input.email?.includes('@')) throw new Error('invalid email');
}

// DO — a DTO for format, the service only for business rules
export class CreateDto {
  @IsString() @MinLength(1) name: string;
  @IsEmail() email: string;
}
```

### N+1 queries

```typescript
// DON'T — one query per row
const projects = await this.db.select().from(projects);
for (const p of projects) {
  p.tasks = await this.db.select().from(tasks).where(eq(tasks.projectId, p.id));
}

// DO — join (or batch with a single IN query)
const rows = await this.db
  .select()
  .from(projects)
  .leftJoin(tasks, eq(tasks.projectId, projects.id))
  .where(eq(projects.tenantId, tenantId));
```

### Non-idempotent jobs

```typescript
// DON'T — a retry sends the notification twice
async process(job: Job<NotifyJobData>) {
  await this.sendNotification(job.data); // no dedupe
}

// DO — guard the side effect with an idempotency check
async process(job: Job<NotifyJobData>) {
  if (await this.alreadyNotified(job.data.id)) return { skipped: true };
  await this.sendNotification(job.data);
  await this.markNotified(job.data.id);
}
```

### Hardcoding configurable/business data in code

```typescript
// DON'T — values that differ per tenant baked into the binary
getPlanCopy(): string {
  return 'Starter plan from $X/month';
}

// DO — read it from storage, scoped to the tenant
async getPlanCopy(tenantId: string): Promise<string> {
  return this.repo.getPlanCopy(tenantId);
}
```

### `console.log` for debugging

```typescript
// DON'T — unstructured, unfiltered, ships to production
console.log('project created', project);

// DO — use the framework logger
this.logger.log(`Project created: ${project.id}`);
```

### Logging PII

```typescript
// DON'T — personal data in logs
this.logger.log(`User ${email} (${phone}) invited to ${tenantName}`);

// DO — log identifiers only
this.logger.log(`User ${userId} invited to tenant ${tenantId}`);
```
