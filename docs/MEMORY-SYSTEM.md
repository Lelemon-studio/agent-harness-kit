# The memory system

A file-based, markdown-first persistent memory for a coding agent. Deliberately
simple — no vector DB, no graph, no retrieval pipeline. It's the same architecture
Anthropic's own memory tool uses (the agent reads and writes plain files), and for
a single operator it beats a heavyweight framework on auditability, portability,
and zero infra.

## Structure

```
memory/
├── MEMORY.md            # the INDEX: one line per memory, loaded every session
├── some-fact.md         # one topic file = one fact
├── another-fact.md
└── ...
```

- **`MEMORY.md` is the only file auto-loaded into context each session.** It's an
  index: one line per memory, each linking to its topic file. Keep it lean.
- **Each topic file holds exactly one fact**, with YAML frontmatter.

> Note: in Claude Code, this directory is the auto-memory dir
> (`~/.claude/projects/<project-id>/memory/`), outside your repo. The files in
> `template/memory/` here are starters to copy in, not something the installer
> places automatically.

## Topic file format

```markdown
---
name: short-kebab-case-slug
description: one-line summary — used to judge relevance during recall
metadata:
  type: user | feedback | project | reference
---

The fact. For feedback/project, follow with the two lines below.

**Why:** the reason it matters (usually the error/context that produced it).

**How to apply:** the concrete behavior change next time.

Link related memories with [[their-name]].
```

### The four types

- **`user`** — who the operator is (role, expertise, preferences).
- **`feedback`** — how the agent should work: corrections and confirmed approaches.
  Always include the *why*; this is where behavior change is encoded.
- **`project`** — ongoing work, goals, constraints not derivable from code or git.
  Convert relative dates to absolute.
- **`reference`** — pointers to external resources (URLs, dashboards, tickets).

## Rules that keep it from rotting

1. **Index size ceiling.** Keep `MEMORY.md` small enough to load fully (in Claude
   Code, under ~24KB). One line per memory, under ~200 chars. Detail goes in the
   topic file, never in the index.
2. **One fact = one file.** Before creating, check if a file already covers it —
   update, don't duplicate.
3. **Delete what's wrong.** A stale or false memory is worse than no memory.
4. **Provenance on conflicts.** When two memories contradict, prefer the more
   recent and the higher-authority source (direct conversation > docs > inferred).
   Mark the loser as superseded rather than silently dropping the history.

## Maintenance: `/memory-gc`

The `/memory-gc` slash command (in `.claude/commands/`) runs a periodic
consolidation pass — the simple version of a "reflection" loop:

- clusters memories by topic, flags duplicates and contradictions,
- checks index hygiene (broken pointers, oversized index, orphan files),
- proposes merges / supersessions / deletions, **always asking before applying.**

Run it occasionally, not every session.

## When NOT to graduate to something heavier

A vector/graph memory system (Mem0, Zep/Graphiti, Letta, etc.) earns its
complexity at scale: 500+ memories growing unbounded, multi-user/multi-agent,
sub-200ms semantic retrieval, or temporal queries across history. For a single
operator at ~100 memories where recall is the model reading an injected index,
that's over-engineering. The honest upgrade trigger is roughly 150+ memories or
going multi-user — not "it feels primitive."
