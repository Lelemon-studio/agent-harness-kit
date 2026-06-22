# Recipes — portable, code-free solution blueprints

A **recipe** is a code-free blueprint you hand to a coding agent (Claude Code, or any
agent): it describes **what to build** and the **architecture** of a solution — not the
source. The agent reads it, asks the "Tune" questions, and builds it into your stack.

Ingredients (swappable slots), steps (high level), and "to taste" tuning — so you share
a working solution without shipping or maintaining code, and without exposing anything
sensitive.

> **Read the methodology first:** [`docs/RECIPES.md`](../../docs/RECIPES.md) — what a
> recipe is, what it is *not* (skill / ADR / spec / cookbook), the anatomy, and the
> best practices for writing one. This folder is the worked examples.

## A recipe vs its neighbors

- **Skill** = a capability the agent *executes*. A recipe = a blueprint the agent *builds from*.
- **ADR** = *why* a decision was made. A recipe = *how* to build the whole solution.
- **Spec** = drives one feature to done in one project. A recipe = project-agnostic, reusable.
- **Cookbook** (OpenAI/Anthropic/LangChain) = runnable notebooks with code. A recipe = conceptual, code-free.

## Anatomy

See [`_template.md`](./_template.md). Every recipe has: when to use / outcome /
architecture / ingredients (slots) / build steps / **Tune** (the questions the agent
asks) / efficiency / security / anti-patterns / trade-offs / prerequisites / **related
recipes** (recipes compose — link companions).

## Examples

| Recipe | What it builds | Maturity |
|--------|----------------|----------|
| [rag-support-over-live-source](./rag-support-over-live-source/RECIPE.md) | A support agent grounded in your product's living docs/code (auto-ingested on deploy) + the asking user's real-time data, read-only. | tested |
| [rag-evaluation-harness](./rag-evaluation-harness/RECIPE.md) | A test harness that measures retrieval and generation quality separately, gates deploys on thresholds, and monitors production drift. Companion to any RAG. | tested |

These two **compose**: build the support agent with the first, then measure it (and gate
deploys) with the second. They reference each other through the `related` frontmatter —
the precedent that recipes link instead of duplicate.

## Authoring notes

- **In English**, so a recipe is shareable outside your workspace.
- **No secrets, no project specifics** — keep it generic enough to drop into any stack.
- **Bake in efficiency and security** as first-class sections — a recipe that recomputes
  unchanged work or leaks secrets is an anti-pattern, not a recipe.
- **Recipes compose**: link companions/prerequisites via `related`; never duplicate.
- Extract recipes from solutions you actually built, then sand off the specifics.
