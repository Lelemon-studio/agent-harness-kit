# Anti-patterns - <backend / this area>

<!--
A focused list of mistakes that actually recur in this codebase. Link it from
CLAUDE.md. Each entry: the mistake -> the fix (-> why it bites). Add a line every
time the same error happens twice. This is the Hashimoto loop as a document.
Examples below are illustrative; replace with your real ones.
-->

## Logging

- `console.log` for app logging -> use the structured logger. Why: console output
  isn't captured/leveled in production and PII slips through.
- Logging emails, phones, names, tokens -> redact before logging. Why: PII in logs
  is a compliance breach.

## Data access

- A query without the tenant filter -> every query filters by `orgId`. Why: a missing
  filter is a cross-tenant data leak, not just a bug.
- Hard `DELETE` -> soft-delete (`deletedAt`). Why: auditability and recoverable
  mistakes.

## API boundaries

- Reading `orgId` (or user identity) from the request body -> take it from the
  authenticated token. Why: the body is attacker-controlled.
- Returning raw errors to the client -> a global filter logs server-side and returns
  a sanitized message. Why: stack traces and SQL leak internals.

## Async / jobs

- Doing >5s of work in the request path -> enqueue a job; keep the API fast. Why:
  timeouts and bad UX.
- A job that isn't idempotent -> make retries safe. Why: queues retry; double-effects
  corrupt data.

## Types

- `any` to silence the compiler -> `unknown` + narrowing, or fix the type. Why:
  `any` disables the checks you're paying for.
