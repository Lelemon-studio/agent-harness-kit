#!/usr/bin/env node
// Resource broker — provisions an isolated workspace per worker so parallel
// agents never clobber each other's files or clash on ports/DBs:
//   - own git worktree (isolated filesystem + branch)
//   - node_modules installed in the worktree (a junction does not work with bun's
//     layout on Windows; tsc can't resolve types through it)
//   - deterministic app port by index (webBase + index)
//   - own database `<workerDbPrefix><index>` cloned via TEMPLATE on the shared Postgres
//   - isolated Redis logical DB (redis://host:port/<index>)
//
// Usage:
//   node workspace.mjs setup-template --repo <name> [--force]
//   node workspace.mjs alloc --repo <name> --index 0
//   node workspace.mjs free  --repo <name> --index 0
//   node workspace.mjs list  --repo <name>
//
// Talks to Postgres via `docker exec` so it doesn't need psql on the host.
// Project profiles live in broker.config.json (see broker.config.example.json).

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { getRepo, workerResources } from './repos.mjs';
import { claimSlot, releaseSlot, listSlots } from './slots.mjs';

// ---------- helpers ----------

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : '';
    const stdout = err.stdout ? String(err.stdout).trim() : '';
    const detail = stderr || stdout || err.message;
    throw new Error(`Failed: ${cmd} ${args.join(' ')}\n  -> ${detail}`);
  }
}

function log(msg) { process.stdout.write(msg + '\n'); }

function ensureContainerRunning(container) {
  const out = run('docker', ['ps', '--filter', `name=^/${container}$`, '--format', '{{.Names}}']);
  if (!out.split('\n').map(s => s.trim()).includes(container)) {
    throw new Error(`Container "${container}" is not running. Start the shared Postgres first and retry.`);
  }
}

// Run SQL in the container's Postgres, connecting to `db`.
function psql(repo, db, sql) {
  const { container, user } = repo.db;
  return run('docker', [
    'exec', container,
    'psql', '-U', user, '-d', db,
    '-v', 'ON_ERROR_STOP=1',
    '-tAc', sql,
  ]);
}

function dbExists(repo, name) {
  const out = psql(repo, 'postgres', `SELECT 1 FROM pg_database WHERE datname = '${name}'`);
  return out.trim() === '1';
}

function dropDb(repo, name) {
  // WITH (FORCE) terminates active connections (Postgres 13+).
  psql(repo, 'postgres', `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
}

function createDbFromTemplate(repo, name, template) {
  psql(repo, 'postgres', `CREATE DATABASE "${name}" TEMPLATE "${template}"`);
}

// ---------- commands ----------

function cmdSetupTemplate(repo, args) {
  if (!repo.db) {
    throw new Error(`Profile "${repo.name}" has no "db" block; setup-template only applies to projects with a database.`);
  }
  ensureContainerRunning(repo.db.container);
  const { templateDb, sourceDb } = repo.db;

  if (dbExists(repo, templateDb)) {
    if (!args.force) {
      log(`Template "${templateDb}" already exists. Use --force to recreate it from "${sourceDb}".`);
      return;
    }
    log(`Dropping existing template "${templateDb}"...`);
    dropDb(repo, templateDb);
  }

  log(`Creating template "${templateDb}" by cloning "${sourceDb}"...`);
  log(`(if this fails due to active connections: stop the dev server / worker using "${sourceDb}" and retry)`);
  createDbFromTemplate(repo, templateDb, sourceDb);
  log(`Done. Template "${templateDb}" created. Each worker clones from it in <1s.`);
}

function cmdAlloc(repo, args) {
  const maxWorkers = repo.maxWorkers ?? 16;
  const preferred = (args.index !== undefined && args.index !== true) ? Number(args.index) : null;
  const hasDb = !!repo.db;

  if (hasDb) {
    ensureContainerRunning(repo.db.container);
    if (!dbExists(repo, repo.db.templateDb)) {
      throw new Error(`Template "${repo.db.templateDb}" does not exist. Run first: node workspace.mjs setup-template --repo <name>`);
    }
  }

  // Claim a machine-global slot for this repo. Atomic + filesystem-based (no DB/Redis),
  // so independent broker invocations never land on the same index/port/database. A slot
  // is auto-reclaimable only if its worktree is gone (genuine crash cleanup).
  const worktreeFor = (i) => path.join(path.dirname(repo.repoRoot), `${repo.worktreePrefix}${i}`);
  const index = claimSlot(repo.repoRoot, maxWorkers, preferred, args.label ?? null, (i) => !fs.existsSync(worktreeFor(i)));
  let res;
  try {
    res = workerResources(repo, index);
    if (fs.existsSync(res.worktreePath)) {
      throw new Error(`Worktree already exists: ${res.worktreePath}. Free it with: node workspace.mjs free --index ${index}`);
    }

    // 1. Per-worker database (optional; template clone, instant).
    if (hasDb) {
      log(`[${index}] db: ${res.dbName} (clone of ${repo.db.templateDb})`);
      if (dbExists(repo, res.dbName)) dropDb(repo, res.dbName);
      createDbFromTemplate(repo, res.dbName, repo.db.templateDb);
    }

    // 2. git worktree on its own branch.
    log(`[${index}] worktree: ${res.worktreePath} (branch ${res.branch})`);
    run('git', ['-C', repo.repoRoot, 'worktree', 'add', '-b', res.branch, res.worktreePath, repo.baseBranch]);

    // 3. Copy required gitignored files (.env, etc.).
    for (const rel of repo.copyFiles || []) {
      const src = path.join(repo.repoRoot, rel);
      const dst = path.join(res.worktreePath, rel);
      if (fs.existsSync(src)) { fs.copyFileSync(src, dst); log(`[${index}] copied ${rel}`); }
    }

    // 4. node_modules: install in the worktree (a junction does not work with bun's
    //    layout on Windows — tsc cannot resolve types through it).
    if (repo.pkgManager) {
      const { bin, installArgs } = repo.pkgManager;
      const pm = fs.existsSync(bin) ? bin : 'bun'; // fall back to PATH on another machine
      log(`[${index}] installing dependencies (${path.basename(pm)} ${installArgs.join(' ')})... this may take a while`);
      run(pm, installArgs, { cwd: res.worktreePath });
      log(`[${index}] dependencies installed`);
    }

    // 5. Per-worker overrides in .env.local (wins over the copied .env).
    const lines = [
      `# Generated by the resource broker for worker ${index}. Do not edit by hand.`,
      `WORKER_INDEX=${index}`,
      `PORT=${res.webPort}`,
      `MCP_PORT=${res.mcpPort}`,
    ];
    if (res.databaseUrl) lines.push(`DATABASE_URL=${res.databaseUrl}`);
    if (res.redisUrl) lines.push(`REDIS_URL=${res.redisUrl}`);
    lines.push('');
    fs.writeFileSync(path.join(res.worktreePath, '.env.local'), lines.join('\n'), 'utf8');
  } catch (err) {
    releaseSlot(repo.repoRoot, index); // never leak a slot on a failed alloc
    throw err;
  }

  log('');
  log(`Worker ${index} ready. Isolated resources:`);
  log(`  worktree   ${res.worktreePath}`);
  log(`  branch     ${res.branch}`);
  log(`  web        http://localhost:${res.webPort}`);
  if (res.databaseUrl) log(`  db         ${res.databaseUrl}`);
  if (res.redisUrl) log(`  redis      ${res.redisUrl}`);
  log('');
  log(`Start the worker's dev server:`);
  log(`  cd "${res.worktreePath}" && bun run dev -- -p ${res.webPort}`);
}

function cmdFree(repo, args) {
  const index = Number(args.index);
  const res = workerResources(repo, index);

  // 1. Remove worktree + branch.
  if (fs.existsSync(res.worktreePath)) {
    log(`[${index}] removing worktree ${res.worktreePath}`);
    run('git', ['-C', repo.repoRoot, 'worktree', 'remove', '--force', res.worktreePath]);
  } else {
    run('git', ['-C', repo.repoRoot, 'worktree', 'prune']);
  }
  try {
    run('git', ['-C', repo.repoRoot, 'branch', '-D', res.branch]);
    log(`[${index}] branch ${res.branch} deleted`);
  } catch (err) {
    // Branch may not exist if alloc failed midway: warn, don't crash.
    log(`[${index}] note: could not delete branch ${res.branch} (${err.message.split('\n')[0]})`);
  }

  // 2. Drop the worker's database (optional).
  if (repo.db) {
    ensureContainerRunning(repo.db.container);
    if (dbExists(repo, res.dbName)) {
      log(`[${index}] dropping db ${res.dbName}`);
      dropDb(repo, res.dbName);
    }
  }

  // 3. Release the slot so the index is free again.
  releaseSlot(repo.repoRoot, index);
  log(`Worker ${index} freed.`);
}

function cmdList(repo) {
  // Slot registry: the source of truth for which indices are claimed (machine-global).
  log('Claimed slots:');
  const slots = listSlots(repo.repoRoot);
  if (!slots.length) {
    log('  (none)');
  } else {
    const worktreeFor = (i) => path.join(path.dirname(repo.repoRoot), `${repo.worktreePrefix}${i}`);
    for (const s of slots) {
      const stale = !fs.existsSync(worktreeFor(s.index)) ? '  [STALE - worktree gone; run free --index ' + s.index + ']' : '';
      log(`  #${s.index}  pid ${s.pid}  ${s.label || ''}  ${s.at || ''}${stale}`);
    }
  }
  log('');
  log('Worktrees:');
  log(run('git', ['-C', repo.repoRoot, 'worktree', 'list']).trim() || '  (none)');
  if (repo.db) {
    log('');
    log('Worker databases:');
    ensureContainerRunning(repo.db.container);
    const dbs = psql(repo, 'postgres',
      `SELECT datname FROM pg_database WHERE datname LIKE '${repo.db.workerDbPrefix}%' ORDER BY datname`).trim();
    log(dbs ? dbs.split('\n').map(d => '  ' + d).join('\n') : '  (none)');
  }
}

// ---------- main ----------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || args.help) {
    log('Resource broker — isolated workspace per worker.');
    log('Commands: setup-template | alloc --index N | free --index N | list');
    log('Common flag: --repo <profile> (from broker.config.json)');
    return;
  }

  const repoName = args.repo;
  if (!repoName) {
    throw new Error('Missing --repo <profile>. See broker.config.json for available profiles.');
  }

  const repo = getRepo(repoName);
  switch (command) {
    case 'setup-template': return cmdSetupTemplate(repo, args);
    case 'alloc': return cmdAlloc(repo, args);
    case 'free': return cmdFree(repo, args);
    case 'list': return cmdList(repo);
    default:
      throw new Error(`Unknown command: "${command}". Use: setup-template | alloc | free | list`);
  }
}

try {
  main();
} catch (err) {
  process.stderr.write('\nERROR: ' + err.message + '\n');
  process.exit(1);
}
