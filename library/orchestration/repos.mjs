// Resource broker — project profiles loader.
//
// Profiles live OUTSIDE this code, in a gitignored `broker.config.json` (copy
// `broker.config.example.json` and fill in your values). This keeps credentials,
// ports and project names out of source control and makes the broker reusable
// across projects.
//
// Each worker gets isolated resources, deterministic by index:
//   - app port  = webBase + index   (no "find a free port" — math, so no clashes)
//   - database  = one shared Postgres, a per-worker DB `<workerDbPrefix><index>`
//                 cloned via `CREATE DATABASE ... TEMPLATE`
//   - redis     = isolated logical DB (redis://host:port/<index>)

import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Workspace root: where project repos live as siblings. Set BROKER_WORKSPACE_ROOT to
// point at it explicitly; otherwise it's derived as three levels up from this file
// (assumes the broker lives at <workspace>/<dir>/<subdir>/). Use the env var when the
// broker is installed at a different depth.
const WORKSPACE_ROOT = process.env.BROKER_WORKSPACE_ROOT
  ? path.resolve(process.env.BROKER_WORKSPACE_ROOT)
  : path.resolve(HERE, '..', '..', '..');

const CONFIG_PATH = process.env.BROKER_CONFIG
  ? path.resolve(process.env.BROKER_CONFIG)
  : path.join(HERE, 'broker.config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(
      `Missing broker config: ${CONFIG_PATH}\n` +
      `Copy broker.config.example.json to broker.config.json and fill in your project profile.`
    );
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`Invalid JSON in ${CONFIG_PATH}: ${err.message}`);
  }
  // Drop comment keys (e.g. "_comment").
  for (const k of Object.keys(raw)) if (k.startsWith('_')) delete raw[k];
  return raw;
}

function expandHome(p) {
  if (typeof p === 'string' && (p === '~' || p.startsWith('~/') || p.startsWith('~\\'))) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

const CONFIG = loadConfig();

export function getRepo(name) {
  const profile = CONFIG[name];
  if (!profile) {
    const known = Object.keys(CONFIG).join(', ') || '(none)';
    throw new Error(`Unknown project: "${name}". Profiles in broker config: ${known}. Add one in ${path.basename(CONFIG_PATH)}.`);
  }
  // Resolve the repo root: explicit absolute repoRoot, or repoSubdir under the workspace root.
  const repoRoot = profile.repoRoot
    ? path.resolve(expandHome(profile.repoRoot))
    : path.join(WORKSPACE_ROOT, profile.repoSubdir || name);
  const pkgManager = profile.pkgManager
    ? { ...profile.pkgManager, bin: expandHome(profile.pkgManager.bin) }
    : null;
  return { name, ...profile, repoRoot, pkgManager };
}

// Compute all resources for a worker, deterministic by index. The database and Redis
// blocks are optional — a project with neither still gets worktree + port isolation.
export function workerResources(repo, index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`index must be an integer >= 0 (got: ${index})`);
  }
  const maxWorkers = repo.maxWorkers ?? repo.redis?.maxLogicalDbs ?? 16;
  if (index >= maxWorkers) {
    throw new Error(`index ${index} exceeds maxWorkers (${maxWorkers}). Raise maxWorkers in the profile or use fewer workers.`);
  }
  const worktreePath = path.join(path.dirname(repo.repoRoot), `${repo.worktreePrefix}${index}`);
  const res = {
    index,
    worktreePath,
    branch: `wf/worker-${index}`,
    webPort: repo.webBase + index,
    mcpPort: repo.mcpBase + index,
  };
  if (repo.db) {
    const { host, port, user, password } = repo.db;
    res.dbName = `${repo.db.workerDbPrefix}${index}`;
    res.databaseUrl = `postgres://${user}:${password}@${host}:${port}/${res.dbName}`;
  }
  if (repo.redis) {
    res.redisUrl = `redis://${repo.redis.host}:${repo.redis.port}/${index}`;
  }
  return res;
}
