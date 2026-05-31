# Library - starter rules and recommended skills

A curated, lift-and-adapt collection: opinionated starter **rules + anti-patterns**
per language, and **recommended skills** to install. When you adopt the harness in a
new project, copy the relevant rules into its `CLAUDE.md` / anti-patterns and install
the skills for your stack - a running start instead of a blank page.

```
library/
├── rules/
│   ├── engineering-principles.md  # cross-language: never fail silently, build the
│   │                              #   real thing, determinism for exact work, ...
│   ├── typescript.md   # TypeScript on Bun - strict, validated, no any
│   ├── rust.md         # clippy-clean, Result over unwrap, no #[allow] escapes
│   └── go.md           # idiomatic Go: wrapped errors, context, small interfaces
└── SKILLS.md           # recommended Claude Code skills, by language
```

These are starting points, not law - keep what fits, cut what doesn't, and state each
kept rule as a decision + a reason (see [`docs/WRITING-CLAUDE-MD.md`](../docs/WRITING-CLAUDE-MD.md)).
They blend the canonical guides (Rust API guidelines, Effective Go, strict-TS) with
practices proven running a real harness - the [`engineering-principles.md`](rules/engineering-principles.md)
set in particular is the hard-won, language-agnostic core.

## Why these languages pair well with coding agents

This isn't taste - it follows straight from the harness thesis. An agent is reliable
when it gets **fast, deterministic feedback** it can't argue with (the
[sensors](../docs/HARNESS.md) layer). Languages differ enormously in how good a
feedback loop they hand an agent, and these three are at the top:

- **TypeScript (strict).** The type checker turns a whole class of agent mistakes into
  an instant `tsc` error, before any code runs. `tsc --noEmit` is a cheap, honest
  sensor on every change. **Use Bun.** It collapses runtime + test runner + bundler +
  package manager into one fast binary - fewer moving parts to misconfigure and a
  near-instant verify loop, which is the single biggest lever on how fast an agent
  iterates in the JS world. See [`rules/typescript.md`](rules/typescript.md).
- **Rust.** The compiler plus `clippy` are the strictest, most *informative* sensor of
  any mainstream language: the borrow checker and clippy turn "would be a runtime bug"
  into "won't compile," and the diagnostics are good enough that an agent can read the
  error and self-correct. `cargo clippy -D warnings` is a brutal, non-negotiable gate.
  See [`rules/rust.md`](rules/rust.md).
- **Go.** A small surface and a deliberately unclever language mean fewer ways for an
  agent to write something too-slick-to-verify. Fast compiles, `go vet` +
  `golangci-lint`, the built-in test runner and `-race` give a tight, cheap loop. See
  [`rules/go.md`](rules/go.md).

The common thread: **strong static checks + fast tooling = the agent is corrected in
seconds by something deterministic.** That's the computational-sensors layer of the
harness, handed to you by the language itself. Languages without it (loose typing, slow
or fragmented tooling, lots of runtime-only failure modes) make the agent guess longer
and verify less - exactly what a harness is fighting.

## Recommended skills

See [`SKILLS.md`](SKILLS.md) for a curated, source-checked list of Claude Code skills
worth installing, grouped by language. Install the ones for your stack so the agent
inherits the language's idioms and lints as guidance, not just as after-the-fact errors.
