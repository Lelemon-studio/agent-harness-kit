# CLAUDE.md - Tindo (root)

Tindo is a multi-tenant B2B invoicing SaaS for small businesses: create invoices,
send them, get paid, reconcile. One-person product. This monorepo holds the API, the
dashboard, the feature specs, and the agent harness.

## Structure

```
tindo/
├── apps/
│   ├── api/        # Fastify + Drizzle + Postgres + Redis - see apps/api/CLAUDE.md
│   └── web/        # Next.js dashboard - see apps/web/CLAUDE.md
├── specs/          # planning system (/spec) - one folder per feature
├── docs/
│   └── anti-patterns/   # the recurring mistakes, by area
└── .claude/        # the harness (hooks, commands, agents, rules)
```

## How to work here

Move work through the full cycle: discover -> define -> plan -> build -> verify ->
ship -> measure -> learn. Don't just execute - guide me to the step I'm skipping, and
scale the ceremony to the size of the work. (Methodology: agent-harness-kit
`docs/WAYS-OF-WORKING.md`.)

1. Identify the app (`apps/api` or `apps/web`); read its `CLAUDE.md` before touching it.
2. Check `specs/` for an in-progress spec related to the task; resume it with
   `/spec-continue` instead of starting cold.
3. For a multi-step change, start a spec (`/spec <name>`). For a one-liner, just do it.

## Conventions (workspace-wide)

- **Commits:** `type(scope): description` (feat, fix, docs, refactor, chore, test).
- **Language:** code and identifiers in English; user-facing copy in Spanish (es-CL).
- **Multi-tenant is non-negotiable.** Everything is scoped by `orgId`; the details
  live in `apps/api/CLAUDE.md`. If you're touching data, you're thinking about tenancy.
- **No loose files at the root** - everything has a folder.
- **Never commit secrets** (`.env`, API keys, tokens). A hook denies it.
- **Don't commit or push without being asked** - a push deploys. A hook confirms it.

## The apps

- **api** - the backend: invoices, payments, reconciliation, webhooks. Owns the data
  and all business rules. `apps/api/CLAUDE.md`.
- **web** - the dashboard the customer uses. Thin; talks to the API. `apps/web/CLAUDE.md`.

## Where the rules live

- Workspace flow (branching, migrations, deploys): `.claude/rules/workspace.md`.
- Deploy / rollback / incident runbook: `.claude/rules/ops-patterns.md`.
- API anti-patterns: `docs/anti-patterns/backend.md`.
