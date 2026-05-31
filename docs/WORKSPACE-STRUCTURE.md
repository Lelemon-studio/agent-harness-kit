# Workspace structure

How to organize a multi-project workspace so an agent (and you) can navigate it
without getting lost. This is the layout a one-person studio actually runs day to
day - one root that holds several apps, client work, plans, and the harness itself.

The core idea: **the repo layout is part of the harness.** A predictable structure
plus an instruction file at each level means the agent always knows where it is,
what the rules are here, and where things belong.

## The layout

```
workspace/
├── CLAUDE.md            # root instructions: structure, conventions, how to work here
├── .claude/             # the harness: settings, hooks, commands, agents (versioned)
├── .mcp.json            # MCP servers for this workspace
├── specs/               # the planning system (one folder per feature)
│   └── _templates/
├── memory/              # (or the agent's auto-memory dir) persistent facts
│
├── app-one/             # a sub-project, with its OWN CLAUDE.md
│   └── CLAUDE.md
├── app-two/             # another sub-project
│   └── CLAUDE.md
│
├── clients/             # (agency/studio) one folder per client
│   └── <slug>/
│       ├── README.md    # the single source of truth for this client's status
│       ├── briefing/
│       ├── proposal/
│       └── assets/
│
└── legal/ , docs/ ...   # company/reference material that isn't code
```

## Why each piece

- **Root `CLAUDE.md`** is the map: what this workspace is, what each folder is for,
  the global conventions, and how to start a task. The agent reads it first.
- **Per-subrepo `CLAUDE.md`** is the local rulebook: each app states its own stack,
  commands, architecture decisions, and patterns. Rules live next to the code they
  govern, so they don't rot in a far-away doc. See [WRITING-CLAUDE-MD.md](WRITING-CLAUDE-MD.md).
- **`specs/`** holds plans that persist across sessions. See [SPEC-SYSTEM.md](SPEC-SYSTEM.md).
- **`.claude/`** is the versioned harness (hooks, commands, agents). See [HARNESS.md](HARNESS.md).
- **`clients/<slug>/`** keeps each client's context in one predictable place, so the
  agent can load exactly what it needs and nothing else. The `README.md` is the
  status of record - deliverables checklist, decisions, constraints.
- **`legal/`, `docs/`, etc.** keep non-code material out of the way but findable.

## The rules that make it work

1. **Nothing loose at the root.** Every file has a home. A stray `audio_3.ogg` or
   `notes.txt` at the root is a smell - it means a folder is missing. This keeps the
   agent from treating junk as signal.
2. **One CLAUDE.md per level that has its own rules.** Root for the workspace,
   one per sub-project. Don't repeat the root's content in children; children only
   add what's specific to them.
3. **Context loads top-down, just-in-time.** The agent reads the root CLAUDE.md
   always, the relevant subrepo's CLAUDE.md when it works there, and a client's
   README only when the task touches that client. You're curating its attention.
4. **Client/business context lives in files, not in the agent's head.** A
   `clients/<slug>/README.md` per client means the agent never guesses - it reads.

## What actually auto-loads (Claude Code)

The "loads just-in-time" idea above isn't aspirational - it's how Claude Code behaves.
But the nesting applies to only *some* of the harness, so be exact about which:

| Layer | Nests into subdirectories? |
|---|---|
| `CLAUDE.md` | **Yes.** Ancestor files load at launch; a subdirectory's `CLAUDE.md` loads on demand the moment Claude reads a file in that subtree. |
| `.claude/rules/*.md` | **Yes.** Auto-discovered; a rule with a `paths:` glob loads only for matching files (see [RULES-AND-OPS.md](RULES-AND-OPS.md)). |
| `.claude/settings.json` (hooks, permissions) | **No.** Loaded only from the directory you start Claude in - it does not cascade to or from subdirectories. |
| `.claude/commands/`, `.claude/agents/` | **No path-scoping.** Discovered at project root + user level; a subfolder organizes but doesn't scope them to a subtree. |

So: put **per-subrepo instructions in that subrepo's `CLAUDE.md`** (and path-scoped
`.claude/rules/`) - those follow Claude into the subtree. Keep **one
`.claude/settings.json` at the project root** for hooks and permissions; per-subrepo
settings only apply if you launch Claude from inside that subrepo. Anthropic documents
the full pattern in its [monorepo / large-codebases guide](https://code.claude.com/docs/en/large-codebases).

## Templates to copy

- [`template/examples/CLAUDE.root.example.md`](../template/examples/CLAUDE.root.example.md) - a root workspace CLAUDE.md
- [`template/examples/CLAUDE.subrepo.example.md`](../template/examples/CLAUDE.subrepo.example.md) - a per-app CLAUDE.md
- [`template/examples/client-README.example.md`](../template/examples/client-README.example.md) - a `clients/<slug>/README.md`

## When this applies

This shape pays off when you run **more than one project** from one place, or do
client work alongside product work. For a single repo, you don't need `clients/` or
the nesting - just a root `CLAUDE.md`, `.claude/`, and `specs/`. Scale the structure
to the number of things you're juggling, not beyond.
