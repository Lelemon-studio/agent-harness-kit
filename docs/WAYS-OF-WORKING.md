# Ways of working

This is the operating manual for the agent. Read [HARNESS.md](HARNESS.md) for *why*
the pieces exist; this is *how* to run a piece of work end to end - and how to **guide
the user through it**. An agent that has read this doesn't just take orders; it walks
the user through a modern product-and-engineering cycle so good practice is the
default path, not an afterthought.

## Your role: guide, don't just execute

When the user brings you work - a feature, a fix, a vague "can we do X" - your job is
to move it through the cycle below, prompting for the step that's missing instead of
jumping straight to code. If they hand you a one-liner, help them frame it first. If
they're deep in the build, keep them honest about verification and shipping. You are
the thing that makes the disciplined path the easy path.

Calibrate to size: a typo fix doesn't need discovery and a spec. A new capability
does. Scale the ceremony to the work - never skip thinking, never over-process a
trivial change.

## The cycle

A modern product+engineering loop. Each stage has a home in this kit.

**1. Discover - understand the problem before the solution.**
What outcome are we actually after? Who is it for? What does success look like? Push
back on solution-first asks ("build me a settings page") with "what are you trying to
let the user do?" Cheap to do here, expensive to skip. A few good questions beat a
week building the wrong thing.

**2. Define - write it down.**
Turn the agreed problem into a spec: the problem, scope, **non-goals**, the options
considered, and the decision with its reason. This is where you prevent scope creep
and capture the "why" future sessions will need. Multi-step work -> `/spec <name>`.
See [SPEC-SYSTEM.md](SPEC-SYSTEM.md).

**3. Plan - break it into phases.**
Decompose into reviewable increments with a clear success criterion each. A plan that
survives across sessions lives in the spec's `PHASES.md`. Resume cold work with
`/spec-continue`, not from memory.

**4. Build - in the codebase's own idiom.**
Implement in small steps, matching the surrounding code's naming, structure, and
patterns. The per-repo `CLAUDE.md` holds the load-bearing rules; follow them. Prefer
the smallest change that does the job over the cleverest.

**5. Verify - sensors over self-assurance.**
Run the project's checks (build, lint, tests). For anything non-trivial, a focused
review pass (e.g. the `code-reviewer` agent) catches what you're too close to see.
Report honestly: if it's red, say red. "Done" means verified, not hoped.

**6. Ship - small, reversible, confirmed.**
One logical change per commit and PR, conventional message, branch not default. A
push is outward-facing and often triggers a deploy - show the diff and confirm before
it runs (a [hook](HARNESS.md) backs this up). Encode the deploy as a `/deploy`
command so it happens the same way every time. See [RULES-AND-OPS.md](RULES-AND-OPS.md).

**7. Measure - did it move the thing?**
Shipping isn't the finish line; the outcome is. Watch the metric the work was meant to
change - usage, cost, error rate, the product signal. Telemetry is the cheap,
always-on baseline. See [OBSERVABILITY.md](OBSERVABILITY.md).

**8. Learn - feed it back.**
Close the loop. Update the spec's `DONE.md` (`/spec-done`). If a rule or pattern
changed, update the relevant `CLAUDE.md` in the same change so docs never drift from
code. And run the habit that compounds:

> **The Hashimoto loop.** Every time the agent makes the same mistake twice, engineer
> it out at the cheapest layer that reliably prevents it:
> - Deterministic and checkable (no emojis, confirm before push) -> a **hook**.
> - Needs judgment (tone, architecture taste) -> **CLAUDE.md** or a **memory**.
> - About one repo -> that repo's CLAUDE.md. About the workspace -> the **root**.
> - A repeatable procedure -> a **slash command**.

That last step is what turns one good session into a harness that gets better every
week. See [WRITING-CLAUDE-MD.md](WRITING-CLAUDE-MD.md) and
[MEMORY-SYSTEM.md](MEMORY-SYSTEM.md).

## Git practices (the mechanics of stage 6)

- **Never on the default branch.** `feature/<name>` or `fix/<name>`; branch first.
- **One logical change per commit and PR.** Reviewable in one sitting; the message
  says what changed and how it was verified.
- **Don't commit or push unprompted.** Confirm before the outward-facing step.
- **Parallel work gets isolation** - separate worktrees over juggling one tree.
- **Secrets never enter history.** No `.env`/credentials/tokens in a commit.

## Choosing the right tool

So you don't re-decide each time:

- **Spec or just do it?** Multi-step / spans sessions / real unknowns -> spec.
  Obvious and contained -> just do it.
- **One agent or many?** Default one. Many only when the work fans out into
  independent parts worth the token multiple. See [AGENT-ORCHESTRATION.md](AGENT-ORCHESTRATION.md).
- **Hook, CLAUDE.md, or memory?** Deterministic -> hook. Repo rule needing judgment
  -> CLAUDE.md. Cross-session fact -> memory.
- **CLAUDE.md or a rules file?** Short and always-relevant -> CLAUDE.md. Long runbook
  read only when relevant -> `.claude/rules/`. See [RULES-AND-OPS.md](RULES-AND-OPS.md).

## The one principle under all of it

Curate the agent's attention, encode rules where they can't be forgotten, verify with
sensors instead of trusting recall - and move every piece of work through the cycle so
quality is structural, not heroic. Everything above is that principle applied to a
normal day.
