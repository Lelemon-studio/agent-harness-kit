# Drizzle ORM + PostgreSQL Patterns

Mandatory patterns for type-safe schemas and queries with Drizzle ORM on PostgreSQL.

## Rules

### Schema definition

```typescript
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),

  // Type the JSONB column with a real interface
  settings: jsonb('settings')
    .$type<ProjectSettings>()
    .default({})
    .notNull(),

  // Always include soft-delete + audit columns
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('projects_tenant_idx').on(table.tenantId),
  // Partial unique index: uniqueness applies only to live rows
  uniqueSlug: uniqueIndex('projects_tenant_slug_unique')
    .on(table.tenantId, table.slug)
    .where(sql`${table.deletedAt} IS NULL`),
}));

// Derive types from the table, never hand-write them
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

- Type every JSONB column with `.$type<T>()` so reads/writes are checked.
- Export row types via `$inferSelect` (read) and `$inferInsert` (write). Don't duplicate column shapes by hand.
- Keep enums in a dedicated module (e.g. `enums.ts`) and reuse them across tables.
- Add an `index(...)` for every column you filter or join on frequently.
- Use a **partial unique index** (`.where(sql\`... IS NULL\`)`) for fields that must be unique only among non-deleted rows, so soft-deleted rows don't block reuse.

### Tenant scoping (mandatory)

Every query against a tenant-owned table must filter by the tenant key. There are no exceptions — a missing filter is a cross-tenant data leak.

```typescript
// Correct: always scope by tenant and exclude deleted rows
await db
  .select()
  .from(projects)
  .where(
    and(
      eq(projects.tenantId, tenantId),
      isNull(projects.deletedAt),
    ),
  );
```

- Derive `tenantId` from the authenticated session/token, never from request input the caller can forge.
- Apply the same `eq(table.tenantId, tenantId)` to updates and deletes, not just reads.

### Soft deletes

```typescript
// Delete = set the timestamp, never remove the row
await db
  .update(projects)
  .set({ deletedAt: new Date(), updatedAt: new Date() })
  .where(
    and(
      eq(projects.id, id),
      eq(projects.tenantId, tenantId),
    ),
  );

// Every read excludes soft-deleted rows
.where(
  and(
    eq(projects.tenantId, tenantId),
    isNull(projects.deletedAt),
  ),
)
```

- Never hard-delete tenant data. Set `deletedAt` and update `updatedAt`.
- Add `isNull(table.deletedAt)` to every read path. Make it part of the shared base predicate so it can't be forgotten.

### Generating a unique slug

When slugs must be unique per tenant, generate-and-check against live rows only:

```typescript
async function generateUniqueSlug(name: string, tenantId: string): Promise<string> {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const existing = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(
      and(
        eq(projects.tenantId, tenantId),
        like(projects.slug, `${baseSlug}%`),
        isNull(projects.deletedAt),
      ),
    );

  if (existing.length === 0) return baseSlug;

  const taken = new Set(existing.map((e) => e.slug));
  let suffix = 2;
  while (taken.has(`${baseSlug}-${suffix}`)) suffix++;
  return `${baseSlug}-${suffix}`;
}
```

The partial unique index is still the source of truth; this just avoids a predictable collision on the happy path.

### Insert + returning

```typescript
const [project] = await db
  .insert(projects)
  .values({ tenantId, name: input.name, slug, status: 'draft' })
  .returning();
```

- Always use `.returning()` to get the persisted row (with DB-generated id, timestamps, defaults) instead of re-reading or guessing.

### Optimistic locking on update

Bump a `version` column on every update and key the predicate on the expected version (or simply read the result to detect a no-op write):

```typescript
const [updated] = await db
  .update(items)
  .set({
    ...input,
    updatedAt: new Date(),
    version: sql`${items.version} + 1`,
  })
  .where(
    and(
      eq(items.id, id),
      eq(items.tenantId, tenantId),
      isNull(items.deletedAt),
    ),
  )
  .returning();

// .returning() gives an empty array when nothing matched —
// treat that as not-found / stale, not silent success.
if (!updated) {
  throw new NotFoundError('Item not found');
}
```

For true concurrency control, add `eq(items.version, expectedVersion)` to the predicate so a stale write matches zero rows.

### Pagination

```typescript
async function findAll(
  tenantId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
) {
  const data = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.tenantId, tenantId),
        isNull(items.deletedAt),
      ),
    )
    .limit(limit)
    .offset(offset);

  return { data, limit, offset };
}
```

Always cap `limit` with a sane default; never return an unbounded result set.

### Migrations

```bash
db:generate   # Generate a migration from the schema diff
db:push       # Apply the schema directly (local/dev only)
db:migrate    # Run committed migrations (production)
```

- Change the schema and regenerate. Never hand-edit generated migration files.
- Use `push` for local iteration; use generated, committed migrations in production.

## Anti-patterns

### Query without a tenant filter

```typescript
// Wrong: leaks data across tenants
const rows = await db.select().from(projects);

// Right: always scope and exclude deleted
const rows = await db
  .select()
  .from(projects)
  .where(and(eq(projects.tenantId, tenantId), isNull(projects.deletedAt)));
```

### Hard delete

```typescript
// Wrong: data is gone, no audit trail, breaks references
await db.delete(projects).where(eq(projects.id, id));

// Right: soft delete
await db.update(projects).set({ deletedAt: new Date() }).where(eq(projects.id, id));
```

### Untyped JSONB

```typescript
// Wrong: `settings` is `unknown`, every access is a guess
settings: jsonb('settings'),

// Right: typed payload, checked reads and writes
settings: jsonb('settings').$type<ProjectSettings>().default({}).notNull(),
```

### Hand-written row types

```typescript
// Wrong: drifts from the schema the moment a column changes
interface Project { id: string; name: string; /* ... */ }

// Right: inferred from the table
type Project = typeof projects.$inferSelect;
type NewProject = typeof projects.$inferInsert;
```

### Trusting the tenant id from input

```typescript
// Wrong: caller can target another tenant's data
function create(input: { tenantId: string; name: string }) {
  return db.insert(items).values(input).returning();
}

// Right: tenantId comes from the authenticated context
function create(tenantId: string, input: { name: string }) {
  return db.insert(items).values({ ...input, tenantId }).returning();
}
```

### Ignoring an empty `.returning()`

```typescript
// Wrong: assumes the update happened
const [updated] = await db.update(items).set(input).where(...).returning();
return updated; // may be undefined — stale or wrong tenant

// Right: empty result means no row matched
if (!updated) throw new NotFoundError('Item not found');
```

### N+1 queries

```typescript
// Wrong: one query per parent row
const projects = await db.select().from(projects);
for (const p of projects) {
  p.tasks = await db.select().from(tasks).where(eq(tasks.projectId, p.id));
}

// Right: a single join (or a batched `inArray` lookup)
const rows = await db
  .select()
  .from(projects)
  .leftJoin(tasks, eq(tasks.projectId, projects.id))
  .where(eq(projects.tenantId, tenantId));
```

### Interpolating user input into SQL

```typescript
// Wrong: SQL injection
await db.execute(sql.raw(`SELECT * FROM items WHERE name = '${userInput}'`));

// Right: parameterized — let Drizzle bind the value
await db.select().from(items).where(eq(items.name, userInput));
```

### Hand-editing generated migrations

Don't patch the SQL in a generated migration to "fix" the schema. Change the schema source, regenerate, and review the new diff. Hand edits drift from `$inferSelect`/`$inferInsert` and from what `db:generate` will produce next time.
