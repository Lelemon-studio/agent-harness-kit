# Acceptance Checklist - Add Rate Limiting

> **Purpose:** Verify the feature is complete.
> All items must be checked before archiving.
>
> **Finished:** -

---

## How criteria are verified

Each criterion is **automated** (carries a `verify:` command, exit 0 = PASS) or
**manual** (tagged `(manual)`, needs human judgment). `/spec-done` runs every
`verify:` and refuses to close the spec on any FAIL; manual items need explicit
human confirmation.

---

## Functional Criteria

- [ ] Requests under the limit pass through unchanged
      verify: npm test -- rate-limit -t "under the limit"
- [ ] Requests over the limit get `429` with `Retry-After` + `X-RateLimit-*`
      verify: bash scripts/assert-429.sh
- [ ] Free vs paid keys get different limits from config
      verify: npm test -- rate-limit -t "tier limits from config"
- [ ] Redis outage fails open (requests allowed, error logged)
      verify: npm test -- rate-limit -t "redis down fails open"

## Technical Criteria

- [ ] Build succeeds
      verify: npm run build
- [ ] No type errors
      verify: npx tsc --noEmit
- [ ] Tests passing (unit + integration)
      verify: npm test -- rate-limit
- [ ] Limiter is one atomic Redis op per request (no race)
      verify: npm test -- rate-limit -t "atomic under concurrency"

## Documentation

- [ ] SPEC.md updated with final decisions (manual: decisions match what shipped)
- [ ] PHASES.md with all phases complete
- [ ] SESSION.md with notes from every session
- [ ] API docs mention the limits + headers (manual: read docs/api.md, limits and headers are listed)

---

> `scripts/assert-429.sh` boots the app, hammers an endpoint past the limit, and
> exits non-zero unless it sees a `429` with `Retry-After`. The curl-that-expects-429
> lives in a script so the command stays one deterministic line.

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | - | - | pending |
