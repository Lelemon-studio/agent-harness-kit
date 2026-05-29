#!/usr/bin/env bash
# agent-harness-kit installer (macOS / Linux / WSL).
# Copies the harness into a target project. Run from the kit root:
#   ./install.sh /path/to/your/project
# Defaults the target to the current directory.
set -euo pipefail

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$KIT/template"
TARGET="${1:-$(pwd)}"

[ -d "$TARGET" ] || { echo "Target does not exist: $TARGET" >&2; exit 1; }
echo "Installing harness into: $TARGET"

# 1. Hooks + commands (additive)
mkdir -p "$TARGET/.claude/hooks" "$TARGET/.claude/commands"
cp "$SRC/.claude/hooks/"* "$TARGET/.claude/hooks/"
cp "$SRC/.claude/commands/"* "$TARGET/.claude/commands/"
chmod +x "$TARGET/.claude/hooks/"*.py 2>/dev/null || true
echo "  + .claude/hooks/ and .claude/commands/"

# 2. settings.json - don't clobber an existing one
if [ -f "$TARGET/.claude/settings.json" ]; then
  cp "$SRC/.claude/settings.json" "$TARGET/.claude/settings.kit.json"
  echo "  ! .claude/settings.json exists - wrote settings.kit.json instead. Merge the hooks block by hand."
else
  cp "$SRC/.claude/settings.json" "$TARGET/.claude/settings.json"
  echo "  + .claude/settings.json"
fi

# 3. Spec templates
mkdir -p "$TARGET/specs/_templates"
cp "$SRC/specs/_templates/"* "$TARGET/specs/_templates/"
echo "  + specs/_templates/"

cat <<'EOF'

Done. Next steps:
  1. Append gitignore-snippet.txt to your project's .gitignore
  2. The memory system lives in Claude Code's auto-memory dir, not the repo.
     See docs/MEMORY-SYSTEM.md. Seed your MEMORY.md from template/memory/.
  3. Hooks require Python on PATH. Test: open Claude Code and try 'git push'.
EOF
