# Rules and ops commands

Two patterns for encoding "how we operate here" so the agent does it the same way
every time: **rules files** for standing behavior, and **ops commands** for
repeatable procedures.

## Rules files (`.claude/rules/`)

Some guidance is too long for `CLAUDE.md` but doesn't belong in every session's
context - deployment procedure, on-call etiquette, how this repo handles migrations.
In Claude Code, `.claude/rules/` is a built-in mechanism for exactly this: one topic
per markdown file, **auto-discovered** (recursively, so you can group them in subfolders).

```
.claude/rules/
├── workspace.md       # how work flows here: branching, PRs, where things go
└── ops-patterns.md    # deploy/rollback/incident procedure
```

How they load (in Claude Code) - and this is the part to get right:

- **A rule with no `paths:` frontmatter loads at launch**, at the same priority as
  `CLAUDE.md`. Use it for guidance that's always relevant.
- **A rule with a `paths:` glob loads only when Claude touches matching files** - the
  real way to keep always-on context lean. It sits dormant until it's relevant:

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API rules
- Every endpoint validates its input.
- Use the standard error envelope.
```

You don't have to reference rules from `CLAUDE.md` - they're discovered automatically.
`~/.claude/rules/` applies a set to every project, and the directory supports symlinks
for sharing rules across repos.

Why split topics out of `CLAUDE.md`:
- **One topic per file** is easier to maintain than one giant doc.
- **`paths:` scoping beats a big always-on file** - in a monorepo, the API rules don't
  weigh on a frontend session.

A rule file is just markdown - structure it like a runbook: the procedure, the
preconditions, the failure modes. See
[`template/examples/rules/workspace.example.md`](../template/examples/rules/workspace.example.md).

> **Tool note.** `.claude/rules/` is a Claude Code feature. Under another agent the same
> idea (split standing guidance into topic files) still applies - you reference or import
> them from that tool's instruction file instead of relying on auto-discovery.

## Ops commands (slash commands for procedures)

When a procedure has fixed steps - deploy, diagnose a failing service, check
workspace health - encode it as a slash command in `.claude/commands/`. The command
is the procedure written once; running it means the agent follows the same steps in
the same order, instead of improvising each time.

Good candidates:

| Command | What it encodes |
|---------|-----------------|
| `/deploy` | the exact build -> verify -> deploy sequence, with the safety checks |
| `/diagnose` | how to triage a failing service (logs, health endpoints, common causes) |
| `/monitor` | where the dashboards/metrics are and what "healthy" looks like |
| `/verify-workspace` | the preflight that confirms the environment is sane |

A command file is markdown: a description line, `$ARGUMENTS` if it takes input, and
a `## Steps` section the agent follows. The same shape as the `/spec` commands in
this kit. See [`template/examples/commands/deploy.example.md`](../template/examples/commands/deploy.example.md)
and [`diagnose.example.md`](../template/examples/commands/diagnose.example.md).

## Why this beats "just ask each time"

- **Consistency.** The risky step (a deploy, a migration) happens the same way every
  time, including the checks. No "I forgot to run the build first."
- **It's reviewable.** The procedure is a file in version control; you can improve it
  and everyone (including future-you) gets the better version.
- **It pairs with hooks.** The command encodes the *procedure*; a [hook](HARNESS.md)
  enforces the *guardrail* (e.g. confirm before the push the deploy command runs).
  Procedure + guardrail is the reliable combination.

## Keep ops commands generic when you share them

The examples in this kit are deliberately generic (placeholder build/deploy
commands). Real ones name your actual services, dashboards, and credentials' env
vars - which is exactly why they should stay in your private repo, not a public
template. Adapt the examples; don't publish the filled-in versions.
