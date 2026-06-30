#!/usr/bin/env python3
"""PreToolUse(Bash): runs the project's fast, deterministic checks before an
outward-facing git action and BLOCKS it if any fails.

This is the loop's verify step made non-optional: the agent can't push code that
fails typecheck/lint, instead of being trusted to remember to run them. See
docs/LOOP-ENGINEERING.md (deterministic sensors) and docs/HARNESS.md (Layer 2).

Design choices worth copying:

1. Gates `git push` by default (the deploy boundary), not every commit, so the
   agent isn't blocked on a check dozens of times a day. Add "git commit" to
   GATE_ON if your checks are fast and you want the loop tighter.

2. HIGH PRECISION: it only runs checks the project actually declares. For a JS
   project it runs the package.json scripts named in SCRIPT_CHECKS *that exist*;
   missing scripts and non-JS projects are skipped, so it never false-positives a
   project that hasn't opted in. A blocking sensor that fires wrongly gets disabled.

3. Keep checks FAST. Slow, comprehensive suites belong in CI / on a schedule, not
   in a synchronous pre-push hook. Tune TIMEOUT to your slowest declared check.

4. It reads stdin as UTF-8 (Windows-safe) and FAILS OPEN: any internal error exits
   0, so a broken sensor never blocks the agent. A gate is a safety net, not a cage.

5. On a block it appends one line to EVENT_LOG: a deterministic record of "the agent
   tried to ship a failing change." That's the feedback signal that feeds the loop -
   mine recurring blocks into a rule or memory (see docs/MEMORY-SYSTEM.md).
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime

# --- Configure for your project --------------------------------------------
# Outward-facing git actions to gate. "git push" is the deploy boundary; add
# "git commit" to verify earlier (only if your checks are fast).
GATE_ON = ("git push",)
# package.json scripts to run IF the project declares them. Each runs as
# `<pkg-manager> run <name>`; a script that doesn't exist is silently skipped.
SCRIPT_CHECKS = ("typecheck", "lint")
# Raw shell commands to run regardless of stack, e.g. ("cargo clippy -- -D warnings",)
# or ("go vet ./...",). A command whose tool is missing (exit 127) is skipped.
EXTRA_CHECKS = ()
# Seconds budget per check. A check that exceeds this is treated as a failure.
TIMEOUT = 120
# Append one JSONL line here on each block. Runtime data; gitignore it.
EVENT_LOG = ".claude/harness-events.jsonl"
# Max characters of a failing check's output to surface back to the agent.
MAX_OUTPUT_CHARS = 1200
# ---------------------------------------------------------------------------


def fail_open():
    sys.exit(0)


# Read stdin as UTF-8 explicitly (Python's stdin defaults to cp1252 on Windows).
try:
    raw = sys.stdin.buffer.read().decode("utf-8")
    data = json.loads(raw)
except Exception:
    fail_open()

cmd = (data.get("tool_input") or {}).get("command", "")
if not cmd:
    fail_open()

# Only act on a gated git action (word-bounded so "ungit pushy" etc. won't match).
gated = any(re.search(r"(^|[;&|]|\s)" + re.escape(g) + r"(\s|$)", cmd) for g in GATE_ON)
if not gated:
    fail_open()

project_dir = os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or os.getcwd()


def detect_package_manager(root):
    for lockfile, pm in (
        ("pnpm-lock.yaml", "pnpm"),
        ("bun.lock", "bun"),   # Bun 1.2+ default (text lockfile)
        ("bun.lockb", "bun"),  # older binary lockfile
        ("yarn.lock", "yarn"),
        ("package-lock.json", "npm"),
    ):
        if os.path.exists(os.path.join(root, lockfile)):
            return pm
    return "npm"


def build_checks(root):
    checks = []  # (name, command)
    pkg_path = os.path.join(root, "package.json")
    if os.path.exists(pkg_path):
        try:
            with open(pkg_path, "r", encoding="utf-8") as fh:
                scripts = (json.load(fh) or {}).get("scripts") or {}
        except Exception:
            scripts = {}
        if scripts:
            pm = detect_package_manager(root)
            for name in SCRIPT_CHECKS:
                if name in scripts:
                    checks.append((name, "%s run %s" % (pm, name)))
    for raw_cmd in EXTRA_CHECKS:
        checks.append((raw_cmd, raw_cmd))
    return checks


checks = build_checks(project_dir)
if not checks:
    # Project declares none of the configured checks - stay inert (no false block).
    fail_open()

failures = []  # (name, summary)
for name, check_cmd in checks:
    try:
        proc = subprocess.run(
            check_cmd,
            shell=True,
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        failures.append((name, "timed out after %ds" % TIMEOUT))
        continue
    except Exception:
        # Could not even launch the check - skip rather than false-block.
        continue
    if proc.returncode == 127:
        # Tool not installed on this machine - not the agent's fault; skip.
        continue
    if proc.returncode != 0:
        out = ((proc.stdout or "") + (proc.stderr or "")).strip()
        if len(out) > MAX_OUTPUT_CHARS:
            out = out[-MAX_OUTPUT_CHARS:]
        failures.append((name, out or "exit %d" % proc.returncode))

if not failures:
    fail_open()

# Record the block as a feedback event (best-effort; never let logging block).
try:
    log_path = os.path.join(project_dir, EVENT_LOG)
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as fh:
        fh.write(json.dumps({
            "ts": datetime.now().isoformat(timespec="seconds"),
            "event": "verify_gate_block",
            "command": cmd,
            "failed": [name for name, _ in failures],
        }) + "\n")
except Exception:
    pass

detail = "\n\n".join("[%s]\n%s" % (name, summary) for name, summary in failures)
reason = (
    "Verify gate: %d check(s) failed, so this action is blocked. Fix them and retry "
    "(do not work around the gate).\n\n%s" % (len(failures), detail)
)
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": reason,
    }
}))
sys.exit(0)
