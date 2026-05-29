Create a new feature spec using the planning system.

The feature name is passed in $ARGUMENTS (example: `/spec drizzle-validation`).

## Steps

1. **Validate arguments**
   - If no name is given, ask the user for one
   - The name must be kebab-case (e.g. `add-user-auth`, `fix-n1-queries`)

2. **Create the `specs/` folder if missing**
   - If the project has no `specs/`, create it at the project root

3. **Create the structure**
   Create the folder named `YYYYMMDD-HHMM-<name>` under `specs/`:
   ```
   specs/YYYYMMDD-HHMM-<name>/
   ├── SPEC.md
   ├── PHASES.md
   ├── SESSION.md
   └── DONE.md
   ```

4. **Generate the files from the inline templates**
   Replace in every file:
   - `{{FEATURE_NAME}}` -> feature name in Title Case
   - `{{DATETIME}}` -> current date and time as `YYYY-MM-DD HH:mm`
   - `{{DATE}}` -> current date (`YYYY-MM-DD`)

### SPEC.md

```markdown
# {{FEATURE_NAME}}

> **Status:** `IN_PROGRESS`
> **Started:** {{DATETIME}}
> **Finished:** -

---

## Summary

<!-- 2-3 sentences explaining WHAT this change is -->

## Problem

<!-- What problem are we solving? Why does it matter now? -->

## Proposal

<!-- High-level description of the solution -->

## Goals

<!-- What we WILL do -->
- [ ] Goal 1
- [ ] Goal 2

## Non-Goals

<!-- What we will NOT do (and why) -->
- We won't do X because...

## Technical Context

<!-- References to docs, existing code, prior decisions -->

| Resource | Location |
|----------|----------|
| Relevant doc | `path/to/file.md` |
| Related code | `src/modules/...` |

## Alternatives Considered

### Option A: {{name}}
- **Pros:** ...
- **Cons:** ...

### Option B: {{name}} (chosen)
- **Pros:** ...
- **Cons:** ...

**Decision:** We chose B because...

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ... | High/Med/Low | High/Med/Low | ... |

## References

- [Link to related RFC/ADR]()
- [Link to issue/ticket]()
```

### PHASES.md

```markdown
# Phases - {{FEATURE_NAME}}

> Progress: **0/N phases complete**
> Last updated: {{DATETIME}}

---

## Phase 1: {{Phase name}}

> **Status:** `PENDING`
> **Success criterion:** {{How we know it's complete}}

### Tasks

- [ ] Task 1.1 - Description
- [ ] Task 1.2 - Description

### Verification

\`\`\`bash
# Command(s) to verify the phase is complete
\`\`\`

### Notes

<!-- Observations during execution -->

---

## Phase 2: {{Phase name}}

> **Status:** `PENDING`
> **Success criterion:** {{How we know it's complete}}
> **Depends on:** Phase 1

### Tasks

- [ ] Task 2.1 - Description

### Verification

\`\`\`bash
# Command(s) to verify
\`\`\`

### Notes

---

## Progress Summary

| Phase | Status | Tasks | Verified |
|-------|--------|-------|----------|
| 1. {{name}} | pending | 0/2 | - |
| 2. {{name}} | pending | 0/1 | - |
```

### SESSION.md

```markdown
# Session Context - {{FEATURE_NAME}}

> **Purpose:** Information to resume work quickly each session.
> Read this file at the start of every work session.

---

## Current State

**Current phase:** 1 of N
**Start date:** {{DATE}}
**Last task completed:** -
**Next task:** ...

## Key Files

| File | Why it's relevant |
|------|-------------------|
| `path/to/file.ts` | Contains... |

## Frequent Commands

\`\`\`bash
# Run related tests
npm test -- --grep "feature-name"
\`\`\`

## Decisions Made

| Date | Decision | Reason |
|------|----------|--------|
| {{DATE}} | ... | ... |

## Blockers / Open Items

- [ ] Pending: ...

## Notes from Previous Sessions

### Session {{DATETIME}}
- Completed: ...
- Next steps: ...
```

### DONE.md

```markdown
# Acceptance Checklist - {{FEATURE_NAME}}

> **Purpose:** Verify the feature meets every criterion before calling it DONE.
> All items must be checked before closing.
>
> **Finished:** -

---

## Functional Criteria

- [ ] Criterion 1: ...
- [ ] Criterion 2: ...

## Technical Criteria

### Code Quality
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] No stray debug code

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing

### Performance
- [ ] No N+1 queries
- [ ] Queries paginated where applicable

### Security
- [ ] Inputs validated
- [ ] Permissions checked
- [ ] No sensitive data in logs

## Documentation

- [ ] SPEC.md updated with final decisions
- [ ] PHASES.md with all phases complete
- [ ] Code is self-documenting (clear names)

## Final Verification

**Result:** pending

## Closing Notes

### Technical Debt Identified
- [ ] TODO: ...

### Future Improvements
- Idea for next iteration: ...
```

5. **Show a summary**
   Tell the user:
   - Location of the created files
   - Recorded start date/time
   - Recommended next steps:
     1. Fill in SPEC.md with the problem and proposal
     2. Define the phases in PHASES.md
     3. Start working

6. **Offer initial help**
   Ask if they want help filling in SPEC.md or defining the phases from a
   description of the work.
