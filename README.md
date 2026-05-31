# agent-harness-kit

A small, reproducible **harness** for working with coding agents (built for
[Claude Code](https://www.anthropic.com/claude-code)). Drop it into any project to
get deterministic guardrails, a spec-driven planning system, and a file-based
memory methodology that don't depend on the agent "remembering" to behave.

> **Agent = Model + Harness.** The model is the small part. The harness is
> everything you wrap around it to make it reliable. This kit is that wrapper,
> extracted from a real one-person studio's daily setup.

## Why this exists

Most "prompt the agent to be careful" advice fails the same way: the model forgets,
or the rule lives in someone's head. A harness encodes the rules where they can't
be forgotten:

- **Guides** orient the agent *before* it acts (instructions, memory, specs).
- **Sensors** correct it *after* (deterministic hooks, reviews).

The guiding principle: **every recurring mistake gets engineered out**, at the
cheapest layer that reliably prevents it. See [`docs/HARNESS.md`](docs/HARNESS.md)
for the full model.

## What's inside

```
template/
├── .claude/
│   ├── settings.json            # wires the hooks (version this)
│   ├── hooks/
│   │   ├── confirm-push.py       # ask before push / PR (deploy-triggering)
│   │   ├── no-emoji-copy.py      # example: deny emojis in customer-facing files
│   │   └── websearch-add-year.py # bias web searches toward recent results
│   ├── commands/
│   │   ├── spec.md               # /spec - start a planned feature
│   │   ├── spec-continue.md      # /spec-continue - resume with full context
│   │   ├── spec-done.md          # /spec-done - close it out
│   │   ├── spec-status.md        # /spec-status - where things stand
│   │   └── memory-gc.md          # /memory-gc - consolidate + dedupe memory
│   └── agents/
│       ├── code-reviewer.md      # subagent: review a diff in an isolated context
│       └── researcher.md         # subagent: web/codebase research, cited synthesis
├── specs/
│   ├── _templates/               # SPEC / PHASES / SESSION / DONE
│   └── EXAMPLE-add-rate-limiting/ # a filled, mid-flight worked example
├── memory/                       # starter index + one-fact template
└── examples/                     # opt-in patterns to adapt (not auto-installed):
    ├── CLAUDE.root.example.md     #   root workspace instructions
    ├── CLAUDE.subrepo.example.md  #   per-app instructions
    ├── client-README.example.md   #   clients/<slug>/ status file
    ├── anti-patterns.example.md   #   an enforced "do NOT" list
    ├── rules/                     #   .claude/rules/ workspace runbook
    └── commands/                  #   ops commands (deploy, diagnose)
docs/
├── HARNESS.md                    # the harness-engineering philosophy
├── WORKSPACE-STRUCTURE.md        # how to lay out a multi-project workspace
├── WRITING-CLAUDE-MD.md          # how to write the instruction layer
├── SPEC-SYSTEM.md                # the spec planning system + how to use it
├── AGENT-ORCHESTRATION.md        # multi-agent patterns (and when NOT to)
├── RULES-AND-OPS.md              # rules files + ops commands
├── OBSERVABILITY.md              # OTEL telemetry: see your token/cost usage
└── MEMORY-SYSTEM.md              # the file-based memory methodology
```

The hooks double as worked examples of two things that are easy to get wrong:
blocking actions belong in **PreToolUse** (PostToolUse can't block), and on Windows
you must read hook stdin as **UTF-8** or non-ASCII input fails silently.

## Install

```bash
# from the kit root, targeting your project:
./install.sh /path/to/your/project          # macOS / Linux / WSL
./install.ps1 -Target C:\path\to\project    # Windows / PowerShell
```

This copies `.claude/hooks/`, `.claude/commands/`, `.claude/agents/`,
`.claude/settings.json` (it won't clobber an existing one), and `specs/_templates/`.
The `template/examples/` patterns are opt-in - copy what fits by hand. Then:

1. Append [`gitignore-snippet.txt`](gitignore-snippet.txt) to your project's `.gitignore`.
2. Seed your memory from `template/memory/` - see [`docs/MEMORY-SYSTEM.md`](docs/MEMORY-SYSTEM.md).
3. Hooks need Python on `PATH`. Open the agent and try `git push` to confirm the
   confirmation prompt fires.

## Docs

- [`docs/HARNESS.md`](docs/HARNESS.md) - the harness-engineering model (guides + sensors) and how to extend it.
- [`docs/WORKSPACE-STRUCTURE.md`](docs/WORKSPACE-STRUCTURE.md) - how to lay out a multi-project workspace so the agent never gets lost.
- [`docs/WRITING-CLAUDE-MD.md`](docs/WRITING-CLAUDE-MD.md) - how to write the instruction layer (ADRs, anti-patterns, the root + per-subrepo hierarchy).
- [`docs/SPEC-SYSTEM.md`](docs/SPEC-SYSTEM.md) - the spec-driven planning system, the four files, and how to run it across sessions.
- [`docs/AGENT-ORCHESTRATION.md`](docs/AGENT-ORCHESTRATION.md) - when (and when not) to use multiple agents; the patterns that hold up.
- [`docs/RULES-AND-OPS.md`](docs/RULES-AND-OPS.md) - rules files and ops commands for repeatable procedures.
- [`docs/OBSERVABILITY.md`](docs/OBSERVABILITY.md) - turn on OTEL telemetry to see token/cost usage.
- [`docs/MEMORY-SYSTEM.md`](docs/MEMORY-SYSTEM.md) - the file-based memory methodology and `/memory-gc`.

## Customize

It's meant to be edited, not adopted whole. The `no-emoji-copy.py` hook has a
config block at the top (which file types/paths to check) - adapt or delete it.
The slash commands are plain markdown. Add your own hooks following the same
pattern. Keep sensors **high-precision**: a false-positive hook is worse than none.

## Origin

Extracted from the working harness of [Lelemon](https://lelemon.cl), a one-person
digital studio. The example rules (no-emoji web copy, confirm-before-deploy) are
that studio's; swap in your own. Shared because the *structure* travels well.

## License

MIT. See [LICENSE](LICENSE).
