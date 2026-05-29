# Acceptance Checklist - Add Rate Limiting

> **Purpose:** Verify the feature is complete.
> All items must be checked before archiving.
>
> **Finished:** -

---

## Functional Criteria

- [x] Requests under the limit pass through unchanged
- [x] Requests over the limit get `429` with `Retry-After` + `X-RateLimit-*`
- [ ] Free vs paid keys get different limits from config
- [ ] Redis outage fails open (requests allowed, error logged)

## Technical Criteria

- [ ] Build succeeds
- [ ] No type errors
- [ ] Tests passing (unit + integration)
- [ ] Limiter is one atomic Redis op per request (no race)

## Documentation

- [ ] SPEC.md updated with final decisions
- [ ] PHASES.md with all phases complete
- [ ] SESSION.md with notes from every session
- [ ] API docs mention the limits + headers

---

## Final Verification

```bash
npm run build && npm test -- rate-limit
```

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | - | - | pending |
