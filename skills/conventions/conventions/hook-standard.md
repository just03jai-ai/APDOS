# FarMart hook standard

This document defines the opinionated baseline hook set to reduce repo drift across FarMart repos.

## Goals

The standard hook set should:
- stop common drift before CI
- be fast enough that developers do not bypass it
- stay local-only and not require credentials
- focus on changed files or fast smoke scopes

## Global rules

These rules apply to every repo type.

- **Husky is the standard hook runner** across FarMart repos.
- Pure Python repos should add a minimal Node tooling layer so Husky remains the standard entrypoint.
- Python repos may still use the `pre-commit` framework, but it should normally be invoked from Husky rather than replacing Husky.
- Hooks must be deterministic and non-interactive.
- Hooks must not require network access or secrets for the common path.
- `pre-commit` should focus on staged-file checks.
- `pre-push` should focus on branch validation and fast smoke checks.
- Full test suites belong in CI, not local hooks.
- Generated files should only be regenerated when relevant source files change.
- `.husky/*` files should remain thin wrappers that call `scripts/hooks/*`.
- Reusable enforcement logic should live in `scripts/conventions/*`.

## Mandatory hook baseline by repo type

## 1. JavaScript repos

### Required

#### `pre-commit`
Must include:
1. runtime/tooling check
   - validate Node and package manager against repo metadata
2. staged secret scan
3. package-manager drift protection
   - forbid `package-lock.json` / `yarn.lock` in pnpm repos
4. lockfile coupling
   - if `package.json` changed, require `pnpm-lock.yaml`
5. staged formatting/linting
   - via `lint-staged`

#### `commit-msg`
Must include:
- conventional commit validation via `commitlint`

#### `pre-push`
Must include:
- branch lint
- fast smoke check or equivalent cheap validation when available

### Recommended
- conditional codegen in `pre-commit`
- `post-merge` runtime refresh notification
- `post-checkout` runtime refresh notification

### Not required
- full test suite
- full typecheck for very large monorepos unless it is reliably fast

## 2. Node.js + Express repos

Use the JavaScript baseline, plus:

### Recommended additions

#### `pre-commit`
- conditional Swagger/OpenAPI generation when controllers, routes, or API entrypoints change
- conditional JSDoc generation when applicable

#### `pre-push`
- a route-level or server-start smoke check if it is fast and reliable

### Why
Express backends are especially prone to drift in generated API artifacts and lockfile state.

## 3. Nx React monorepos

Use the JavaScript baseline, but optimize for monorepo scale.

### Required

#### `pre-commit`
- runtime/tooling check
- staged secret scan
- package-manager drift checks
- staged formatting/linting only

#### `commit-msg`
- `commitlint`

#### `pre-push`
- branch lint
- an affected-only smoke check if one exists and is reliably fast

### Recommended
- prefer affected-file or affected-project logic
- avoid repo-wide lint/test/typecheck in hooks

### Why
Large workspaces drift fast if hooks are weak, but developers will bypass hooks that try to run the whole monorepo.

## 4. Python repos

### Required

#### `pre-commit`
Must include:
1. Husky entrypoint
2. file hygiene checks
   - trailing whitespace
   - EOF fixer
   - merge conflict markers
3. `ruff check`
4. `ruff format --check` or `ruff-format`
5. optional staged secret scan if the repo has a standard scanner

#### `commit-msg`
Must include:
- `commitlint --edit "$1"`

#### `pre-push`
Must include:
- branch lint
- fast targeted `pytest` scope if the repo has a stable smoke suite

### Recommended
- use the `pre-commit` framework behind Husky for Python repos
- block large accidental file additions where relevant
- add notebook or generated-output hygiene where notebook usage is common

### Why
Python repos drift through formatting, lint, notebook noise, and inconsistent local environments more than through lockfile issues.

## 5. Misc repos

Apply the lightest viable baseline.

### Required
- `commit-msg` with conventional commit validation where feasible
- `pre-push` branch lint
- one cheap `pre-commit` check appropriate to the repo, usually formatting or file hygiene

### Why
Misc repos still need drift control, but the standard should not overwhelm low-complexity projects.

## Mandatory anti-drift checks

These are the checks FarMart should standardize most aggressively.

### Tier 1: strongly recommended everywhere relevant
- commit message lint
- branch lint
- staged secret scan
- formatting/lint on changed files

### Tier 2: mandatory where applicable
- runtime/tooling check in JavaScript repos
- lockfile coupling in JavaScript repos
- forbidden lockfile detection in pnpm repos
- conditional codegen in repos with generated API/docs artifacts
- fast smoke check in `pre-push`

### Tier 3: optional repo-maintenance helpers
- post-merge notification
- post-checkout notification

## What should not be standardized as mandatory

Do not make these mandatory across all repos:
- full unit test suite on `pre-commit`
- full integration or e2e suite on `pre-push`
- repo-wide typecheck for large monorepos
- any hook that depends on AWS, GitHub, or network auth
- any hook that rewrites large generated outputs on every commit

## Reference baseline scripts

### JavaScript baseline
- `pre-commit`: runtime check + secret scan + lockfile drift checks + `lint-staged`
- `commit-msg`: `commitlint --edit "$1"`
- `pre-push`: branch lint + `check:smoke`

### Python baseline
- `pre-commit`: Husky entrypoint calling `pre-commit` with `ruff` and hygiene hooks
- `commit-msg`: `commitlint --edit "$1"`
- `pre-push`: Husky entrypoint for branch lint + targeted `pytest`

## Rollout advice

If standardizing existing repos, roll out in this order:
1. `commit-msg`
2. branch lint in `pre-push`
3. staged formatting/linting
4. secret scan
5. package-manager drift checks
6. conditional codegen
7. optional runtime refresh notifications

This order gives the most consistency with the least friction.

---

**Version**: 1.3.0
**Last Updated**: 2026-04-22
