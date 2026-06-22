---
recipe: <kebab-case-name>
one-liner: <one sentence — what this builds>
maturity: draft        # draft | tested | battle-tested
extracted-from: <where this came from, if any — keep generic, no secrets>
related: []            # other recipes this composes with (kebab names)
---

# Recipe: <Name>

> **One-liner:** <what you'll have working when this is done>
>
> _A recipe is a code-free blueprint you hand to a coding agent (e.g. Claude Code).
> It describes WHAT to build and the architecture — not the actual source. The agent
> reads it, asks you the "Tune" questions, and builds it into your own stack._

## When to use it / when NOT

**Use it when:** <the shape of problem this solves>

**Don't use it when:** <cheaper / simpler alternatives, or where this is overkill>

## Outcome

<Concrete end state. What does the user have running once the agent finishes?
Describe it from the user's POV, not the code's.>

## Architecture

```
<simple ASCII / mental diagram of components and how they connect — vendor-agnostic>
```

<One paragraph walking through the flow.>

## Ingredients

> Pieces as **swappable slots**, not fixed brands. The agent picks what fits the
> user's stack. List the role first, then example options.

- **<role>** — e.g. <option A> / <option B>. <one note on what matters>
- **<role>** — ...

## Build steps

> High level, no code. Each step is something the agent turns into real code in
> the target project.

1. <step>
2. <step>
3. ...

## Done signals (how the agent verifies)

> The **deterministic** checks that tell the agent a step actually worked — not its own
> opinion. This is the loop's sensor: it's what lets the agent self-correct and know when
> to stop, instead of declaring victory by vibes. Prefer signals a machine can confirm
> (a command exits 0, a test passes, a typecheck is clean, a metric clears a threshold).

- <step or outcome> → <deterministic signal that confirms it>
- ...

## Tune

> The questions the agent should ask you BEFORE (or while) building. This is what
> makes the recipe iterable instead of a one-shot dump.

- <decision the user must make, with the trade-off framed>
- ...

## Trade-offs & gotchas

- <known sharp edge, failure mode, or cost the agent should warn about>
- ...

## Prerequisites / assumptions

- <what must already exist in the target project for this to apply>
- ...

## Related recipes

> Recipes compose. Link companions, prerequisites, or follow-ups here (and add them
> to the `related:` frontmatter). Leave the section out if there are none.

- **[<recipe-name>](../<recipe-name>/RECIPE.md)** — <how it relates: prerequisite / companion / evaluates this / built on top>.
