# The memory system

A file-based, markdown-first persistent memory for a coding agent. Deliberately
simple - no vector DB, no graph, no retrieval pipeline. It's the same architecture
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

> **The format is the integration.** Because every file is markdown + YAML
> frontmatter + `[[wikilinks]]` + an index, the memory dir opens directly as an
> [Obsidian](https://obsidian.md) vault (graph view, backlinks, search) with zero
> conversion — useful for browsing a large memory by hand, or for teammates on a
> non-Claude-Code tool to read it via an Obsidian/filesystem MCP. One caveat: a
> rename done *outside* Obsidian won't auto-update `[[wikilinks]]`, so fix links
> when `/memory-gc` merges files.

## Topic file format

```markdown
---
name: short-kebab-case-slug
description: one-line summary - used to judge relevance during recall
metadata:
  type: user | feedback | project | reference
---

The fact. For feedback/project, follow with the two lines below.

**Why:** the reason it matters (usually the error/context that produced it).

**How to apply:** the concrete behavior change next time.

Link related memories with [[their-name]].
```

### The four types

- **`user`** - who the operator is (role, expertise, preferences).
- **`feedback`** - how the agent should work: corrections and confirmed approaches.
  Always include the *why*; this is where behavior change is encoded.
- **`project`** - ongoing work, goals, constraints not derivable from code or git.
  Convert relative dates to absolute.
- **`reference`** - pointers to external resources (URLs, dashboards, tickets).

## Team memory (shared, in-repo)

The dir above is **personal** - one operator, outside the repo. When a lesson
applies to the whole team (a production incident's fix, a convention, an
integration gotcha), it belongs in a **shared, version-controlled** memory that
every teammate's agent reads. Pattern, battle-tested on a real team where everyone
runs Claude Code:

```
<repo>/knowledge/team-memory/
├── MEMORY.md            # index, same one-line-per-memory format
├── feedback_*.md        # lessons (the why + how-to-apply)
└── reference_*.md       # technical references (integrations, dashboards)
```

- **Only `feedback` and `reference` graduate.** `project` (changing state) and
  `user` (personal preference) stay personal - they'd be noise or wrong for
  teammates.
- **Promotion flow:** write it in your personal dir first; if it's cross-team, copy
  it to `team-memory/` and add its index line **in a PR**. The review *is* the
  curation gate - a teammate vets the lesson before it enters everyone's context.
- **Discoverability:** link `team-memory/MEMORY.md` from the repo's root
  `CLAUDE.md`/`AGENTS.md` so every agent loads it at session start.
- **Access = the repo's.** There's no per-note ACL and you don't want one: who can
  read/write is the git host's repo permissions; who can *merge a change* is
  CODEOWNERS + PR review (see `template/examples/CODEOWNERS.example`). Markdown in
  git, gated by review - that's the whole access model.
- **Non-Claude-Code teammates** (Claude Desktop, Cursor, ...) read the same files
  via a filesystem/Obsidian MCP pointed at the folder, or by cloning the repo.

Why git markdown and not a SaaS (Notion/Confluence): it's what the *agents* read
natively, it versions and diffs cleanly, and PR review is already your curation
gate. A SaaS is the right home for human-only, non-technical knowledge - not for
what the coding agent consumes.

## Rules that keep it from rotting

1. **Index size ceiling.** Keep `MEMORY.md` small enough to load fully (in Claude
   Code, under ~24KB) - **over the ceiling it loads *partially and silently*, so
   memories near the bottom just fall out of context.** One line per memory, and
   budget against the *total* line length, not just the hook: a `- [name](name) —
   hook` entry repeats the filename twice (~80+ chars of prefix for long slugs), so
   keep the whole line under ~170 chars and push detail into the topic file
   (`/memory-gc` truncates on total line length for exactly this reason).
2. **One fact = one file.** Before creating, check if a file already covers it  - 
   update, don't duplicate.
3. **Delete what's wrong.** A stale or false memory is worse than no memory.
4. **Provenance on conflicts.** When two memories contradict, prefer the more
   recent and the higher-authority source (direct conversation > docs > inferred).
   Mark the loser as superseded rather than silently dropping the history.

## Maintenance: `/memory-gc`

The `/memory-gc` slash command (in `.claude/commands/`) runs a periodic
consolidation pass - the simple version of a "reflection" loop:

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
going multi-user - not "it feels primitive."
