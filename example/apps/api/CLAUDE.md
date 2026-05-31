# CLAUDE.md - Tindo API

The backend. Fastify (HTTP) + Drizzle ORM on Postgres, Redis + BullMQ for background
work. It owns the data and every business rule; the web app is a thin client. This is
the highest-stakes code in the product - a bug here can leak a tenant's invoices or
double-charge a customer.

## Commands

```bash
pnpm dev          # run the API on :4000 with watch
pnpm build        # production build
pnpm test         # vitest
pnpm lint         # eslint + tsc --noEmit
pnpm db:generate  # generate a migration from schema changes
pnpm db:migrate   # apply migrations
```

## Architecture (load-bearing rules)

1. **Multi-tenant always.** Every table has `orgId`; every query filters by it,
   including admin tooling and background jobs. The `orgId` comes from the
   authenticated token, never from the request body or a query param. Why: a missing
   filter is a cross-tenant data leak - someone sees another company's invoices. This
   is the rule the whole product rests on.
2. **Soft deletes only.** Set `deletedAt`; never hard-delete invoices, payments, or
   customers. Queries filter `deletedAt IS NULL` by default. Why: financial records
   must be auditable and mistakes recoverable.
3. **Async anything over ~5s or anything external.** Sending email, calling the
   payment provider, generating a PDF -> a BullMQ job, not the request path. The API
   stays under 500ms. Why: request timeouts and a frozen UI otherwise.
4. **Jobs are idempotent.** A job can run twice (the queue retries); design every
   handler so the second run is a no-op. Use the provider's idempotency key on
   payment calls. Why: retries must never double-charge.
5. **Money is integer minor units.** Store and compute amounts in cents (`bigint`),
   never floats. Currency is explicit on every amount. Why: float rounding on money is
   a correctness bug that shows up in someone's books.
6. **The schema is the source of truth.** Change `schema.ts`, then
   `pnpm db:generate`. Never hand-edit a generated migration or the DB directly. Why:
   drift between schema, migrations, and prod is how a deploy corrupts data.

## Patterns to follow

- **Routes are thin.** A route validates input (zod), calls a service, maps the
  result to a response. No business logic in handlers.
- **Services own the rules.** One service per aggregate (`InvoiceService`,
  `PaymentService`). They take `orgId` as the first argument, always.
- **Structured logging only.** `log.info({ orgId, invoiceId }, "invoice.sent")` via
  the pino logger. Never `console.log`. Never log a full customer object (PII).
- **Errors through the global handler.** Throw typed domain errors; a single error
  filter logs server-side and returns a sanitized client message + a request id.

## Anti-patterns

See [`docs/anti-patterns/backend.md`](../../docs/anti-patterns/backend.md) - the
mistakes that have actually recurred here, each with the fix.

## Conventions specific to this app

- Test every new route with an integration test that asserts tenant scoping (a second
  org cannot read the first org's row).
- Webhook handlers verify the provider signature before doing anything else.
- New env vars are added to `.env.example` and documented in the same change.
