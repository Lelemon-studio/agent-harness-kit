Resume work on an existing spec, loading all the context you need.

The feature name is passed in $ARGUMENTS (example: `/spec-continue caching-strategy`).

## Steps

1. **Verify the spec exists**
   - Look in `specs/*<name>/` (the name may have a date prefix)
   - If it doesn't exist, suggest `/spec <name>` to create it

2. **Load full context**
   Read these files in order:
   - `SESSION.md` -> current state, key files, decisions
   - `PHASES.md` -> current phase and next tasks
   - `SPEC.md` -> problem context (if needed)

3. **Identify the next task**
   - Find the first unchecked `[ ]` task in PHASES.md
   - Identify the current phase

4. **Show a context summary with timing**
   ```
   Continuing: caching-strategy

   Timing:
   - Started: 2026-02-01 19:00
   - Elapsed: 2h 30m

   Current state:
   - Phase 2 of 4: Optimize catalogs
   - Last task completed: "Raise BrandService TTL"
   - Next task: "Add cache invalidation"

   Key files for this session:
   - src/modules/brand/application/services/BrandService.ts
   - src/shared/events/handlers.ts

   Prior decisions:
   - 1-hour TTL for catalogs

   Ready to continue with the next task?
   ```

5. **Ask how to proceed**
   - Continue with the next task
   - View the full SPEC.md
   - View all phases

## At the end of the session

Remember to update SESSION.md with:
- Tasks completed
- Important notes
- Next steps

## When the spec is complete

Use `/spec-done <name>` to:
- Record the finish date/time
- Compute total duration
- Verify the acceptance checklist
