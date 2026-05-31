# Ops patterns - Tindo

The deploy / rollback / incident runbook. Referenced from `CLAUDE.md`; this is what
`/deploy` and `/diagnose` follow. Replace the platform specifics with yours.

## Deploy

1. **Preflight.** Working tree clean, on an up-to-date branch. Confirm the target
   (staging by default; production only when explicitly named).
2. **Build.** `pnpm build` for the app(s) that changed. Stop if it fails - never ship
   a broken build.
3. **Verify.** `pnpm test && pnpm lint`. Stop on failure and report what broke.
4. **Migrate first if the schema changed.** `pnpm db:migrate` against the target,
   confirmed backward-compatible with the currently-running code.
5. **Ship.** Merge to `main` (push-to-deploy). This is the outward-facing step - show
   what's about to deploy and wait for the OK; the confirm-push hook backs this up.
6. **Post-deploy check.** Hit `/healthz`, send a test invoice through staging, watch
   error rate for 5 minutes. Report the deployed version and that it's healthy.

## Rollback

- The fastest mitigation for a bad deploy is redeploying the previous green commit -
  do that first, diagnose after.
- A migration is NOT auto-rolled-back. If a deploy with a schema change is bad, you
  need a forward-fix migration; design destructive migrations to be reversible for
  exactly this reason.

## Incident triage (a failing service)

1. **Confirm the symptom.** Error rate, latency, a specific endpoint, or fully down?
2. **Check recent change.** What deployed last? Most incidents correlate with the last
   ship - consider rolling it back while you investigate.
3. **Read the logs.** Filter by request id / `orgId`; find the first error in the
   chain, not the last.
4. **Check dependencies.** Postgres reachable? Redis up? The payment provider's status
   page? "We're down" is often "a dependency is down."
5. **Common causes here:**
   - Job backlog growing -> a worker crashed or a handler isn't idempotent and is
     retrying forever.
   - 500s on payments -> provider webhook signature change or an expired key.
   - Slow queries -> a query that lost its `orgId`/index and is scanning a big table.
6. **Report.** Root cause, the evidence, and the smallest safe fix. No risky fixes
   straight to production without confirmation.

## Notes

- Triage is read-only first. Understand before you touch.
- Never skip the build/verify steps to "save time" - that's how the outage happens.
