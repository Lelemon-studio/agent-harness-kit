# Phases - Add Rate Limiting

> Progress: **1/3 phases complete**
> Last updated: 2026-03-11 09:20

---

## Phase 1: Core limiter

> **Status:** `DONE`
> **Success criterion:** A unit-tested token-bucket function that allows N then
> blocks, and refills over time.

### Tasks

- [x] 1.1 - Write the token-bucket Lua script (atomic check + decrement + refill)
- [x] 1.2 - Wrap it in `RateLimiter.take(key)` returning `{ allowed, remaining, resetAt }`
- [x] 1.3 - Unit tests: allows up to bucket size, blocks after, refills over time

### Verification

```bash
npm test -- rate-limiter
```

### Notes

Used Redis server time (`TIME` command) inside the script to avoid clock skew.

---

## Phase 2: Middleware + responses

> **Status:** `IN_PROGRESS`
> **Success criterion:** Hitting the API over the limit returns `429` with correct
> headers; under the limit passes through.
> **Depends on:** Phase 1

### Tasks

- [x] 2.1 - Middleware calls `RateLimiter.take(apiKey)` before the handler
- [x] 2.2 - On block, return `429` + `Retry-After` + `X-RateLimit-*` headers
- [ ] 2.3 - Fail-open on Redis errors (allow + log), with a test simulating outage
- [ ] 2.4 - Integration test: burst of requests sees 200s then 429s

### Verification

```bash
npm test -- api/rate-limit.integration
```

### Notes

---

## Phase 3: Per-tier config + metrics

> **Status:** `PENDING`
> **Success criterion:** Free vs paid keys get different limits from config; a
> counter of throttled requests per key is exported.
> **Depends on:** Phase 2

### Tasks

- [ ] 3.1 - Read bucket size/refill from `src/config/plans.ts` by the key's tier
- [ ] 3.2 - Increment a `ratelimit_throttled_total{key}` metric on each 429

### Verification

```bash
npm test -- rate-limit-tiers && curl -s localhost:3000/metrics | grep ratelimit
```

### Notes

---

## Progress Summary

| Phase | Status | Tasks | Verified |
|-------|--------|-------|----------|
| 1. Core limiter | done | 3/3 | yes |
| 2. Middleware + responses | in-progress | 2/4 | - |
| 3. Per-tier config + metrics | pending | 0/2 | - |
