# Skills

A skill packages a workflow's idioms, lints, and process as *guidance the agent reads*,
so good practice shows up as help during the work, not only as an error after it - the
same guides-plus-sensors idea as the rest of this harness.

Two kinds of skill live here:

1. **Skills shipped with this kit** - the harness's own commands, under
   [`template/.claude/commands/`](../template/.claude/commands/). These are part of the
   kit, MIT-licensed, and safe to use as-is. Start with these.
2. **Recommended third-party skills** - a curated, point-in-time list of community
   skills worth installing, grouped by purpose. These are *pointers, not our code* -
   skim each before you install it.

---

## Skills shipped with this kit

These ship in [`template/.claude/commands/`](../template/.claude/commands/) and become
slash commands once the template is in place. They encode the harness's own planning and
maintenance loops.

### Spec planning system

A lightweight, file-based planning system: each feature gets a `specs/YYYYMMDD-HHMM-<name>/`
folder with four files - `SPEC.md` (problem, proposal, alternatives, risks), `PHASES.md`
(phased plan with per-phase success criteria and verification commands), `SESSION.md`
(context to resume quickly), and `DONE.md` (acceptance checklist). Plans live in the repo
as plain Markdown the agent reads at the start of each session, so context survives across
sessions and compactions.

- **`/spec <name>`** - scaffold a new feature spec (kebab-case name) and offer to fill in
  the problem/proposal and phases. Use it at the **start** of any non-trivial change.
- **`/spec-continue <name>`** - resume an existing spec, loading SPEC/PHASES/SESSION so the
  agent picks up where it left off. Use it at the start of each follow-up session.
- **`/spec-status [name]`** - show one spec's progress, or list all specs with no argument.
  Use it to see what's in flight.
- **`/spec-done <name>`** - walk the acceptance checklist and mark the feature complete.
  Use it when closing out work.

When to use: any feature or refactor big enough that you'd otherwise lose the thread
between sessions. Skip it for one-line fixes.

### `/memory-gc [topic]`

A reflection pass over the agent's file-based memory: cluster by topic, detect duplicates
and contradictions, and propose merges / supersessions / deletions while keeping the
`MEMORY.md` index under its load ceiling. It is **read-only until you approve** - it audits,
proposes, then applies only what you confirm. When to use: occasionally, when memory feels
messy or the index is bloating - not every session.

### `/rules-audit [path]`

Audits whether a project (or sub-repo) has a usable set of agent rules - `CLAUDE.md`,
anti-patterns list, `.claude/rules/`, wired hooks - and proposes concrete, code-grounded
additions where they're thin or stale. It reads the actual code to surface conventions that
are followed but never written down, then suggests rules and hooks and waits for your OK
(it does not silently write rules). When to use: when onboarding a repo to this harness, or
when reviews keep missing things the code already implies. Pairs with the `code-reviewer`
agent, which checks diffs against whatever rules exist.

---

## Recommended third-party skills

A curated list of community Claude Code **skills / plugins** worth installing, grouped by
purpose.

> **Read before installing.** This is a point-in-time list (star counts checked
> 2026-05; they're a rough popularity signal, not a quality guarantee). Skills are
> third-party code that runs in your agent - skim a skill's source before installing it,
> prefer active and licensed repos, and install only what your stack needs. Most install
> via the plugin marketplace (`/plugin marketplace add <owner/repo>` then
> `/plugin install`) or `npx skills add <owner/repo>`; check the repo's README.

### Where to discover (official + indexes)

- **[anthropics/skills](https://github.com/anthropics/skills)** (~145k) - the official
  Agent Skills repo: reference skills (document generation, data analysis, MCP
  scaffolding) and the SKILL.md format. Start here to understand how skills are built.
- **[anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)**
  (~29k, Apache-2.0) - Anthropic's curated directory of vetted Claude Code plugins
  (skills + hooks + commands + agents + MCP). The trustworthy place to discover plugins.
- **[Skills docs](https://code.claude.com/docs/en/skills)** - how skills work, the
  SKILL.md frontmatter, and invocation control.
- **[hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)**
  (~45k) - the highest-authority curated index of skills, hooks, commands, and plugins.
- **[VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)**
  (~21k, MIT) - 100+ specialized subagents across 10 categories, incl. language
  specialists. Good source for the orchestration patterns in
  [`docs/AGENT-ORCHESTRATION.md`](../docs/AGENT-ORCHESTRATION.md).
- **[karanb192/awesome-claude-skills](https://github.com/karanb192/awesome-claude-skills)**
  (~360, MIT) - 50+ verified skills with a testing/debugging/git-workflow focus.

### Language idioms

- **Rust - [actionbook/rust-skills](https://github.com/actionbook/rust-skills)** (~1.2k,
  MIT) - the most mature language-specific collection found: a meta-cognition framework
  (domain -> design -> language mechanics), ~31 core skills (ownership, error handling,
  concurrency, type-driven design) plus domain extensions (fintech, ML, embedded, web,
  CLI), real-time crate/version lookup, and an LSP-backed code navigator. Pairs directly
  with [`rules/rust.md`](rules/rust.md) (clippy-clean, no `#[allow]` escapes).
- **TypeScript / Node - [Jeffallan/claude-skills](https://github.com/Jeffallan/claude-skills)**
  (~9.5k, MIT) - 66 skills across languages and frameworks (NestJS, Express, Fastify,
  React, Vue), auto-activated by request context. Broadest single collection.
- **TypeScript depth - [SpillwaveSolutions/mastering-typescript-skill](https://github.com/SpillwaveSolutions/mastering-typescript-skill)**
  (small/nascent, MIT) - enterprise TypeScript: strict tsconfig
  (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), advanced generics,
  framework integration.
- **Go - [cxuu/golang-skills](https://github.com/cxuu/golang-skills)** (~100, Apache-2.0)
  - 20 modular skills for idiomatic, production Go, distilled from the Google and Uber
  style guides and Effective Go: concurrency, error handling, testing, pprof. Pairs with
  [`rules/go.md`](rules/go.md).
- **Note on Bun:** no mature Bun-specific skill exists yet (these collections are
  Node-oriented). For the Bun toolchain parts, lean on
  [`rules/typescript.md`](rules/typescript.md).

### Backend

Skills that scaffold APIs, optimize queries, and encode auth/security patterns for
Node/Express/Go/Python + Postgres/GraphQL/REST stacks. Useful when designing APIs,
tuning database queries, or implementing business logic. Look under the
[curated indexes](#where-to-discover-official--indexes) for a *senior-backend*-style
skill, or for framework-specific entries in Jeffallan's collection above. Complements
[`rules/`](.) and the `code-reviewer` agent.

### Frontend

Skills for modern React / Next.js / TypeScript / Tailwind work - component scaffolding,
bundle analysis, state, and UI best practices.

- **[vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)** (~27k) -
  Vercel's official skills; the React/Next.js best-practices skill runs dozens of
  impact-ranked checks (bundle size, re-renders, async waterfalls). The pick if you ship
  React/Next.
- For broader component/perf coverage, see *senior-frontend*-style and
  *web-performance-optimization* skills via the curated indexes above.

### Design

Skills that raise UI/UX quality and produce distinctive, non-generic interfaces, plus
static visual design (posters, diagrams) and mobile-first decision-making for iOS/Android.
Browse the curated indexes for *frontend-design*, *ui-ux-pro-max*, *mobile-design*, and
*canvas-design*-style skills. Useful when you want polished output rather than default AI
aesthetics; skim each, since design skills tend to bundle a lot of opinionated assets.

### Prompt engineering / agents

Skills for building AI products on top of LLMs: prompt patterns, structured outputs,
few-shot / chain-of-thought, RAG and agent design, and MCP server authoring. See the
official **[anthropics/skills](https://github.com/anthropics/skills)** MCP-scaffolding
reference and *mcp-builder* / *senior-prompt-engineer* / *agent-development*-style skills
in the curated indexes. Useful when you're writing tools, system prompts, or evals -
complements [`docs/AGENT-ORCHESTRATION.md`](../docs/AGENT-ORCHESTRATION.md).

### Security

Skills for application security review, threat modeling, crypto implementation, and audits.
Look for a *senior-security*-style skill via the curated indexes, and pair it with this
kit's `security-review` command and the `code-reviewer` agent. Treat security skills with
extra scrutiny before installing - they often want broad tool access.

### Research / writing

Skills for higher-quality prose and research: removing AI-tells from text, researching with
citations, SEO, and marketing/positioning content. Browse the curated indexes for
*humanizer*, *content-research-writer*, *copywriting*, *seo-optimizer*, and
*marketing-strategy*-style skills. Useful for READMEs, docs, and launch material; keep an
editorial eye on output, since content skills vary widely in quality.

### Cross-language / general process

From the official repo and the curated indexes, the broadly useful ones to install
regardless of stack: **test-driven-development**, **systematic-debugging**, **clean-code**,
**brainstorming**, and **code-review** skills (see anthropics/skills and karanb192's list).
They encode process, not syntax, so they help in any language - and complement this kit's
`code-reviewer` agent and `/rules-audit`.
