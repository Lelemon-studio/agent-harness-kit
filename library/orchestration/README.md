# Resource broker — isolated workspace per worker

Provisions an isolated workspace per worker so parallel agents never clobber each other's
files or clash on ports/databases. Each worker gets resources that are deterministic by index:

| Resource | Isolation | Worker 0 | Worker 1 |
|----------|-----------|----------|----------|
| Filesystem + git | own worktree | `…-wt-0` (branch `wf/worker-0`) | `…-wt-1` |
| `node_modules` | install in the worktree | — | — |
| App port | `webBase + index` | 3100 | 3101 |
| Database (optional) | own DB cloned via TEMPLATE on the shared Postgres | `wt_0` | `wt_1` |
| Redis (optional) | logical DB by index | `…/0` | `…/1` |

No container per worker: a single shared Postgres and a single shared Redis. The database and
Redis blocks are **optional** — drop them and you still get worktree + port isolation, so the
broker stays agnostic to your stack.

## Coordination (no DB, no Redis, no daemon)

Index assignment is coordinated by a **filesystem slot registry** under the repo's shared git
dir (`<git-common-dir>/agent-broker-slots/`). Every worktree of a repo shares that dir, so
**independent broker invocations on the same machine coordinate without talking to each other**
or to any datastore. `alloc` atomically claims the first free index; `free` releases it.

This answers the multi-agent question directly: two agents, each in its own worktree, each
running its own copy of the broker, **will not collide** — they claim distinct slots (and thus
distinct ports/databases) through the shared registry. Cross-machine there's nothing to
coordinate (separate machines are already isolated).

## Configuration

Profiles live in `broker.config.json` (gitignored). Copy the example and fill in your values:

```bash
cp broker.config.example.json broker.config.json
```

Each profile defines the repo location and ports; `db`/`redis` are optional. Credentials and
ports never live in source — only in your local config.

## Usage

```bash
node workspace.mjs setup-template --repo <profile>   # once, if you use per-worker DBs
node workspace.mjs alloc --repo <profile>            # auto-claims the next free slot
node workspace.mjs alloc --repo <profile> --index 2  # or claim a specific index (errors if taken)
node workspace.mjs list --repo <profile>             # claimed slots + worktrees + DBs
# ... the agent works in <repo>-wt-<i> (its .env.local is ready) ...
node workspace.mjs free  --repo <profile> --index <i>  # cleanup: worktree + branch + DB + slot
```

## How the orchestrator consumes it

A single Workflow can assign indices to its workers, or each agent can just call `alloc` with no
`--index` and get a free slot. Either way the agent works in `…-wt-<i>` with its `.env.local`
already set, and runs `free` at the end. The agent never picks a port or touches another
worker's DB — isolation is enforced, not requested. See `qa-workflow.mjs` for a full template.

## Notes / current limits

- `maxWorkers` (profile, default 16) caps concurrent workers.
- A slot outlives the ephemeral `alloc` process and is released by `free`. A crashed alloc that
  left a slot behind is auto-reclaimed only once its worktree is gone; `list` flags such slots.
- `node_modules`: installed per worktree. A junction to the main repo's `node_modules` does NOT
  work with bun's layout on Windows (tsc can't resolve types). Future optimization: install once
  into a shared pristine store and junction workers to it (workers only read).
- Talks to Postgres via `docker exec`, so no host psql is required.
