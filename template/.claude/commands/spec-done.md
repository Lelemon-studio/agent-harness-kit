Mark a feature/spec as complete.

The feature name is passed in $ARGUMENTS (example: `/spec-done caching-strategy`).

## Steps

1. **Verify the spec exists**
   - Look in `specs/*<name>/` (the name may have a date prefix)

2. **Check the checklist**
   - Read DONE.md
   - Count criteria met vs total
   - If not 100% complete, warn the user

3. **Show a verification summary**
   ```
   Verifying: caching-strategy

   Acceptance checklist:
   - Functional criteria: 4/4
   - Code quality: 4/4
   - Testing: 2/3 (missing coverage >= 70%)
   - Security: 2/2
   - Documentation: 4/4

   Total: 16/17 criteria (94%)

   There are pending criteria. Continue anyway?
   ```

4. **If confirmed, mark as DONE**
   - Update status in SPEC.md to `DONE`
   - Update the "Finished" field in SPEC.md with current date/time (`YYYY-MM-DD HH:mm`)
   - Update the "Finished" field in DONE.md with current date/time
   - Update the PHASES.md header with final progress

5. **Compute and show duration**
   - Read the "Started" date from SPEC.md
   - Compute the difference with the current date/time
   - Show the feature's total duration

6. **Confirm completion**
   ```
   Spec marked as DONE

   Spec: specs/20260201-1900-caching-strategy/

   Timing:
   - Started: 2026-02-01 19:00
   - Finished: 2026-02-01 23:45
   - Duration: 4h 45m

   Summary:
   - Phases complete: 4/4
   - Criteria met: 17/17
   ```

## Date Format

- **Finished:** `YYYY-MM-DD HH:mm` (e.g. `2026-02-01 23:45`)
- Duration is computed automatically from Started to Finished

## Notes

- Specs are NOT moved to another folder, only the status is updated
- The spec stays in `specs/` for future reference
- Duration is calendar time, not just active working time
