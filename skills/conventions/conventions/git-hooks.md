# Git hooks and local guardrails

Git hooks are one of the strongest anti-drift tools in a repo. They keep local changes aligned with repo conventions before CI ever runs.

## Goal

**Husky is the standard hook runner across FarMart repos.**

For pure Python repos with no existing `package.json`, add a minimal Node tooling layer so Husky can remain the standard entrypoint.

For Python repos, this means:
- use Husky as the hook entrypoint
- use `pre-commit`, `ruff`, and `pytest` as the underlying Python checks when appropriate
- add minimal Node tooling for Husky + commitlint when the repo is otherwise Python-only

Use hooks to prevent the most common kinds of repo drift:
- formatting drift
- commit-message drift
- branch naming drift
- package-manager drift
- lockfile drift
- secret leakage
- generated-artifact drift
- runtime/tooling drift

Hooks should be fast, deterministic, and targeted.

## Hook implementation pattern

Hooks should be thin wrappers.

Prefer:
- `.husky/*` files that only initialize Husky and call `scripts/hooks/*`
- reusable validation logic in `scripts/conventions/*`
- optional developer helpers in `scripts/dev/*`

### Preferred pattern

```sh
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

exec ./scripts/hooks/pre-commit.sh "$@"
```

## Anti-drift hook baseline

### Required baseline for JavaScript repos
- **pre-commit**
  - runtime sanity check
  - staged secret scan
  - staged formatting/linting via `lint-staged`
  - lockfile/package-manager drift checks
  - generated-artifact regeneration when specific files change
- **commit-msg**
  - conventional commit validation via `commitlint`
- **pre-push**
  - branch-name validation
  - targeted smoke check, typecheck, or fast test scope

### Required baseline for Python repos
- **pre-commit**
  - Husky entrypoint invoking `pre-commit` / `ruff`
  - lightweight file hygiene checks
  - optional secret scan
- **commit-msg**
  - conventional commit validation via `commitlint`
- **pre-push**
  - branch-name validation
  - targeted `pytest` scope where runtime is acceptable

### Optional repo-maintenance hooks
- **post-merge**
  - notify when runtime, lockfiles, or tool versions changed
- **post-checkout**
  - warn when branch switches require dependency refresh or runtime refresh

These hooks are useful for reducing environment drift, but they should never perform slow or destructive operations automatically.

## JavaScript hook conventions

Prefer:
- `husky`
- `lint-staged`
- `commitlint`

### pre-commit should catch

#### 1. Runtime drift
Examples:
- verify Node / pnpm versions from repo metadata
- fail fast when the local runtime does not match the repo contract

#### 2. Package-manager drift
Examples:
- forbid `package-lock.json` or `yarn.lock` in pnpm repos
- require `pnpm-lock.yaml` changes when `package.json` changes

#### 3. Secret leakage
Examples:
- scan staged changes only
- block obvious credential additions before they reach origin

#### 4. Formatting and lint drift
Examples:
- run `lint-staged`
- format only staged files
- run ESLint/Biome only on staged scopes

#### 5. Generated artifact drift
Examples:
- regenerate Swagger or JSDoc only when controllers, routes, or API entrypoints change
- restage generated files automatically if regeneration succeeds

### commit-msg should catch
- non-conventional commit messages
- malformed scopes or empty subjects if the repo enforces stricter rules

### pre-push should catch
- invalid branch names
- fast smoke checks that give signal without duplicating full CI
- targeted test or typecheck commands only when fast enough

## Python hook conventions

Prefer:
- `husky` as the hook runner
- `pre-commit` for file hygiene and Python-local checks
- `ruff check`
- `ruff format --check`
- `pytest` for targeted scopes where reasonable

### pre-commit should catch
- formatting drift
- import and lint drift
- trailing whitespace / EOF / merge marker hygiene
- accidental large files or notebook outputs if the repo wants those checks
- optional secret leakage checks

### pre-push should catch
- branch naming drift
- small targeted test scope for touched modules or a fast smoke suite

## Rules

- hooks should finish quickly
- hooks must not require secrets
- hooks should validate only what is necessary for the current change when possible
- hooks should be deterministic and non-interactive
- hooks should block clear policy violations, not act as a second full CI pipeline
- `.husky/*` files should stay minimal and delegate to `scripts/hooks/*`
- reusable enforcement logic should live in `scripts/conventions/*`

## Recommended hook ordering

### pre-commit
1. runtime check
2. secret scan
3. package-manager / lockfile drift checks
4. staged lint/format
5. conditional generated-artifact regeneration

### pre-push
1. branch-name validation
2. fast smoke check or targeted test/typecheck

## Drift-prevention patterns worth standardizing

### 1. Lockfile coupling
If `package.json` changes, the correct lockfile must also change.

### 2. Forbidden lockfiles
A pnpm repo should reject staged `package-lock.json` and `yarn.lock`.

### 3. Staged-only secret scanning
Secret scans should target staged content so they stay fast and relevant.

### 4. Conditional codegen
Only regenerate docs or specs when relevant source files change.

### 5. Branch lint at push time
Catch naming violations locally before CI rejects the push.

### 6. Runtime refresh notifications
Use `post-merge` or `post-checkout` to notify developers when they should refresh deps or runtime, but do not silently mutate their environment.

## Do

- keep hooks cheap and reliable
- use hooks to block the most common forms of repo drift
- align local hooks with CI checks where practical
- make codegen hooks conditional on relevant file changes
- make error messages actionable and specific

## Don’t

- run the full world on every commit
- require network access or credentials for basic hooks
- make hooks so slow that developers bypass them
- mutate developer environments automatically in post-merge hooks
- regenerate large artifacts on every commit regardless of file changes

For the opinionated mandatory baseline by repo type, also read [`hook-standard.md`](./hook-standard.md).

## Suggested standards to enforce across FarMart repos

### JavaScript repos
- `pre-commit`: runtime check + staged secret scan + lockfile drift check + `lint-staged`
- `commit-msg`: `commitlint --edit "$1"`
- `pre-push`: branch lint + fast smoke check

### Python repos
- `pre-commit`: Husky entrypoint calling `pre-commit` / `ruff`
- `commit-msg`: `commitlint --edit "$1"`
- `pre-push`: Husky entrypoint for branch lint + targeted `pytest`

### Monorepos
- prefer changed-file or affected-only logic
- never run the entire workspace in a local hook unless the repo is tiny

---

**Version**: 1.5.0
**Last Updated**: 2026-04-22
