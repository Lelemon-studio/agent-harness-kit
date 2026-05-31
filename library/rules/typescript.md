# TypeScript on Bun - starter rules and anti-patterns

Lift into a TS project's `CLAUDE.md`. Pairs strict TypeScript with the Bun toolchain
and practices proven running real agent-written TS. State as decisions + why.

## Toolchain: Bun

- **Use Bun as the default runtime and toolchain** - `bun run`, `bun test`,
  `bun install`, `bunx`. One fast binary for run + test + bundle + package manager. Why:
  fewer moving parts to misconfigure and a near-instant verify loop, which is the
  biggest lever on how fast the agent iterates. Fall back to Node only for a dependency
  that genuinely needs it.
- **`tsc --noEmit` and the linter must pass before commit.** Bun runs your code, but the
  type checker is the sensor - keep it green. Why: a type error caught at check time is a
  bug that never reached runtime.

## Types

- **`strict: true`**, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
  Why: these turn the most common "looked fine, crashed at runtime" mistakes into
  compile errors.
- **No `any` to silence the compiler.** Use `unknown` + narrowing, a real type, or a
  schema parse. Why: `any` disables exactly the checks you adopted TS for, and it spreads.
- **Validate all external input at the boundary** (HTTP body, env, third-party JSON) with
  a schema (zod/valibot) and infer the type from it. Why: the type system only protects
  what you've actually proven at the edge; everything past the boundary is then safe.

## Errors and control flow

- **Never swallow an error.** No empty `catch {}`. Catch only to handle, log (structured,
  with context), or rethrow - a fallback is fine, a *silent* fallback is not. Why: a
  silent catch turns a loud failure into a mysterious one you debug for an hour later.
- **No floating promises.** `await` it, or `void` it deliberately. Why: an unhandled
  rejection is a crash or a silently-dropped operation.
- **Validate env once, at startup**, into a typed config object - don't read
  `process.env.X` scattered across the code. Why: one fail-fast check beats N undefined
  surprises in production.

## Idiom

- ESM and named exports; avoid default exports. Structured logger, never `console.log`
  in app code. Prefer `bun test` colocated with the code, testing the contract not the
  implementation.

## Anti-patterns (do NOT)

- `any` to make an error go away -> `unknown` + narrow, or fix the type.
- `catch {}` / `catch (e) {}` that swallows -> handle, log with context, or rethrow.
- An un-awaited promise -> `await` or explicit `void`.
- `process.env.X` read ad hoc -> a validated, typed config module.
- Trusting an external payload's shape -> parse it with a schema at the boundary.
- `console.log` in shipped code -> the structured logger.
