Show the current status of a spec in the planning system.

The feature name is passed in $ARGUMENTS (example: `/spec-status caching-strategy`).
With no argument, list all specs.

## Steps

1. **Validate arguments**
   - If no name is given, list all active specs in `specs/`
   - If a name is given, find that specific spec

2. **Read the spec files**
   - SPEC.md -> extract Status, Started, Finished
   - PHASES.md -> count phases complete/total
   - DONE.md -> count criteria met/total

3. **Show a summary with timing**
   ```
   Spec: caching-strategy
   Status: IN_PROGRESS

   Timing:
   - Started: 2026-02-01 19:00
   - Finished: - (in progress)
   - Elapsed: 2h 30m

   Phase progress:
   [done] Phase 1: Static data (5/5 tasks)
   [wip]  Phase 2: Catalogs (2/4 tasks)
   [todo] Phase 3: Public vehicles (0/5 tasks)
   [todo] Phase 4: Stats (0/4 tasks)

   Checklist: 8/20 criteria met
   ```

4. **With no argument, list specs**
   ```
   Active specs:

   IN PROGRESS:
   - caching-strategy (2/4 phases) - Started: 2026-02-01 19:00
   - security-audit (0/5 phases) - Started: 2026-02-01 09:00

   COMPLETED (last 5):
   - redis-optimization (3/3 phases) - Duration: 3h 15m

   Use: /spec-status <name> for details
   ```

5. **For completed specs, show duration**

## Notes

- Specs with status DONE show total duration
- Specs IN_PROGRESS show elapsed time since start
- Search `specs/` with pattern `*<name>*` to find specs with a date prefix
