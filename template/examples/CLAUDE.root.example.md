# CLAUDE.md - <Workspace name> (root)

<!--
Root instructions for a multi-project workspace. This is loaded every session.
Keep it to the map + global conventions; each sub-project has its own CLAUDE.md.
See docs/WRITING-CLAUDE-MD.md and docs/WORKSPACE-STRUCTURE.md.
-->

## What this is

<One paragraph: what this workspace holds and who runs it. e.g. "Monorepo for
<studio>: the product apps, client work, feature specs, and the agent harness.">

## Structure

```
workspace/
├── app-one/        # <stack> - see app-one/CLAUDE.md
├── app-two/        # <stack> - see app-two/CLAUDE.md
├── clients/<slug>/ # per-client context (README is the status of record)
├── specs/          # planning system (/spec)
└── .claude/        # the harness (hooks, commands, agents)
```

## How to work here

1. Identify the sub-project; read its `CLAUDE.md` before touching it.
2. If the task touches a client, read `clients/<slug>/README.md` first.
3. Check `specs/` for an in-progress spec related to the task.

## Conventions (workspace-wide)

- **Commits:** `type(scope): description` (feat, fix, docs, refactor, chore, ...).
- **Language:** <code in English / content in your language>.
- **No loose files at the root** - everything has a folder.
- **Never commit secrets** (`.env`, credentials, tokens).
- **Don't commit or push without being asked** (a hook confirms pushes).

## Sub-projects

- **app-one** - <one line> - `app-one/CLAUDE.md`
- **app-two** - <one line> - `app-two/CLAUDE.md`
