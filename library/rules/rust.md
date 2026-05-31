# Rust - starter rules and anti-patterns

Lift into a Rust project's `CLAUDE.md`. Blends the Rust API guidelines and clippy's
wisdom with practices proven running real agent-written Rust. State as decisions + why.

## The gate (non-negotiable)

- **`cargo clippy -- -D warnings` and `cargo fmt --check` must exit 0 before every
  commit.** Clippy warnings are errors; unformatted code doesn't land. Why: a clean,
  deterministic gate is the cheapest, most honest sensor an agent can have - it catches
  whole classes of mistakes in seconds, without judgment calls.
- **Never `#[allow(...)]` to silence clippy.** Fix the code clippy is pointing at, don't
  paper over it. The rare legitimate allow needs a comment justifying exactly why. Why:
  an `#[allow]` to pass the gate quietly disables the sensor - the bug it was warning
  about is still there, now invisible. This is the single most important Rust rule here.

## Errors

- **Library code returns typed errors** (an enum via `thiserror`); **binaries/apps use
  `anyhow`** for ergonomic propagation. Why: a library's caller needs to match on error
  variants; a binary just needs context and a clean exit.
- **No `unwrap()` / `expect()` on the production path.** Use `?`, `match`, or `let ...
  else`. (Fine in tests, examples, and truly-impossible cases with an `expect("reason")`
  that documents the invariant.) Why: an `unwrap` is a panic waiting for the input you
  didn't think of.
- **Don't stringly-type errors.** A typed enum beats `Err("something failed".into())`.
  Why: callers can't handle a string, and you lose the variant.

## Ownership and safety

- **Borrow before you clone.** Reach for `clone()` deliberately, never to silence the
  borrow checker - a fight with the borrow checker usually means the ownership is wrong,
  not that you need a clone. Why: reflexive cloning hides design problems and copies.
- **No `unsafe` without a `// SAFETY:` comment** that states the invariants you're
  upholding. Prefer a safe abstraction. Why: unsafe is where Rust's guarantees stop;
  the comment is the only review surface left.

## Idiom

- Prefer iterators and combinators where they read more clearly than a manual loop.
- Derive `Debug` on public types; mark builders/pure returns `#[must_use]`; follow the
  API guidelines for naming.
- Keep modules small and the public surface minimal - export what callers need, no more.

## Tests

- Unit tests in `#[cfg(test)]` modules, integration tests in `tests/`. Run the whole
  suite (and `cargo test` in CI) before merge.

## Anti-patterns (do NOT)

- `#[allow(clippy::...)]` to get past the gate -> fix what clippy flags.
- `unwrap()`/`expect()` on real input -> `?` / proper handling.
- `clone()` sprinkled to dodge borrows -> restructure ownership.
- `unsafe { }` with no `// SAFETY:` -> justify the invariants or avoid it.
- Returning `Box<dyn Error>` / strings from a library -> a `thiserror` enum.
