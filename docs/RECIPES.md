# Recipes: portable, code-free solution blueprints

A **recipe** is a code-free blueprint you hand to a coding agent (Claude Code, or
any agent) that describes **what to build and the architecture** of a solution —
not the source code. The agent reads the recipe, asks you the recipe's tuning
questions, and builds it into *your* stack, iterating with you.

Think recipe, not finished dish. It lists **ingredients** (swappable slots, not
fixed brands), **steps** (high level, not line-by-line), and what to adjust **to
taste** — so you can share a working solution without shipping or maintaining code,
and without exposing anything sensitive.

> **Why it matters.** A good solution is worth more than the code that happened to
> implement it once. Code rots, leaks secrets, and is married to one stack. A recipe
> captures the *reusable part* — the architecture and the hard-won decisions — in a
> form an agent can rebuild anywhere. You share the know-how, not a repo to maintain.

## What a recipe is

- **Code-free.** It describes components and how they connect, not files. No secrets,
  no proprietary source, no stack lock-in. That's what makes it safe to share.
- **Agent-consumable.** It's written to be handed to a coding agent. The agent turns
  each step into real code in the target project and asks the tuning questions before
  building blindly.
- **Iterable.** It's a *starting point*, not a spec to execute verbatim. The "Tune"
  section is the seam where the agent and the human converge on the right shape.
- **Portable.** It doesn't assume your stack. Whoever takes it adapts it. Ingredients
  are roles ("a vector store with per-tenant filtering"), with examples, not mandates.
- **Opinionated where it counts.** It bakes in the efficiency and security practices
  that separate a real solution from a demo, and it names the anti-patterns to avoid.

## What a recipe is NOT

Drawing the boundary is half the value — these are the neighbors people confuse it with:

- **Not a skill.** A [skill](../library/SKILLS.md) is a capability the agent *executes*
  (an action it can take). A recipe is a blueprint the agent *builds from* (knowledge it
  reads). Skill = verb; recipe = plan.
- **Not an ADR.** An [Architecture Decision Record](WRITING-CLAUDE-MD.md) captures *why*
  one decision was made, after the fact. A recipe captures *how to build a whole solution*,
  before the fact. (A recipe may *contain* decisions, but its job is reproduction.)
- **Not a spec.** A [spec](SPEC-SYSTEM.md) drives one feature to done in one project,
  tied to that codebase and its state. A recipe is project-agnostic and meant to be
  reused across projects and people.
- **Not a cookbook.** OpenAI/Anthropic/LangChain "cookbooks" are runnable notebooks —
  code you clone and execute. A recipe is conceptual and code-free; the agent generates
  the code. (If you *want* a runnable artifact, that's a cookbook hanging off a recipe,
  not the recipe itself.)
- **Not a tutorial or a runbook.** A tutorial teaches a person step-by-step; a
  [runbook](RULES-AND-OPS.md) is an operational procedure ("what to do when X breaks").
  A recipe is a *build blueprint* for an agent.

## A recipe is structured input to the agent loop

A coding agent works in a loop: act → observe → verify → iterate → stop (see
[`LOOP-ENGINEERING.md`](LOOP-ENGINEERING.md)). A recipe isn't the loop — it's what you
*load into* it, pre-shaped so the loop runs well:

- **Architecture + Ingredients + Build steps** scope the problem, so the agent isn't
  guessing what to build (less wandering, fewer wasted iterations).
- **Tune** is the human-in-the-loop checkpoint *before* building — the agent converges
  with you on the forks instead of building the wrong thing and reworking it.
- **Done signals** are the loop's deterministic sensors — the checks that tell the agent a
  step actually worked, so it self-corrects and knows when to stop instead of declaring
  victory by vibes.
- **Efficiency** is the loop's token/cost discipline; **Anti-patterns** are its guardrails.

So a good recipe is context-engineering and flow-engineering packaged: it gives the loop a
clear target, real sensors, and a stop condition. That's why **Done signals** is a
first-class section, not an afterthought.

## Anatomy of a recipe

The full template is [`library/recipes/_template.md`](../library/recipes/_template.md).
A recipe has these sections:

| Section | What it answers |
|---------|-----------------|
| **Frontmatter** | name, one-liner, maturity (`draft`/`tested`/`battle-tested`), `related` recipes |
| **When to use / when NOT** | the shape of problem this fits — and where it's overkill |
| **Outcome** | the end state, from the user's point of view, not the code's |
| **Architecture** | components and how they connect — vendor-agnostic, a simple diagram |
| **Ingredients** | the pieces as **swappable slots** (role first, example options second) |
| **Build steps** | high level, no code; each becomes real code in the target project |
| **Done signals** | the deterministic checks that confirm each step worked — the loop's sensors |
| **Tune** | the questions the agent asks before/while building — the iterable seam |
| **Efficiency** | the cost/token/latency practices that keep it from being a money pit |
| **Security** (when relevant) | what's safe to expose; default-deny; structural guardrails |
| **Anti-patterns** | the documented ways this goes wrong, named so the agent avoids them |
| **Trade-offs & gotchas** | sharp edges, failure modes, honest limits |
| **Prerequisites** | what must already exist for this to apply |
| **Related recipes** | companions / prerequisites / follow-ups — **recipes compose** |

## Best practices for writing a recipe

1. **Write it for the agent, not for a human reader.** The audience is a coding agent
   that will build this. Be concrete about components and contracts; skip prose that
   only helps a person browsing.
2. **Code-free, secret-free — always.** The moment a recipe carries real source or a
   secret, it stops being shareable, which was the whole point. Describe the *shape*,
   let the agent write the code. Default-deny anything you're unsure about.
3. **Ingredients are roles, not brands.** Write "an embedding model (e.g. Gemini /
   OpenAI / Voyage)", not "use Pinecone." Swappable slots are what make it portable.
4. **Make the tuning questions real.** The "Tune" section is what turns a doc into a
   conversation. List the genuine forks — the ones where the right answer depends on the
   user's constraints (freshness vs cost, stakes, budget). This is the recipe's soul.
5. **Bake in efficiency and security as first-class sections.** A recipe that
   re-computes work it already did, or that leaks what it shouldn't, is an anti-pattern,
   not a recipe. Name the cost discipline (don't redo unchanged work, batch, sample,
   cache) and the security spine (allowlist, read-only, structural guardrails) explicitly.
6. **Name the anti-patterns out loud.** Don't just say what to do; say what *not* to do
   and why. The documented failure modes are often more useful than the happy path.
7. **Ground it in something real, then strip the specifics.** The best recipes are
   *extracted* from a solution you actually built — that's how you know the gotchas are
   real. Then sand off the project specifics until it's generic. Record the origin
   generically in `extracted-from` (no secrets).
8. **Recipes compose — link, don't duplicate.** When a recipe needs another (a
   prerequisite, a companion, an evaluator), link it via `related` and the *Related
   recipes* section. Two recipes that overlap should reference each other, not copy
   content — duplication drifts.
9. **State maturity honestly.** `draft` (idea, unbuilt), `tested` (built once, works),
   `battle-tested` (in production, gotchas proven). Don't oversell.
10. **Keep it lean.** A recipe long enough to feel exhaustive is too long to hand to an
    agent. Cut to the load-bearing decisions.

## Examples

[`library/recipes/`](../library/recipes/) holds two worked, composing examples:

- [`rag-support-over-live-source`](../library/recipes/rag-support-over-live-source/RECIPE.md)
  — a support agent grounded in a product's living docs/code (auto-ingested on deploy)
  plus the asking user's real-time data, read-only.
- [`rag-evaluation-harness`](../library/recipes/rag-evaluation-harness/RECIPE.md)
  — a harness that measures retrieval and generation quality *separately*, gates deploys
  on thresholds, and monitors production drift. The companion that *measures* the first.

Read them next to the [template](../library/recipes/_template.md) to see what "good"
looks like — including how the two reference each other through `related`.
