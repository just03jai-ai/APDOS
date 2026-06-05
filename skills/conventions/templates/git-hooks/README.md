# Git hook templates

Starter hook templates that focus on preventing repo drift.

**Husky is the standard hook runner.**
For Python repos, Husky should invoke `pre-commit`, `ruff`, and `pytest` rather than replacing them.

**Hooks should stay thin.**
The real logic should live under `scripts/hooks/` and `scripts/conventions/`.

For the opinionated mandatory baseline, read [`../../conventions/hook-standard.md`](../../conventions/hook-standard.md).

## Shared assets

Copy these first for both JavaScript and Python repos:

### Husky hooks
- [`shared/.husky/pre-commit`](./shared/.husky/pre-commit)
- [`shared/.husky/commit-msg`](./shared/.husky/commit-msg)
- [`shared/.husky/pre-push`](./shared/.husky/pre-push)

### Shared scripts
- [`shared/scripts/hooks/commit-msg.sh`](./shared/scripts/hooks/commit-msg.sh)
- [`shared/scripts/conventions/scan-staged-secrets.sh`](./shared/scripts/conventions/scan-staged-secrets.sh)
- [`shared/scripts/conventions/branch-lint.mjs`](./shared/scripts/conventions/branch-lint.mjs)

## JavaScript / TypeScript

### JS-specific scripts
- [`javascript/scripts/hooks/pre-commit.sh`](./javascript/scripts/hooks/pre-commit.sh)
- [`javascript/scripts/hooks/pre-push.sh`](./javascript/scripts/hooks/pre-push.sh)
- [`javascript/scripts/conventions/check-runtime.sh`](./javascript/scripts/conventions/check-runtime.sh)
- [`javascript/scripts/conventions/check-pnpm-lockfiles.sh`](./javascript/scripts/conventions/check-pnpm-lockfiles.sh)

### Config files
- [`javascript/commitlint.config.js`](./javascript/commitlint.config.js)
- [`javascript/lint-staged.config.mjs`](./javascript/lint-staged.config.mjs)

### Included drift checks
- runtime sanity check
- staged secret scan
- forbidden lockfile detection
- lockfile coupling
- staged formatting/linting
- commit message validation
- branch naming validation on push
- fast smoke check hook point

## Python

### Python-specific scripts
- [`python/scripts/hooks/pre-commit.sh`](./python/scripts/hooks/pre-commit.sh)
- [`python/scripts/hooks/pre-push.sh`](./python/scripts/hooks/pre-push.sh)
- [`python/scripts/conventions/check-runtime.sh`](./python/scripts/conventions/check-runtime.sh)
- [`python/scripts/conventions/run-pre-commit.sh`](./python/scripts/conventions/run-pre-commit.sh)
- [`python/scripts/conventions/run-smoke-tests.sh`](./python/scripts/conventions/run-smoke-tests.sh)

### Config files
- [`python/README.md`](./python/README.md)
- [`python/package.json`](./python/package.json)
- [`python/.pre-commit-config.yaml`](./python/.pre-commit-config.yaml)
- [`python/commitlint.config.js`](./python/commitlint.config.js)
- [`python/pyproject.toml.snippet`](./python/pyproject.toml.snippet)

### Included drift checks
- Python runtime sanity check
- staged secret scan
- file hygiene
- `ruff format --check`
- `ruff check`
- commit message validation
- optional branch lint on push
- targeted smoke test hook point

## Notes

These are starter templates, not drop-in guarantees.

For pure Python repos, add the minimal `package.json` so Husky and commitlint can remain the standard hook layer.

For the final merged target structure, start with [`scaffold/README.md`](./scaffold/README.md).
For a complete JavaScript setup guide, start with [`javascript/README.md`](./javascript/README.md).
For a complete pure-Python setup guide, start with [`python/README.md`](./python/README.md).

Before use:
- copy `shared/` first, then merge in the repo-type-specific folder
- wire the referenced scripts into the target repo
- adjust commands for npm vs pnpm vs uv
- keep hooks fast
- align local hooks with CI rather than duplicating full CI
