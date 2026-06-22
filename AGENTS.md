# AGENTS.md

Neutral entry point for any coding agent (Claude Code, opencode, Codex, Cursor,
Gemini CLI, or another) working in or adopting this repository. `AGENTS.md` is the
cross-tool convention; if your tool reads a different file (`CLAUDE.md`, `.cursor/rules`,
`GEMINI.md`), the content is the same - only the filename differs.

> **On Claude Code:** it reads `CLAUDE.md`, not `AGENTS.md`. Point it here with a
> `CLAUDE.md` containing the single line `@AGENTS.md` (an import), or a symlink
> (`ln -s AGENTS.md CLAUDE.md`). One source of truth, both tools.

## What this repo is

`agent-harness-kit` - a reproducible **harness** for working with coding agents.
**Agent = Model + Harness:** the model is the small part; the harness is everything
you wrap around it to stay reliable. Guides orient the agent *before* it acts;
sensors correct it *after*.

## Read these, in order

1. [`docs/WAYS-OF-WORKING.md`](docs/WAYS-OF-WORKING.md) - **start here.** The
   product+engineering cycle (discover -> define -> plan -> build -> verify -> ship ->
   measure -> learn) you should run and guide the user through, plus git practices.
2. [`docs/HARNESS.md`](docs/HARNESS.md) - the model behind it all, and the
   portability split (what's universal vs Claude Code-specific).
3. [`docs/EFFECTIVE-USE.md`](docs/EFFECTIVE-USE.md) - how to run a session well: lean
   orchestrator, model selection, context hygiene, worktrees, review against your rules.
4. [`docs/WRITING-CLAUDE-MD.md`](docs/WRITING-CLAUDE-MD.md),
   [`docs/MEMORY-SYSTEM.md`](docs/MEMORY-SYSTEM.md),
   [`docs/SPEC-SYSTEM.md`](docs/SPEC-SYSTEM.md) - the instruction, memory, and
   planning layers.
5. [`docs/WORKSPACE-STRUCTURE.md`](docs/WORKSPACE-STRUCTURE.md),
   [`docs/RULES-AND-OPS.md`](docs/RULES-AND-OPS.md),
   [`docs/AGENT-ORCHESTRATION.md`](docs/AGENT-ORCHESTRATION.md),
   [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) - structure, ops, multi-agent, telemetry.
6. [`docs/RECIPES.md`](docs/RECIPES.md) - code-free, portable solution blueprints you hand
   to an agent (what a recipe is and isn't, how to write one); examples in [`library/recipes/`](library/recipes/).
7. [`docs/LOOP-ENGINEERING.md`](docs/LOOP-ENGINEERING.md) - the harness as the agent's
   act-observe-verify-iterate-stop loop: the nine levers and how recipes feed it.

## Portable methodology vs tool mechanics

- **Portable (read and apply with any tool):** everything in `docs/`. The cycle, the
  harness model, the writing/memory/spec methodologies are tool-agnostic.
- **Claude Code-specific (re-map to your tool):** the mechanics under `template/.claude/`
  - hooks (`settings.json`), slash commands, agent frontmatter. They implement the
  sensors and saved procedures. If your tool lacks deterministic hooks, enforce the
  same guardrails with whatever primitives it has (and keep the rule written down).

See the portability table in [`docs/HARNESS.md`](docs/HARNESS.md#portability-across-agents).

## How to behave

- **Guide, don't just execute.** Move work through the cycle; prompt for the step the
  user is skipping. Scale ceremony to the size of the work.
- **Verify with sensors, not recall.** Run the project's build/lint/tests; review
  non-trivial changes before closing.
- **Outward-facing actions need confirmation.** A push usually triggers a deploy -
  show the diff and wait for the OK. Don't commit or push unprompted.
- **Engineer out recurring mistakes** at the cheapest layer that prevents them
  (hook > written rule > memory) - the Hashimoto loop.

## A worked example

[`example/`](example/) is a complete, filled-in project (a fictional multi-tenant SaaS)
showing what an adopted harness looks like: root `CLAUDE.md`, per-app rules, a
workspace runbook, and anti-patterns, all cohering. Read it next to the blank
templates in `template/examples/`.

## Starter library

[`library/`](library/) has lift-and-adapt starter rules + anti-patterns per language
(TypeScript on Bun, Rust, Go), cross-language [engineering principles](library/rules/engineering-principles.md),
and a curated list of [recommended skills](library/SKILLS.md). When adopting the harness,
copy the relevant rules into the project's `CLAUDE.md` and install the skills for its stack.

## Installing the kit into another project

See [`README.md`](README.md) - there's a copy-paste setup prompt under *Quickstart*,
or run `install.sh` / `install.ps1`.
