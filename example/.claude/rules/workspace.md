# Workspace rules - Tindo

How work flows in this repo. Referenced from the root `CLAUDE.md`; read on demand.

## Branching and PRs

- Work on `feature/<short-name>` or `fix/<short-name>`, never directly on `main`.
- One logical change per PR, small enough to review in one sitting.
- The PR description states what changed and how it was verified (tests run, manual
  check, screenshot for UI).

## Where things go

- A feature with multiple steps -> start a spec (`/spec <name>`); the plan lives in
  `specs/`.
- A schema change -> edit `apps/api/src/db/schema.ts`, then `pnpm db:generate`. Never
  hand-edit the generated SQL.
- Harness changes (hooks, commands, rules) -> versioned under `.claude/` with a clear
  commit, so future sessions inherit them.

## Migrations and data

- Migrations are generated from the schema, applied with `pnpm db:migrate`, and
  reviewed in the PR like any code.
- Destructive migrations (drop/rename a column, backfill, bulk update) require: a
  written rollback note in the PR, and running against a staging copy first.
- Never run ad-hoc SQL against production to "just fix it." Write a migration or a
  one-off script that's reviewed.

## Deploys

- Deploys are push-to-deploy: merging to `main` ships. So a push is outward-facing -
  confirm before it runs (a hook enforces this) and make sure the build is green.
- Follow `.claude/rules/ops-patterns.md` (or `/deploy`) for the full sequence.
- API and web deploy independently; if a change spans both, ship the API first
  (backward-compatible), then the web.

## Definition of done

- `pnpm build`, `pnpm lint`, and `pnpm test` pass for every app you touched.
- New API routes have an integration test asserting tenant scoping.
- The spec's `DONE.md` checklist (if any) is satisfied.
- If a rule or pattern changed, the relevant `CLAUDE.md` is updated in the same change.
