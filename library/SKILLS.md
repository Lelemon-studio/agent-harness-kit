# Recommended skills

A curated list of Claude Code **skills / plugins** worth installing, grouped by
language. A skill packages a language's idioms and lints as *guidance the agent reads*,
so good practice shows up as help during the work, not only as an error after it - the
same guides-plus-sensors idea as the rest of this harness.

> **Read before installing.** This is a point-in-time list (star counts checked
> 2026-05; they're a rough popularity signal, not a quality guarantee). Skills are
> third-party code that runs in your agent - skim a skill's source before installing it,
> prefer active and licensed repos, and install only what your stack needs. Most install
> via the plugin marketplace (`/plugin marketplace add <owner/repo>` then
> `/plugin install`) or `npx skills add <owner/repo>`; check the repo's README.

## Official (Anthropic)

- **[anthropics/skills](https://github.com/anthropics/skills)** (~145k) - the official
  Agent Skills repo: reference skills (document generation, data analysis, MCP
  scaffolding) and the SKILL.md format. Start here to understand how skills are built.
- **[anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)**
  (~29k, Apache-2.0) - Anthropic's curated directory of vetted Claude Code plugins
  (skills + hooks + commands + agents + MCP). The trustworthy place to discover plugins.
- **[Skills docs](https://code.claude.com/docs/en/skills)** - how skills work, the
  SKILL.md frontmatter, and invocation control.

## Curated indexes (browse these for your niche)

- **[hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)**
  (~45k) - the highest-authority curated index of skills, hooks, commands, and plugins.
- **[VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)**
  (~21k, MIT) - 100+ specialized subagents across 10 categories, incl. language
  specialists. Good source for the orchestration patterns in
  [`docs/AGENT-ORCHESTRATION.md`](../docs/AGENT-ORCHESTRATION.md).
- **[karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)**
  (~360, MIT) - 50+ verified skills with a testing/debugging/git-workflow focus.

## Rust

- **[actionbook/rust-skills](https://github.com/actionbook/rust-skills)** (~1.2k, MIT) -
  the most mature language-specific collection found: a meta-cognition framework
  (domain -> design -> language mechanics), ~31 core skills plus domain extensions
  (fintech, ML, embedded, web, CLI), real-time crate/version lookup, and an LSP-backed
  code navigator. Pairs directly with [`rules/rust.md`](rules/rust.md) (clippy-clean,
  no `#[allow]` escapes).

## TypeScript / Node

- **[Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills)** (~9.5k, MIT)
  - 66 skills across languages and frameworks (NestJS, Express, Fastify, React, Vue),
  auto-activated by request context. Broadest single collection.
- **[SpillwaveSolutions/mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill)**
  (small/nascent, MIT) - depth on enterprise TypeScript: strict tsconfig
  (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), advanced generics,
  framework integration.
- **[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** (~27k) -
  Vercel's official skills; the React/Next.js best-practices skill runs dozens of
  impact-ranked checks (bundle size, re-renders, async waterfalls). The pick if you ship
  React/Next.
- **Note on Bun:** no mature Bun-specific skill exists yet (these collections are
  Node-oriented). For the Bun toolchain parts, lean on [`rules/typescript.md`](rules/typescript.md).

## Go

- **[cxuu/golang-skills](https://github.com/cxuu/golang-skills)** (~100, Apache-2.0) -
  20 modular skills for idiomatic, production Go, distilled from the Google and Uber
  style guides and Effective Go: concurrency, error handling, testing, pprof. Pairs with
  [`rules/go.md`](rules/go.md).

## Cross-language / general

From the official repo and the curated indexes, the broadly useful ones to install
regardless of stack: **test-driven-development**, **systematic-debugging**, and
**code-review** skills (see anthropics/skills and karanb192's list). They encode process,
not syntax, so they help in any language - and complement this kit's `code-reviewer`
agent and `/rules-audit`.
