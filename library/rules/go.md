# Go - starter rules and anti-patterns

Lift into a Go project's `CLAUDE.md`. Effective Go and the Google/Uber style guides,
plus practices proven running real agent-written Go. State as decisions + why.

## The gate

- **`gofmt`/`goimports` clean, `go vet` clean, `golangci-lint` clean, and
  `go test ./...` green before commit.** Run tests with `-race`. Why: Go's tooling is
  fast and deterministic - a tight, cheap sensor the agent should never bypass.

## Errors

- **Check every error.** No `x, _ := thing()` that drops an error something can return.
  Why: a swallowed error is a silent failure you debug from the symptom an hour later.
- **Wrap with context as it travels up:** `fmt.Errorf("loading invoice %s: %w", id,
  err)`. Use `errors.Is` / `errors.As` at the boundary that decides. Why: a bare
  "record not found" with no context is unactionable; `%w` preserves the chain.
- **Don't `panic` for ordinary failures.** Return an `error`. Panic only for truly
  unrecoverable, programmer-error states. Why: a library that panics takes down its
  caller for a condition the caller could have handled.

## Idiom

- **`context.Context` is the first parameter** of any function doing I/O or that can be
  cancelled - never stored in a struct. Why: cancellation and deadlines have to flow
  through the call tree to work.
- **Accept interfaces, return structs**, and keep interfaces small (defined by the
  consumer). Why: small interfaces compose; big ones couple everything to one shape.
- **Own every goroutine's lifetime.** Know how it stops; don't start one you can't
  cancel or wait on. Why: leaked goroutines are a slow, invisible resource leak.
- Constructors return concrete types with unexported fields; prefer explicit over clever.

## Tests

- **Table-driven tests** are the default shape. Co-locate `_test.go` with the code.
  Test behavior through the exported API, not internals.

## Anti-patterns (do NOT)

- `x, _ := f()` discarding an error that matters -> check and wrap it.
- `panic` for a normal failure path -> return an `error`.
- A returned error with no context -> `fmt.Errorf("...: %w", err)`.
- `context.Context` stored in a struct field -> pass it as the first argument.
- A broad interface with many methods -> small, consumer-defined interfaces.
- Starting a goroutine with no way to stop or await it -> own its lifetime.
