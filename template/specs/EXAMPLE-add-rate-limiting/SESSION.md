# Session Context - Add Rate Limiting

> **Purpose:** Information to resume work quickly each session.
> Read this file at the start of every work session.

---

## Current State

**Current phase:** Phase 2 (Middleware + responses)
**Start date:** 2026-03-10
**Last task completed:** 2.2 - 429 responses with headers
**Next task:** 2.3 - fail-open on Redis errors (allow + log) with an outage test

## Key Files

| File | Why it's relevant |
|------|-------------------|
| `src/ratelimit/limiter.ts` | `RateLimiter.take()` + the Lua script (Phase 1, done) |
| `src/api/middleware/rateLimit.ts` | The middleware being built now |
| `src/api/middleware/index.ts` | Where the middleware is registered in the chain |
| `src/shared/redis.ts` | Redis client; note its error events for fail-open |

## Frequent Commands

```bash
npm test -- rate-limiter                  # Phase 1 units
npm test -- api/rate-limit.integration    # Phase 2 integration
docker compose up -d redis                # local Redis for integration tests
```

## Decisions Made

| Date | Decision | Reason |
|------|----------|--------|
| 2026-03-10 | Token-bucket over sliding-window | One atomic script, allows sane bursts |
| 2026-03-10 | Redis server time in the script | Avoid cross-node clock skew |
| 2026-03-11 | Fail-open on Redis errors | Availability > strict limiting for this API |

## Blockers / Open Items

- [ ] Confirm the exact `X-RateLimit-Reset` format we want (epoch seconds vs delta)

## Notes from Previous Sessions

### Session 2026-03-10
- Completed: Phase 1 (limiter + tests), tasks 2.1-2.2 of Phase 2
- Learned: `ioredis` exposes Lua via `defineCommand` - cleaner than raw `eval`
- Next steps: fail-open path + integration test for the burst case

### Session 2026-03-11
- Completed: header format wired up
- Next steps: 2.3 fail-open, then 2.4 burst integration test
