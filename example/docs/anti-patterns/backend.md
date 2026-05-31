# Anti-patterns - Tindo API

The mistakes that have actually recurred in this backend, each with the fix and why it
bites. A line gets added here the second time the same error happens - this is the
Hashimoto loop as a document. Linked from `apps/api/CLAUDE.md`.

## Tenancy

- A query without the `orgId` filter -> every query filters by `orgId`, taken from the
  token. Why: a cross-tenant leak - one company sees another's invoices. The worst bug
  this product can ship.
- Reading `orgId` from the request body or a query param -> take it from the
  authenticated token. Why: the body is attacker-controlled; trusting it defeats the
  whole isolation model.

## Money

- Storing or computing amounts as floats / decimals-in-JS -> integer minor units
  (cents) as `bigint`. Why: float rounding silently corrupts totals and someone's
  books don't balance.
- An amount without an explicit currency -> currency is always stored alongside.
  Why: a mixed-currency org will otherwise sum pesos and dollars.

## Jobs and external calls

- Doing >5s of work (email, PDF, provider call) in the request path -> enqueue a
  BullMQ job. Why: request timeouts and a frozen dashboard.
- A non-idempotent payment job -> use the provider's idempotency key; make a re-run a
  no-op. Why: the queue retries, and a double-run double-charges a customer.

## Data safety

- Hard `DELETE` on invoices/payments/customers -> soft-delete (`deletedAt`). Why:
  financial records must be auditable and recoverable.
- A destructive migration with no rollback note -> document the reverse and test on
  staging first. Why: a bad backfill on prod data has no undo button.

## Logging and errors

- `console.log` for app logging -> the pino structured logger. Why: console output
  isn't leveled or captured in production.
- Logging a full customer/invoice object -> log ids (`orgId`, `invoiceId`), never PII
  (emails, names, card data). Why: PII in logs is a compliance breach.
- Returning a raw error/stack to the client -> the global error filter logs
  server-side and returns a sanitized message + request id. Why: stack traces and SQL
  leak internals.

## Types

- `any` to silence the compiler -> `unknown` + a zod parse, or fix the type. Why:
  `any` disables the checks you're paying TypeScript for, right where money flows.
