#!/usr/bin/env python3
"""PreToolUse(WebSearch): append the current year to searches that lack any
temporal anchor, so results skew recent instead of stale.

A query that already names a year or uses a recency word (latest, recent,
current, new, now, today) is left untouched.
"""
import json
import re
import sys
from datetime import datetime

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

query = (data.get("tool_input") or {}).get("query", "")
temporal_words = ("latest", "recent", "current", "new", "now", "today")
has_year = re.search(r"\b20\d{2}\b", query)
has_temporal = any(w in query.lower() for w in temporal_words)

if query and not has_year and not has_temporal:
    query = f"{query} {datetime.now().year}"
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "modifiedToolInput": {"query": query},
        }
    }))

sys.exit(0)
