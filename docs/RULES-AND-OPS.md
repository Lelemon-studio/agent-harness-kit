# Rules and ops commands

Two patterns for encoding "how we operate here" so the agent does it the same way
every time: **rules files** for standing behavior, and **ops commands** for
repeatable procedures.

## Rules files (`.claude/rules/`)

Some guidance is too long for `CLAUDE.md` but too important to leave implicit -
deployment procedure, on-call etiquette, how this workspace handles migrations.
Put each such topic in its own file under `.claude/rules/` and reference it from
`CLAUDE.md`.

```
.claude/rules/
├── workspace.md       # how work flows here: branching, PRs, where things go
└── ops-patterns.md    # deploy/rollback/incident procedure
```

Why split them out of CLAUDE.md:
- **Loaded on demand, not always.** CLAUDE.md is in every session's context; a rules
  file can be pointed to ("for deploys, follow `.claude/rules/ops-patterns.md`") and
  read only when relevant. Keeps the always-on context lean.
- **One topic per file** is easier to maintain and to get right than one giant doc.

A rules file is just markdown - structure it like a runbook: the procedure, the
preconditions, the failure modes. See
[`template/examples/rules/workspace.example.md`](../template/examples/rules/workspace.example.md).

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
