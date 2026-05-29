#!/usr/bin/env python3
"""PreToolUse(Bash): forces a confirmation prompt before any outward-facing,
hard-to-reverse git action (git push, gh pr create/merge).

Why a hook and not just a memory/instruction: a push is outward-facing and often
triggers a production deploy. Deterministic enforcement can't be "forgotten" by
the model. Local commits stay advisory (reversible) so the agent isn't nagged on
every commit.

Returns permissionDecision "ask" so the user is prompted; it never hard-blocks.
"""
import json
import re
import sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

cmd = (data.get("tool_input") or {}).get("command", "")

# Match: git push ... | gh pr create ... | gh pr merge ...
risky = re.search(r"(^|[;&|]|\s)(git\s+push|gh\s+pr\s+(create|merge))(\s|$)", cmd)

if risky:
    reason = (
        "Confirm before push/PR: this is outward-facing and may trigger a "
        "production deploy. Show the diff and wait for explicit approval."
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": reason,
        }
    }))

sys.exit(0)
