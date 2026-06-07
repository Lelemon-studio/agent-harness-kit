// Worker-slot registry — datastore-agnostic coordination.
//
// Coordinates index assignment across independent broker invocations on the SAME
// machine so parallel agents never claim the same port/database. No DB, no Redis,
// no daemon - just atomic lockfiles under the repo's shared git dir.
//
// Why the git common dir: every worktree of a repo shares one common .git dir, so
// it's a stable, machine-local, per-project anchor that ALL broker copies agree on
// (whether run from the main checkout, a worktree, or a nested workspace). Two agents
// in two worktrees coordinate through the same registry without talking to each other.

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

function sharedDir(repoRoot) {
  try {
    const common = execFileSync('git', ['-C', repoRoot, 'rev-parse', '--git-common-dir'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const abs = path.isAbsolute(common) ? common : path.join(repoRoot, common);
    return path.join(abs, 'agent-broker-slots');
  } catch {
    // Not a git repo: fall back to a temp dir keyed by the repo path (still machine-local).
    const key = Buffer.from(path.resolve(repoRoot)).toString('hex').slice(0, 16);
    return path.join(os.tmpdir(), 'agent-broker-slots', key);
  }
}

function readSlot(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function writeExclusive(file, data) {
  const fd = fs.openSync(file, 'wx'); // atomic: fails with EEXIST if it already exists
  try { fs.writeSync(fd, data); } finally { fs.closeSync(fd); }
}

// Atomically claim a slot. Returns the claimed index. With `preferred` set, claims
// exactly that index (throws if taken). Otherwise takes the first free one.
//
// A slot OUTLIVES the (ephemeral) process that creates it — it represents a provisioned
// worker and is released by `releaseSlot` (on `free`). So liveness is NOT pid-based.
// Pass `isStale(index)` to auto-reclaim slots whose resources are actually gone (e.g.
// the worktree was deleted) — that's the only safe crash-recovery signal.
export function claimSlot(repoRoot, maxWorkers, preferred = null, label = null, isStale = null) {
  const dir = sharedDir(repoRoot);
  fs.mkdirSync(dir, { recursive: true });
  const at = new Date().toISOString();
  const payload = (i) => JSON.stringify({ index: i, pid: process.pid, label, at });

  const tryClaim = (i) => {
    const file = path.join(dir, `${i}.slot`);
    try {
      writeExclusive(file, payload(i));
      return true;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // Slot taken: reclaim only if its resources are genuinely gone (crash cleanup).
      if (isStale && isStale(i)) {
        try { fs.unlinkSync(file); writeExclusive(file, payload(i)); return true; } catch { return false; }
      }
      return false;
    }
  };

  if (preferred != null) {
    if (tryClaim(preferred)) return preferred;
    throw new Error(`Worker slot ${preferred} is already claimed by another agent. Run "list" to see who holds it, or pick another --index.`);
  }
  for (let i = 0; i < maxWorkers; i++) if (tryClaim(i)) return i;
  throw new Error(`No free worker slots (max ${maxWorkers}). Free one with "free --index N" or raise maxWorkers in the profile.`);
}

export function releaseSlot(repoRoot, index) {
  const file = path.join(sharedDir(repoRoot), `${index}.slot`);
  try { fs.unlinkSync(file); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}

export function listSlots(repoRoot) {
  const dir = sharedDir(repoRoot);
  let files;
  try { files = fs.readdirSync(dir); } catch { return []; }
  return files
    .filter((f) => f.endsWith('.slot'))
    .map((f) => {
      const s = readSlot(path.join(dir, f)) || {};
      return { index: s.index, pid: s.pid, label: s.label, at: s.at };
    })
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}
