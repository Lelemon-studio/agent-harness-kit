# Resource broker — isolated workspace per worker

Provisions an isolated workspace per worker so parallel agents never clobber each other's
files or clash on ports/databases. Each worker gets resources that are deterministic by index:

| Resource | Isolation | Worker 0 | Worker 1 |
|----------|-----------|----------|----------|
| Filesystem + git | own worktree | `…-wt-0` (branch `wf/worker-0`) | `…-wt-1` |
| `node_modules` | install in the worktree | — | — |
| App port | `webBase + index` | 3100 | 3101 |
| Database | own DB cloned via TEMPLATE on the shared Postgres | `wt_0` | `wt_1` |
| Redis (queues) | logical DB by index | `…/0` | `…/1` |

No container per worker: a single shared Postgres and a single shared Redis.

## Configuration

Profiles live in `broker.config.json` (gitignored). Copy the example and fill in your values:

```bash
cp broker.config.example.json broker.config.json
```

Each profile defines the repo location, ports, the shared Postgres container, and the package
manager. Credentials and ports never live in source — only in your local config.

## Usage

```bash
node workspace.mjs setup-template --repo <profile>   # once (or after a schema change)
node workspace.mjs alloc --repo <profile> --index 0  # worktree + port + DB wt_0 + redis/0
# ... the agent works in <repo>-wt-0 (its .env.local is ready) ...
node workspace.mjs free  --repo <profile> --index 0  # cleanup: worktree + branch + DB
```

## How the orchestrator consumes it

The Workflow tool gives each agent its `index` in `parallel()`/`pipeline()`. Before fan-out,
run `alloc --index i` per worker; each agent works in `…-wt-<i>` with its `.env.local` already
set; at the end run `free --index i`. The agent never picks a port or touches another worker's
DB — isolation is enforced, not requested. See `qa-workflow.mjs` for a full template.

## Notes / current limits

- Up to 16 parallel workers (Redis logical DB limit 0-15). For more, a dedicated Redis per worker.
- `node_modules`: installed per worktree. A junction to the main repo's `node_modules` does NOT
  work with bun's layout on Windows (tsc can't resolve types). Future optimization: install once
  into a shared pristine store and junction workers to it (workers only read).
- Talks to Postgres via `docker exec`, so no host psql is required.
