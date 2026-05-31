# Engineering principles (cross-language)

Language-agnostic rules that hold regardless of stack - distilled from running a real
harness, not from a textbook. These are the ones that bite hardest when an agent
ignores them, because each turns a quiet failure into a loud, debuggable one. Lift into
any project's `CLAUDE.md`.

## Never fail silently

- **Don't swallow errors.** No empty `catch {}`, no discarded `err`, no `except: pass`.
  Catch to handle, log with context, or rethrow - a fallback is fine, a *silent* one is
  not. Why: a silent failure costs an hour of debugging from a symptom; a logged one
  costs a glance.
- **Fail fast on bad config/state.** Validate inputs and environment at startup and
  stop loudly, rather than limping into an undefined state. Why: the error you see at
  boot is cheaper than the corruption you find in production.

## Build the real thing

- **Ship full implementations, not toy stubs or patches.** When the task is "read the
  file," read the whole file and handle its real shape - don't hard-code the happy path
  or fake the hard 20%. Why: a stub that looks done hides the work and breaks on the
  first real input.
- **No over-engineering either.** Build what the task needs, not a framework for an
  imagined future. Why: speculative generality is its own kind of unfinished - it adds
  surface nobody asked for.

## Determinism where correctness is exact

- **Don't use an LLM for work that must be exact** - money math, dates, tax, totals,
  anything auditable. Compute it deterministically in code. Use the model where
  *judgment* or *language* adds value (classification, drafting, suggestion). Why: a
  model that's right 99% of the time is a bug generator on a balance sheet.
- **Make derived numbers auditable.** A total should trace to its inputs, the formula,
  and the source. Why: "trust me" doesn't survive contact with a user checking their
  books - and a number you can't explain is one you can't debug.

## One source of truth

- **The designated store (usually the database) is authoritative.** Don't keep a second
  copy of a fact in code, cache, or the UI and let it drift. Derive, don't duplicate.
  Why: two copies of a fact become two answers, and the wrong one always wins the demo.

## Minimal, honest changes

- **Touch only what the task asks.** Don't refactor unrelated code, reformat untouched
  files, or rename things on the side inside a feature change. Why: a diff that does one
  thing is reviewable and revertible; a mixed one hides the real change.
- **Verify before you call it done.** Run the build, the linter, the tests; look at the
  result. Report honestly - if it's red, say red. Why: "done" that wasn't verified is a
  claim, not a fact, and the next person inherits the gap.
