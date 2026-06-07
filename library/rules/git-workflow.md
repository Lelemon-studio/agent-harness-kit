# Git Workflow

Conventions for commits, branches, pull requests, and protected files. These apply
across the whole repository (single repo or monorepo).

## Rules

### Commits — Conventional Commits

Format: `<type>(<scope>): <description>`

```
feat(backend): add token rotation for refresh tokens
fix(frontend): resolve table pagination issue
docs(core): document the scheduling module
chore(deps): bump linter to latest minor
```

- Keep the description in the imperative mood, lowercase, no trailing period.
- One logical change per commit. Don't bundle unrelated edits.
- Scope is optional but recommended once the project has clear boundaries.

**Types**

| Type | Use for |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change with no behavior change |
| `perf` | Performance improvement |
| `test` | Add or fix tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |
| `build` | Build system or external dependencies |

**Scopes** — use generic names tied to your project's structure, for example:

- `backend`, `frontend`, `core` — applications
- `types`, `ui`, `config` — shared packages
- `ci`, `docker`, `deps` — infrastructure

Pick a small, stable set of scopes and reuse them. Avoid one-off scope names.

### Branches

- `main` / `master` — production, protected. Never commit directly.
- `feature/<short-description>` — new functionality.
- `fix/<short-description>` — bug fixes.
- `chore/<short-description>` — maintenance.

Use short, kebab-case descriptions (`feature/order-export`, not `feature/OrderExport`).
If you track issues, you may prefix with the id: `feature/123-order-export`.

### Pull Requests

- Title follows the commit format: `feat(backend): ...`.
- Description includes: a short summary, the notable changes, and a test plan.
- CI must be green before merge — no merging on red or pending checks.
- Prefer **squash merge** for feature branches: one clean commit on the main branch.
- Keep PRs small and focused; large PRs are hard to review and to revert.

### Protected files — never commit

Never commit secrets, local config, or build artifacts:

- Environment files: `.env`, `.env.local`, `.env.production`
- Credentials and keys: `credentials.json`, `*.pem`, `*.key`
- Generated output and dependencies: `node_modules/`, `dist/`, `build/`

Keep these in `.gitignore`. Commit a `.env.example` with placeholder values instead
of the real file. If a secret is committed by mistake, rotate it — removing it from
history is not enough.

### Hooks

If the project uses git hooks (e.g. a pre-commit/commit-msg manager):

- `pre-commit` — run formatter and linter on staged files.
- `commit-msg` — validate the commit message format.
- Don't bypass hooks with `--no-verify` unless you have a documented reason.

## Anti-patterns

- **Committing to `main`/`master` directly.** Branch, open a PR, let CI run.
- **Merging on red CI.** Fix the build first; a broken main blocks everyone.
- **Vague messages** like `fix stuff`, `wip`, `update`. State what changed and why.
- **Mega-commits / mega-PRs** mixing a refactor, a feature, and a formatting pass.
  Split them so each is reviewable and revertable on its own.
- **Committing secrets or build output.** Gitignore them up front, not after the fact.
- **Inventing a new scope per commit.** Reuse the project's agreed scope set.
- **Routinely passing `--no-verify`.** If hooks are noisy, fix the hooks, not the habit.
