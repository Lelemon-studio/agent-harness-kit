Mark a feature/spec as complete.

The feature name is passed in $ARGUMENTS (example: `/spec-done caching-strategy`).

## Steps

1. **Verify the spec exists**
   - Look in `specs/*<name>/` (the name may have a date prefix)

2. **Check the checklist**
   - Read DONE.md
   - Count criteria met vs total
   - If not 100% complete, warn the user

3. **Run the automated criteria (the stop condition)**
   - For each criterion that carries a `verify:` line, run its command from the repo root.
   - Exit 0 = PASS, anything else = FAIL. Capture the exit code; on FAIL keep the last lines of output.
   - Criteria tagged `(manual)` are NOT run - they go to the manual list below.
   - This is the gate: the spec is done because the sensors say PASS, not because it looks done.

4. **Show a verification summary**
   ```
   Verifying: caching-strategy

   Automated (verify:):
   - PASS  npm run build
   - PASS  npx tsc --noEmit
   - FAIL  npm test -- caching (exit 1)
           > 1 failing: cache evicts on TTL

   Manual (need human confirm):
   - [ ] SPEC.md decisions match what shipped
   - [ ] Cache headers look right in the browser

   Automated: 2/3 PASS  |  Manual: 0/2 confirmed
   ```

5. **Gate on the result**
   - If any automated `verify:` FAILED, STOP. Do not mark the spec DONE. Report which
     commands failed and their output; the work isn't finished.
   - If all automated checks PASS but manual items remain, ask the user to confirm each
     manual item explicitly. Do not assume - a manual check is unconfirmed until the human says so.
   - Only proceed once every automated check is PASS and every manual item is human-confirmed.
   - Check off the criteria in DONE.md as they pass / get confirmed.

6. **If gated through, mark as DONE**
   - Update status in SPEC.md to `DONE`
   - Update the "Finished" field in SPEC.md with current date/time (`YYYY-MM-DD HH:mm`)
   - Update the "Finished" field in DONE.md with current date/time
   - Update the PHASES.md header with final progress

7. **Compute and show duration**
   - Read the "Started" date from SPEC.md
   - Compute the difference with the current date/time
   - Show the feature's total duration

8. **Confirm completion**
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
