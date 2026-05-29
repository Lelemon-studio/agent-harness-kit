#!/usr/bin/env python3
"""PreToolUse(Write|Edit|MultiEdit): denies writes that add emojis to
customer-facing source, BEFORE the edit lands on disk.

Example sensor: emojis read as amateur in customer-facing web/brand copy, so this
denies them in a narrow, configured set of files. Adapt MATCH_SUFFIXES /
MATCH_PATH_SUBSTRINGS below to your project (or delete this hook if you don't
care about emojis). It's here mainly as a worked example of a *preventive*,
high-precision, Windows-safe hook.

Three things worth copying regardless of the emoji rule:

1. It runs as PreToolUse, not PostToolUse. PostToolUse cannot block (the docs are
   explicit: the tool already ran). To actually PREVENT a write, you must inspect
   the incoming content in PreToolUse and return permissionDecision "deny".

2. It reads stdin as UTF-8 explicitly. Claude Code sends UTF-8 JSON, but Python's
   stdin defaults to the locale encoding (cp1252 on Windows), which would fail to
   decode the very non-ASCII bytes this hook exists to catch and then silently
   exit — a sensor that fails closed-and-quiet is worse than no sensor.

3. Scope is deliberately narrow (high precision over high coverage). A hook with
   false positives erodes trust and gets disabled. Better to catch 95% cleanly
   than 100% with noise.
"""
import json
import re
import sys

# --- Configure for your project --------------------------------------------
# Only files matching these are checked. Keep this narrow.
MATCH_SUFFIXES = (".astro", ".liquid")          # always-checked extensions
# .tsx is only checked inside these path fragments (so internal tooling .tsx is
# left alone). Empty tuple = never check .tsx.
TSX_PATH_SUBSTRINGS = ("/apps/web/", "/src/pages/", "/src/components/")
IGNORE_IF_PATH_CONTAINS = ("node_modules",)
# ---------------------------------------------------------------------------

# Read stdin as UTF-8 explicitly (see docstring point 2).
try:
    raw = sys.stdin.buffer.read().decode("utf-8")
    data = json.loads(raw)
except Exception:
    sys.exit(0)

tool_input = data.get("tool_input") or {}
path = tool_input.get("file_path", "")
if not path or any(s in path for s in IGNORE_IF_PATH_CONTAINS):
    sys.exit(0)

p = path.replace("\\", "/")
is_tsx_in_scope = p.endswith(".tsx") and any(frag in p for frag in TSX_PATH_SUBSTRINGS)
if not (p.endswith(MATCH_SUFFIXES) or is_tsx_in_scope):
    sys.exit(0)

# Gather the text this tool would write, across Write / Edit / MultiEdit shapes.
chunks = []
if "content" in tool_input:                       # Write
    chunks.append(tool_input["content"])
if "new_string" in tool_input:                    # Edit
    chunks.append(tool_input["new_string"])
for edit in tool_input.get("edits") or []:        # MultiEdit
    if isinstance(edit, dict) and "new_string" in edit:
        chunks.append(edit["new_string"])

text = "\n".join(c for c in chunks if isinstance(c, str))
if not text:
    sys.exit(0)

# Colorful emoji block (U+1F000-U+1FAFF) + the emoji-presentation selector
# (U+FE0F). Plain typographic marks (arrows, checks) are left alone on purpose.
emoji = re.compile("[\U0001F000-\U0001FAFF️]")
hits = sorted(set(emoji.findall(text)))

if hits:
    reason = (
        "No-emoji rule: the content about to be written to %s contains emojis "
        "(%s). Remove them before writing."
        % (path, " ".join(hits))
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))

sys.exit(0)
