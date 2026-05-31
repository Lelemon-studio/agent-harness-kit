# Writing a good CLAUDE.md

`CLAUDE.md` is the agent's standing instructions for a repo - loaded every session,
before anything else. It's the highest-leverage file in the harness: a good one
prevents whole classes of mistakes before they happen. This is how to write one
that earns its place in the context window.

## What goes in it

A CLAUDE.md should let a capable agent (or a new teammate) start working correctly
without asking. Aim for:

1. **What this is** - one paragraph: the project, its purpose, the stack.
2. **How to run it** - the commands that matter (dev, build, test, lint, deploy).
3. **Architecture decisions** - the load-bearing choices, stated as rules (see ADRs
   below). Not history; the decisions that constrain new code.
4. **Patterns to follow** - the idioms this codebase uses, with a one-line example.
5. **Anti-patterns to avoid** - the mistakes that keep happening here.
6. **Conventions** - commits, naming, language, file layout.

Leave out: anything the agent can read from the code itself, long narratives,
and aspirational rules nobody follows. Every line costs context budget - if it
doesn't change behavior, cut it.

## State decisions as ADRs, not prose

The strongest CLAUDE.md content reads as short architectural decision records: a
rule plus the reason. The reason is what lets the agent generalize to cases you
didn't list.

```markdown
## Architecture (the load-bearing rules)

1. **Multi-tenant always.** Every query filters by `orgId`. No exceptions, including
   admin tooling. Why: a missing filter is a cross-tenant data leak, not a bug.
2. **Async anything over ~5s.** Long work goes to a job queue; the API stays under
   500ms. Why: request timeouts and bad UX otherwise.
3. **Soft deletes only.** Set `deletedAt`; never hard-delete. Why: auditability and
   recoverable mistakes.
```

A rule with a "Why" survives contact with a situation you didn't foresee. A bare
"don't do X" doesn't.

## Anti-patterns: a list that earns its keep

Keep a running list of the mistakes that actually recur in this repo. This is the
Hashimoto loop in document form - every time the agent makes the same error twice,
it becomes a line here.

```markdown
## Anti-patterns (do NOT do these)

- `console.log` for logging -> use the structured logger (PII gets leaked otherwise).
- Logging emails/phones/names -> redact PII before logging.
- Forgetting the tenant filter -> every query filters by `orgId`.
- Hard deletes -> soft-delete with `deletedAt`.
```

For a large codebase, split these into focused files (`docs/anti-patterns/backend.md`,
`.../security.md`, ...) and link them from CLAUDE.md. See
[`template/examples/anti-patterns.example.md`](../template/examples/anti-patterns.example.md).

## The hierarchy: root + per-subrepo

In a multi-project workspace, the root `CLAUDE.md` covers the workspace (structure,
global conventions) and each sub-project has its own. Children add only what's
specific to them - never copy the root's content down. The agent composes them:
root rules + the rules of wherever it's currently working. See
[WORKSPACE-STRUCTURE.md](WORKSPACE-STRUCTURE.md).

## Keep it honest and current

- **Match the code.** A CLAUDE.md that contradicts the codebase is worse than none -
  the agent will trust it and be wrong. When a rule changes, update the file in the
  same change.
- **Earn each line.** If a rule never fires, delete it. Density beats completeness;
  a 60-line file that's all true beats a 300-line file that's half aspirational.
- **Decide vs deny.** Prefer "do X because Y" over a wall of prohibitions. Positive
  patterns generalize; prohibitions only block the exact case named.

## What to encode where (decision)

- A rule that's **deterministic and checkable** (no emojis, confirm before push) ->
  a [hook](HARNESS.md), not prose. Prose can be forgotten; hooks can't.
- A rule that needs **judgment** (tone, architecture taste) -> CLAUDE.md or a
  [memory](MEMORY-SYSTEM.md).
- A rule about **one repo** -> that repo's CLAUDE.md. A rule about the whole
  workspace -> the root.

Templates: [`CLAUDE.root.example.md`](../template/examples/CLAUDE.root.example.md),
[`CLAUDE.subrepo.example.md`](../template/examples/CLAUDE.subrepo.example.md).
