# Harness engineering

> **Agent = Model + Harness**

The model is the small part. The harness is everything you wrap around it to make
it reliable: the guides that orient it *before* it acts, and the sensors that
correct it *after*. This doc maps both layers and how to extend them.

Guiding principle (after Mitchell Hashimoto): **every time the agent makes a
mistake, you engineer a fix so it can't make that mistake again.** Every rule in a
good harness was born from a real error - don't add rules speculatively.

---

## Layer 1 - Guides (feedforward: orient BEFORE acting)

| Guide | Where it lives | What it does |
|---|---|---|
| **Root instructions** | `CLAUDE.md` | Project structure, conventions, global rules. |
| **Cross-tool pointer** | `AGENTS.md` (`template/examples/AGENTS.example.md`) | Thin [agents.md](https://agents.md)-standard entry so non-Claude-Code agents (Cursor, Codex, Copilot) orient too. Points at `CLAUDE.md`, doesn't duplicate it. |
| **Per-subrepo instructions** | `*/CLAUDE.md` | Rules and patterns specific to each project. |
| **Persistent memory** | auto-memory dir (see `docs/MEMORY-SYSTEM.md`) | Topic files + a one-line index. Injects priors across sessions. |
| **Shared team memory** | `knowledge/team-memory/` + `CODEOWNERS` (see `docs/MEMORY-SYSTEM.md`) | Cross-team `feedback`/`reference` memories, in git, promoted via PR; CODEOWNERS is the curation gate. |
| **Spec system** | `specs/` + `/spec*` commands | A planning protocol (SPEC / PHASES / SESSION / DONE) that persists a feature's state across sessions. |

## Layer 2 - Sensors (feedback: correct AFTER acting)

### Deterministic sensors (hooks) - `.claude/hooks/`

Hooks run deterministic code: they don't hallucinate and can't be "forgotten."
They're wired in `.claude/settings.json` (version-controlled).

| Hook | Event | What it does |
|---|---|---|
| `confirm-push.py` | PreToolUse(Bash) | Forces confirmation before `git push` / `gh pr create|merge` - outward-facing, deploy-triggering actions. Local commits stay advisory. |
| `no-emoji-copy.py` | PreToolUse(Write/Edit/MultiEdit) | Example preventive sensor: denies emojis in a configured set of customer-facing files *before* the write lands. |
| `websearch-add-year.py` | PreToolUse(WebSearch) | Appends the current year to searches with no temporal anchor, so results skew recent. |
| `verify-gate.py` | PreToolUse(Bash) | Runs the project's declared fast checks (typecheck/lint and any configured) before `git push` and *denies* it if any fails - the loop's verify step made non-optional. Inert until the project declares matching checks (high precision). Logs each block to `.claude/harness-events.jsonl`. See `docs/LOOP-ENGINEERING.md`. |

**Design principle: high precision over high coverage.** A sensor with false
positives is worse than none - it erodes trust and gets disabled. Keep scope
narrow and deliberate.

**Two hook gotchas worth internalizing** (both baked into the example hooks):
- **To *block* an action, use PreToolUse, not PostToolUse.** PostToolUse runs
  after the tool already executed - exit code 2 only feeds stderr back as
  feedback; it can't prevent the action. PreToolUse can return
  `permissionDecision: "deny"`.
- **On Windows, read stdin as UTF-8 explicitly.** Python's stdin defaults to
  cp1252; `json.load(sys.stdin)` on UTF-8 bytes (emojis, accents) throws and a
  naive `except: sys.exit(0)` swallows it silently - the sensor fails quiet.
  Use `sys.stdin.buffer.read().decode("utf-8")`.

### Computational sensors (per project)

Not global hooks; run by hand or in CI per project: `build` / `lint` / `test`
before merge, `cargo clippy -D warnings` for Rust, a build before any deploy, etc.

### Inferential sensors (skills / subagents)

Semantic review before closing: code review, security review, "verify it actually
works" passes. Subagents to isolate context and parallelize; cheap models for
search/exploration.

## Layer 3 - Observability

Telemetry (e.g. Claude Code OTEL export), plus whatever app-level logs/analytics
your stack already has. You can't improve a harness you can't see.

---

## Portability across agents

These docs are meant to be read and acted on by *any* coding agent (Claude Code,
opencode, Codex, Cursor, Gemini CLI, ...), not just Claude Code. Two layers, with different portability:

- **The methodology is portable.** The harness model (guides + sensors), the working
  cycle, how to write the instruction layer, the memory system, and the spec system
  are tool-agnostic ideas. Any agent that reads `docs/` benefits.
- **The enforcement mechanics are Claude Code's.** Hooks (`settings.json`), slash
  commands, agent frontmatter, and the `.claude/` layout are how *this* kit
  implements the sensors and guides. Other tools have their own equivalents - or, for
  deterministic hooks, sometimes none.

The instruction layer is the same content under a different filename per tool. Map it:

| Concept | Claude Code | opencode / Codex | Cursor | Gemini CLI |
|---|---|---|---|---|
| Root instructions | `CLAUDE.md` | `AGENTS.md` | `.cursor/rules` | `GEMINI.md` |
| Guardrails | hooks (`settings.json`) | tool-specific / none | tool-specific | tool-specific |
| Saved procedures | `/slash-commands` | tool-specific | tool-specific | tool-specific |

This repo ships a root [`AGENTS.md`](../AGENTS.md) as a neutral entry point any agent
can pick up; it points at the same `docs/`. If you adopt the methodology under a
non-Claude tool, keep the portable docs as-is and re-implement the mechanics with
your tool's primitives.

> **Claude Code reads `CLAUDE.md`, not `AGENTS.md`.** If a repo standardizes on
> `AGENTS.md`, give Claude Code a `CLAUDE.md` that imports it - `@AGENTS.md` on its own
> line (imports recurse up to four hops) - or a symlink (`ln -s AGENTS.md CLAUDE.md`; on
> Windows the import is easier than a symlink). That way both tools read one source of
> truth instead of two drifting copies.

---

## What to version and what not to

`.claude/` is partially version-controlled on purpose (see `gitignore-snippet.txt`):

**Versioned (the shareable harness):** `.claude/settings.json`, `.claude/hooks/`,
`.claude/commands/`, `specs/_templates/`.

**Ignored (machine/session-specific or secret):** `.claude/settings.local.json`
(local permissions/paths), `.claude/projects/`, `.claude/todos/`, caches,
credentials.

Memory lives in Claude Code's auto-memory directory, outside the repo - it's the
operator's personal state, not shared here.

---

## How to extend the harness (the Hashimoto loop)

When the agent makes a recurring mistake, don't just fix it in the moment - encode
it so it can't recur. Quick decision tree:

1. **Deterministic and low false-positive?** (e.g. "confirm before push") ->
   **hook** in `.claude/hooks/`, wired in `settings.json`. Strongest guarantee.
2. **Semantic / needs judgment?** (e.g. tone, scope decisions) -> a **memory** of
   type `feedback`, with `**Why:**` and `**How to apply:**`.
3. **A technical pattern of one repo?** -> that repo's `CLAUDE.md`.
4. **A repeatable multi-step flow?** -> a **skill / slash command**.

The art is matching the mistake to the cheapest layer that reliably prevents it.
