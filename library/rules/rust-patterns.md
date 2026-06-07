# Rust — Advanced Patterns

> Complements `rust.md`. Assumes you already follow the basics there (idiomatic
> error handling with `?`, clippy clean, no `unwrap()` in production paths).
> This file captures the recipes that bite people in real apps: blocking I/O,
> async locking, durable writes, graceful degradation, config-as-data, and the
> structural choices that make code testable and safe to ship.

These rules are opinionated but framework-honest: they apply to any non-trivial
Rust app (a desktop UI, a daemon, a long-running service), not just toy CLIs.

---

## Rules

### Run blocking I/O off the async runtime

Blocking calls (a PTY read, a CPU-bound parse, shelling out to a subprocess,
synchronous file/socket I/O) starve an async runtime if you run them on a runtime
worker thread. Move them out.

- For **streaming/long-lived blocking work** (e.g. reading a child process's
  output forever), use a dedicated `std::thread` and send results back to the
  async/UI side over an `mpsc` channel. Don't try to force it into a `tokio` task.
- For **one-shot blocking work**, use `tokio::task::spawn_blocking` and `.await`
  the handle.

```rust
// GOOD — long-lived blocking reader on its own thread, results via channel
let (tx, rx) = std::sync::mpsc::channel();
std::thread::spawn(move || {
    while let Some(line) = read_blocking(&mut reader) {
        if tx.send(line).is_err() {
            break; // receiver gone, stop
        }
    }
});

// GOOD — one-shot blocking work
let output = tokio::task::spawn_blocking(move || {
    Command::new("git").args(["worktree", "add", &path]).output()
})
.await??;
```

```rust
// BAD — blocks a runtime worker thread, stalls every other task
let output = Command::new("git").args(["worktree", "add", &path]).output()?;
```

### Never hold a lock guard across `.await`

A `MutexGuard` / `RwLockReadGuard` held across an `.await` point can deadlock and
will pin the lock for the entire async operation. Extract what you need inside a
small scope, drop the guard, then await.

```rust
// BAD — guard stays locked for the whole async call
let guard = state.lock().await;
do_async_thing().await;       // anything else needing the lock now waits

// GOOD — copy out, drop the guard, then await
let snapshot = {
    let guard = state.lock().await;
    guard.relevant_field.clone()
}; // guard dropped here
do_async_thing(snapshot).await;
```

This applies to `std::sync::Mutex` too: clippy's `await_holding_lock` flags it,
but the discipline matters even where clippy can't see it.

### Write files atomically (temp + rename)

A crash or power loss mid-write leaves a truncated, corrupt file. Write to a
sibling temp file, flush, then atomically `rename` it over the target. `rename`
within the same directory is atomic on the major platforms.

```rust
fn save_atomic(path: &Path, bytes: &[u8]) -> anyhow::Result<()> {
    let dir = path.parent().context("path has no parent dir")?;
    let tmp = dir.join(format!(".{}.tmp", uuid::Uuid::new_v4()));
    {
        let mut f = fs::File::create(&tmp)
            .with_context(|| format!("creating temp file {}", tmp.display()))?;
        f.write_all(bytes)?;
        f.sync_all()?; // flush to disk before the rename
    }
    fs::rename(&tmp, path)
        .with_context(|| format!("renaming {} -> {}", tmp.display(), path.display()))?;
    Ok(())
}
```

Use this for any state you care about: persisted app state, caches you don't want
to re-derive, user config you write back.

### Degrade gracefully when loading fails

User-facing state and config can be missing, partial, or from an older schema.
A failed load should not crash the app — log it and fall back to a sane default.

```rust
fn load_state(path: &Path) -> State {
    match fs::read(path).and_then(|b| Ok(serde_json::from_slice::<State>(&b)?)) {
        Ok(state) => state,
        Err(err) => {
            tracing::warn!(error = %err, path = %path.display(),
                "could not load state, starting from default");
            State::default()
        }
    }
}
```

Reserve hard failure for things the program genuinely cannot run without. Anything
the user can recover from (a corrupt cache, a stale config) should fall back, not
abort. Surface user-relevant errors through the UI/log, never via a panic.

### Treat configuration as data, not code

Colors, spacings, fonts, timeouts, paths, feature toggles — anything a user or
operator might want to change — live in a config file (TOML is a good default for
human-edited config), deserialized once into a typed struct. Never hardcode these
values scattered across the codebase.

```rust
#[derive(serde::Deserialize)]
#[serde(default)]
struct Theme {
    accent: [u8; 3],
    row_height: f32,
    font_size: f32,
}

impl Default for Theme {
    fn default() -> Self {
        Self { accent: [60, 130, 220], row_height: 28.0, font_size: 14.0 }
    }
}
```

- `#[serde(default)]` so a config missing a field still loads (forward/backward
  compatible).
- Load config once at startup into one typed struct; pass references around.
- Resolve user paths portably: `dirs::config_dir()` / `home_dir()` + `PathBuf::join`,
  never a hand-built string with `/` or `\`.

### Split the crate into a library plus a thin binary

Put all real logic behind a `lib.rs` public API; make `main.rs` a thin wrapper
that wires up logging and calls into the library. This guarantees every `pub fn`
is reachable from integration tests even if `main` never calls it directly, and
keeps the binary's entry point trivial.

```
src/
├── lib.rs    -- public API, re-exports modules
├── main.rs   -- bootstrap: init logging, parse args, call into lib
├── state/    -- domain state, load/save
├── io/        -- side-effecting work (filesystem, subprocess)
└── ...        -- one concept per file; split files past ~300 lines
```

Start everything private; mark `pub` only what crosses a module boundary, and
`pub(crate)` for internals used by the binary but not exported.

### Enforce hard pre-commit gates

Every commit must pass the full gate locally and in CI — no "fix it later":

```bash
cargo fmt --check
cargo clippy --all-targets -- -D warnings   # warnings are errors
cargo test --all-targets
```

If any of the three fails, the commit doesn't happen. Wire these into CI on every
target platform you support so a green build is a real signal.

### Zero `unsafe`, zero `#[allow]`

- **No `unsafe`** unless there is a specific, reviewed reason with a `// SAFETY:`
  comment justifying every invariant. For most application code the answer is
  none.
- **No `#[allow(...)]` to silence warnings.** If clippy or the compiler complains,
  fix the cause: use the code, delete it, or migrate the API. An `#[allow]` is a
  warning you decided to stop seeing — it accrues as debt.

### Keep config/state writes cross-platform

- Build paths with `PathBuf::join`, not string concatenation.
- Gate genuinely OS-specific behavior with `#[cfg(target_os = "...")]` and always
  provide a fallback when shelling out to an OS-specific binary.
- Prefer invoking tools that exist identically across platforms (e.g. `git`) over
  platform-specific shells.

---

## Anti-patterns

### Blocking the event/UI loop

In an immediate-mode UI or any single-threaded event loop, the per-frame callback
must only read state and render. No file I/O, no network, no `block_on`, no
unbounded loops. Do the work on a worker thread and feed results back over a
channel; request a repaint when new data arrives, not on every frame.

```rust
// BAD — I/O on every frame
fn update(&mut self) {
    let data = load_from_disk().unwrap(); // re-reads the disk 60×/second
    self.render(&data);
}

// GOOD — drain channel, render cached state
fn update(&mut self) {
    while let Ok(event) = self.events_rx.try_recv() {
        self.apply(event);
    }
    self.render(&self.state);
}
```

### `Arc<Mutex<T>>` by reflex

Shared, synchronized state is only needed when state is *actually* shared across
threads or tasks. State owned by a single struct (e.g. a UI app handed `&mut self`)
needs neither `Arc` nor a lock. "Just in case" is not a reason — it adds contention
and deadlock surface.

### Non-atomic writes to important files

Writing directly over a live file (`File::create(path)` then `write_all`) means a
crash mid-write corrupts it. Always go through temp + rename for anything you'd be
sad to lose or re-derive.

### Crashing on a recoverable load

`unwrap()`/`expect()` on a config or state load turns "the file is slightly off"
into "the app won't start." Match, log, and fall back to a default instead.

### Hardcoded, scattered configuration

Magic numbers and literals (colors, sizes, timeouts, URLs, paths) sprinkled across
modules can't be changed without a recompile and drift out of sync. Centralize them
as typed, defaulted config.

### `#[allow(...)]` and `unsafe` as shortcuts

Both are escape hatches that hide a problem instead of solving it. Treat their
presence in a diff as something that must be justified out loud, not waved through.

### Hand-built platform paths and OS assumptions

```rust
// BAD — breaks off-Windows, assumes a specific user layout
let p = format!("{}\\.app\\state.json", std::env::var("HOME").unwrap());

// GOOD — portable, fallible-but-handled
let p = dirs::home_dir()
    .context("home directory not available")?
    .join(".app")
    .join("state.json");
```

### Premature error-type ceremony

A custom `thiserror` enum is the right call for a published library with a stable
error contract. For an application, a context-rich `anyhow::Result` (with
`.with_context(...)` at each boundary) covers nearly everything. Reach for typed
errors only when a specific module genuinely needs to match on error variants —
not up front.
