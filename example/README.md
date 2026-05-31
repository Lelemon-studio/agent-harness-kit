# Worked example - what an adopted harness looks like

The files under `template/examples/` are blank templates full of `<placeholders>`.
This folder is the **filled-in version**: a single, internally-consistent example of
a project that has actually adopted the harness, so you can see what "good" looks like
before you write your own.

It's a fictional product - **Tindo**, a multi-tenant B2B invoicing SaaS - chosen
because a real multi-tenant app exercises every rule (tenant isolation, async jobs,
soft deletes, structured logging). Nothing here is meant to be installed; read it
next to the templates and the docs.

## The project at a glance

Tindo is a small monorepo: a Fastify API and a Next.js dashboard, multi-tenant,
Postgres + Drizzle, Redis/BullMQ for jobs. One person runs it.

```
tindo/                       (this example)
├── CLAUDE.md                # root instructions - the map + global conventions
├── .claude/
│   └── rules/
│       ├── workspace.md     # how work flows: branching, PRs, migrations, deploys
│       └── ops-patterns.md  # deploy / rollback / incident runbook
├── apps/
│   ├── api/CLAUDE.md        # the API's own rules (stack, architecture, patterns)
│   └── web/CLAUDE.md        # the dashboard's own rules
└── docs/
    └── anti-patterns/
        └── backend.md       # the mistakes that recur in the API, with fixes
```

## What to notice

- **The root CLAUDE.md is a map, not a manual.** It says where things are and the
  global conventions, then defers to each app's own `CLAUDE.md`. It does not repeat
  the apps' rules. (See [`docs/WORKSPACE-STRUCTURE.md`](../docs/WORKSPACE-STRUCTURE.md).)
- **Rules are stated as decisions + a reason** ("X because Y"), not bare prohibitions.
  The reason is what lets an agent generalize to a case nobody listed. (See
  [`docs/WRITING-CLAUDE-MD.md`](../docs/WRITING-CLAUDE-MD.md).)
- **The layers cohere.** The tenant-isolation rule in `apps/api/CLAUDE.md`, the
  "no query without orgId" line in `docs/anti-patterns/backend.md`, and the migration
  rule in `.claude/rules/workspace.md` are the same project's spine, stated where each
  belongs. Nothing contradicts anything else.
- **Deterministic rules became hooks, not prose.** "Confirm before push" and "no
  secrets in commits" aren't in these docs as hopeful reminders - they're hooks (see
  [`template/.claude/hooks/`](../template/.claude/hooks/)). The docs hold what needs
  judgment.

## See also

- A filled **spec**: [`template/specs/EXAMPLE-add-rate-limiting/`](../template/specs/EXAMPLE-add-rate-limiting/)
  - a mid-flight feature plan for adding rate limiting to exactly this kind of API.
- A filled **memory** entry: [`template/memory/EXAMPLE-memory.md`](../template/memory/EXAMPLE-memory.md).
- The blank templates these are filled from: [`template/examples/`](../template/examples/).
