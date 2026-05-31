# CLAUDE.md - <app name>

<!--
Per-subrepo instructions. Add ONLY what's specific to this app - the root CLAUDE.md
already covers workspace-wide conventions. See docs/WRITING-CLAUDE-MD.md.
-->

## What this is

<One paragraph: what this app does and its stack.>

## Commands

```bash
<pkg> dev       # run locally
<pkg> build     # production build
<pkg> test      # tests
<pkg> lint      # linter
```

## Architecture (load-bearing rules)

<!-- State decisions as rules + the reason. The reason is what lets the agent
generalize to cases you didn't list. -->

1. **<Decision>.** <The rule.> Why: <the consequence of breaking it>.
2. **<Decision>.** <The rule.> Why: <...>.
3. **<Decision>.** <The rule.> Why: <...>.

## Patterns to follow

- **<Pattern>:** <one-line example or the canonical snippet>.
- **<Pattern>:** <...>.

## Anti-patterns (do NOT)

- <recurring mistake> -> <what to do instead> (<why it bites>).
- <recurring mistake> -> <what to do instead>.

<!-- For a large codebase, move these to docs/anti-patterns/*.md and link them.
See template/examples/anti-patterns.example.md. -->

## Conventions specific to this app

- <naming / file layout / test policy that differs from the workspace default>
