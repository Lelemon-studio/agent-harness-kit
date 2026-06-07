# Web App Security

Cross-language security baseline for web applications (API + frontend + database).
Opinionated defaults; adapt the framework-specific bits to your stack.

## Rules

### Secrets and credentials

- Never hardcode secrets, API keys, or tokens in source code.
- Keep sensitive values in environment files only (e.g. `.env.local`), and gitignore them.
- Encrypt sensitive data at rest with a dedicated key (e.g. AES-256-GCM via an `ENCRYPTION_KEY`).
- Rotate secrets periodically, and immediately after any suspected leak.
- Never commit `.env*`, `*.pem`, `*.key`, or `credentials.json`.

### Safe code

- Do not use `eval()`, `Function()`, or `new Function()`.
- Do not use `innerHTML` / `dangerouslySetInnerHTML` without sanitizing first.
- Validate ALL inputs at boundaries (API handlers, forms, webhooks, queue payloads) with a schema validator (e.g. zod, class-validator). Validate format/shape at the edge; keep business validation in the service layer.
- Use parameterized queries or an ORM that emits them. Never interpolate user input into SQL or URLs.

```ts
// Bad — string interpolation
db.query(`SELECT * FROM orders WHERE id = '${userInput}'`);

// Good — parameterized / ORM
db.select().from(orders).where(eq(orders.id, userInput));
```

- Keep a security lint plugin enabled; do not silence its rules ad hoc.

### Authentication and authorization

- Use short-lived JWT access tokens (~15 min) plus a longer-lived refresh token (~7 days).
- Rotate refresh tokens: one-time use, invalidate the old token on every refresh, and detect reuse (theft detection).
- Hash passwords with bcrypt (≥12 rounds) or argon2 — never store or log raw passwords.
- Rate-limit auth endpoints (login, refresh, password reset; e.g. 5 attempts/min per IP+account).
- Maintain a token blacklist/denylist for logout and forced revocation.
- Never trust client-supplied data for authorization decisions — derive identity and roles from the verified token server-side.

### Token storage (frontend)

- Store the access token in memory or short-lived `sessionStorage`.
- Store the refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie.
- Never store refresh tokens in `localStorage` or `sessionStorage` — both are readable by XSS.

### Multi-tenant isolation

- Filter EVERY query by the tenant key (e.g. `organizationId`). No exceptions.
- Derive the tenant key from the verified token, never from the request body or query params.
- Apply row-level filtering plus role-based access control (RBAC) on top.

```ts
// Bad — tenant id from the body, attacker-controlled
create(@Body() dto: { organizationId: string; name: string }) { ... }

// Good — tenant id from the verified token
create(@Body() dto: CreateDto, @TenantId() organizationId: string) {
  return this.service.create(organizationId, dto.name);
}
```

```ts
// Every read is scoped to the tenant
db.select().from(projects).where(
  and(eq(projects.organizationId, organizationId), isNull(projects.deletedAt)),
);
```

### Sensitive data and PII

- Encrypt PII at rest wherever feasible.
- Redact sensitive fields in logs: passwords, tokens, emails, phone numbers, names.
- Never log PII or secrets — not even to `console.log`. Log stable IDs instead.
- Record consent when you collect it (e.g. timestamp, IP, user agent) for GDPR/equivalent.
- Prefer soft deletes (`deletedAt`) so records remain auditable and recoverable.

```ts
// Bad
logger.log(`User ${email} invited to ${orgName}`);

// Good — IDs only
logger.log(`User invited to org ${orgId}`);
```

### Error handling

- Let unhandled errors fall through to a global handler that logs the full error server-side and returns a sanitized message to the client.
- Never expose SQL, stack traces, or internal messages in API responses.
- Use typed, intentional exceptions for business errors (e.g. `NotFoundException`, `BadRequestException`).

### Security headers

- Enable HSTS in production.
- `X-Frame-Options: DENY` (or a `frame-ancestors` CSP directive).
- Set a `Content-Security-Policy`.
- `X-Content-Type-Options: nosniff`.

### OWASP Top 10 mapping

- **A01 Broken Access Control** — RBAC + row-level filtering by tenant key; authorize server-side.
- **A02 Cryptographic Failures** — AES-256-GCM for data at rest; TLS in transit; strong password hashing.
- **A03 Injection** — parameterized queries / ORM; schema-validate all inputs.
- **A05 Security Misconfiguration** — security headers; no debug endpoints in production; least-privilege secrets.
- **A07 Identification & Authentication Failures** — rate limiting, token rotation/blacklist, password strength checks.
- **A09 Logging & Monitoring Failures** — log security events without PII; alert on auth anomalies.

## Anti-patterns

- Hardcoded secrets, or `.env` files committed to the repo.
- Building SQL with string concatenation / template literals from user input.
- Trusting `organizationId` (or any tenant/role field) from the request body.
- Queries that omit the tenant filter — even one is a cross-tenant data leak.
- Refresh tokens in `localStorage`/`sessionStorage`.
- Long-lived access tokens with no rotation or revocation path.
- Returning `error.message` / stack traces to the client.
- Logging emails, phones, names, tokens, or passwords.
- Hard deletes on records that need an audit trail.
- Disabling security lint rules to "make it pass".
