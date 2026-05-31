Triage a failing or misbehaving service by following the same checklist every time.

<!--
An example ops command (.claude/commands/diagnose.md). Encodes how to triage, so the
agent doesn't improvise a different path each incident. Replace placeholders with
your real log/health/dashboard locations. See docs/RULES-AND-OPS.md.
-->

$ARGUMENTS may name the service or symptom (e.g. `/diagnose api 500s`).

## Steps

1. **Reproduce / confirm the symptom**
   - What's the observable failure? Error rate, latency, a specific endpoint, down?

2. **Check health and recent change**
   - Health endpoint / status of the service.
   - What deployed most recently? A regression usually correlates with the last ship.

3. **Read the logs**
   ```bash
   <how to fetch recent logs>     # e.g. the platform's logs command, last 15 min
   ```
   - Look for the first error in the chain, not just the last one.

4. **Check dependencies**
   - Database reachable? Cache/queue up? External APIs responding?
   - A "service is down" is often a dependency that's down.

5. **Common causes (this service)**
   - <known failure mode 1 and its tell>
   - <known failure mode 2 and its tell>

6. **Report**
   - State the likely root cause, the evidence, and the smallest safe fix or
     mitigation. Don't apply risky fixes to production without confirmation.

## Notes

- Triage is read-only first. Understand before you touch.
- If it's a recent deploy, rolling back is often the fastest mitigation.
