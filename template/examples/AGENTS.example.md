# AGENTS.example.md — copy to your repo root as AGENTS.md

> Cross-tool entry point for AI coding agents. [`AGENTS.md`](https://agents.md) is
> the portable, tool-agnostic standard (adopted by Claude Code, Cursor, Codex,
> Copilot, Gemini CLI, Aider, ...). Keep the canonical, detailed instructions in
> `CLAUDE.md`; make this a *thin pointer* so any agent — not just Claude Code —
> gets oriented. Don't duplicate content between the two (it drifts); point here,
> detail there.

## Read these first

1. [`CLAUDE.md`](CLAUDE.md) — project structure, conventions, the full rule set.
2. `knowledge/team-memory/MEMORY.md` — curated team lessons from real incidents
   (if you use the shared team-memory pattern; see docs/MEMORY-SYSTEM.md).
3. The nearest sub-package `CLAUDE.md` for stack-specific rules.

## Commands

```bash
<install>      # e.g. pnpm install
<dev>          # e.g. pnpm dev
<test> && <lint> && <typecheck>   # run before pushing
```

## Hard rules (the few that matter most; full set in CLAUDE.md / .claude/rules)

- <language / style conventions>
- Never commit/push without being asked; destructive ops are gated (`--dry-run`
  default, `--confirm` to run). The confirm-push hook enforces this.
- <secrets / prod-data / migration rules>
- New cross-team lesson? Add it to personal memory first, then promote it to
  `knowledge/team-memory/` via PR.

## Harness

Deterministic guardrails live in `.claude/` (hooks wired in `.claude/settings.json`),
plus the spec system in `specs/` and the memory system (see docs/). These are the
sensors that catch mistakes the instructions above can't prevent.
