# Workspace rules

<!--
A rules file (.claude/rules/workspace.md). Reference it from CLAUDE.md so it's read
on demand. This is a runbook for "how work flows here." Replace with your reality.
See docs/RULES-AND-OPS.md.
-->

## Branching and PRs

- Work on `feature/<short-name>` or `fix/<short-name>`, never directly on the default
  branch.
- One logical change per PR. Keep them small enough to review in one sitting.
- The PR description states what changed and how it was verified.

## Where things go

- New feature with multiple steps -> start a spec (`/spec <name>`).
- Throwaway exploration -> a scratch branch, not the main tree.
- Shared config / harness changes -> versioned under `.claude/` with a clear commit.

## Migrations and data

- Schema changes are generated from the source of truth, never hand-edited after the
  fact.
- Destructive operations (drop, truncate, bulk update) require an explicit
  confirmation step and a backup/rollback note.

## Deploys

- Follow `.claude/rules/ops-patterns.md` (or `/deploy`). Never push straight to
  production without the build + verify steps.
- A push is outward-facing: confirm before it runs (a hook enforces this).

## Definition of done

- Build passes, lint passes, relevant tests pass.
- The spec's `DONE.md` checklist (if any) is satisfied.
- Docs/CLAUDE.md updated if the change altered a rule or pattern.
