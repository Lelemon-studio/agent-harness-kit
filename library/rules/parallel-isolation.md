---
paths:
  - "**/orchestration/**"
---

# Mandatory isolation when parallelizing agents

Hard rule. If you run more than one agent against the same repo, **each one works in its own
isolated workspace, provisioned by the resource broker** — never in the shared working
directory. Enforce it, don't request it: the recurring failure mode is agents working in the
same place and mixing each other's changes. This eliminates it.

## Forbidden

- Launching parallel agents all pointing at the same working directory.
- An agent "picking a free port" or using the dev database directly. That's what clashes.
- Spinning up a container (Postgres/Redis) per agent. Reuse the shared one.

## Do this instead

Before fan-out, provision one workspace per worker with the broker
(`orchestration/workspace.mjs`):

```bash
node workspace.mjs setup-template --repo <profile>   # once (or after a schema change)
node workspace.mjs alloc --repo <profile> --index <i>  # worktree + port + DB + redis
# ... agent <i> works in <repo>-wt-<i>, with its .env.local already set ...
node workspace.mjs free  --repo <profile> --index <i>  # cleanup: worktree + branch + DB
```

Each worker gets disjoint resources by index (deterministic, no clashes): worktree `…-wt-<i>`,
app port `webBase + i`, database `<prefix><i>` (TEMPLATE clone), Redis logical DB `/<i>`.

## In workflows (Workflow tool)

- Use `isolation: 'worktree'` on each `agent()` that writes files, or the broker for the full
  workspace (worktree + ports + DB) when the agent also runs the app/tests.
- The agent's index (in `parallel()`/`pipeline()`) maps 1:1 to the broker's `--index`.
- Pass each agent its worktree path and `.env.local` in the prompt. Never assume the cwd.

Implementation details: `orchestration/README.md`.
