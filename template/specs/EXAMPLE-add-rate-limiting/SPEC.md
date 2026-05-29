# Add Rate Limiting

> **Status:** `IN_PROGRESS`
> **Started:** 2026-03-10 14:00
> **Finished:** -

---

## Summary

Add per-client rate limiting to the public REST API so a single caller can't
exhaust capacity. Token-bucket per API key, returned as standard `429` + headers.

## Problem

One misbehaving integration recently sent ~50 req/s and degraded latency for
everyone. We have no per-client limit today; the only backstop is the load
balancer's global cap, which is too coarse and fires too late.

## Proposal

A token-bucket limiter keyed by API key, backed by Redis (we already run it for
sessions). Middleware checks the bucket before the handler, refills at a fixed
rate, and returns `429 Too Many Requests` with `Retry-After` and
`X-RateLimit-*` headers when empty. Limits are config-driven per plan tier.

## Goals

- [x] Token-bucket limiter keyed by API key
- [x] `429` responses with `Retry-After` + `X-RateLimit-Limit/Remaining/Reset`
- [ ] Per-plan-tier limits from config (free vs paid)
- [ ] Metrics: count of throttled requests per key

## Non-Goals

- We will **not** rate-limit authenticated dashboard traffic (separate concern)
- We will **not** build a distributed sliding-window algorithm; token-bucket is
  enough for this scale and far simpler to reason about

## Technical Context

| Resource | Location |
|----------|----------|
| Existing Redis client | `src/shared/redis.ts` |
| API middleware chain | `src/api/middleware/index.ts` |
| Plan tiers config | `src/config/plans.ts` |

## Alternatives Considered

### Option A: Sliding-window counter in Redis
- **Pros:** smoother, no burst allowance
- **Cons:** more Redis ops per request, trickier to get right

### Option B: Token-bucket in Redis (chosen)
- **Pros:** one atomic Lua script per request, allows sane bursts, easy to explain
- **Cons:** burst up to bucket size (acceptable)

**Decision:** Option B - the burst allowance is fine and the implementation is a
single atomic script.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Redis outage blocks all requests | Low | High | Fail-open: on Redis error, allow the request and log |
| Clock skew across nodes | Low | Med | Use Redis server time in the Lua script, not app time |
