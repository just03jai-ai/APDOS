# Python repo hook setup

This template pack shows the standard FarMart hook setup for a pure Python repo while keeping **Husky** as the common hook runner.

## Files in this pack

### Shared assets to copy first
- [`package.json`](./package.json)
  - minimal Node tooling layer for Husky + commitlint
- [`../shared/.husky/pre-commit`](../shared/.husky/pre-commit)
- [`../shared/.husky/commit-msg`](../shared/.husky/commit-msg)
- [`../shared/.husky/pre-push`](../shared/.husky/pre-push)
- [`../shared/scripts/hooks/commit-msg.sh`](../shared/scripts/hooks/commit-msg.sh)
- [`../shared/scripts/conventions/scan-staged-secrets.sh`](../shared/scripts/conventions/scan-staged-secrets.sh)
- [`../shared/scripts/conventions/branch-lint.mjs`](../shared/scripts/conventions/branch-lint.mjs)

### Python-specific hook scripts
- [`scripts/hooks/pre-commit.sh`](./scripts/hooks/pre-commit.sh)
- [`scripts/hooks/pre-push.sh`](./scripts/hooks/pre-push.sh)

### Python-specific convention scripts
- [`scripts/conventions/check-runtime.sh`](./scripts/conventions/check-runtime.sh)
- [`scripts/conventions/run-pre-commit.sh`](./scripts/conventions/run-pre-commit.sh)
- [`scripts/conventions/run-smoke-tests.sh`](./scripts/conventions/run-smoke-tests.sh)

### Optional shared guardrail scripts to copy
- [`../shared/scripts/conventions/check-forbidden-files.sh`](../shared/scripts/conventions/check-forbidden-files.sh)
- [`../shared/scripts/conventions/check-forbidden-patterns.mjs`](../shared/scripts/conventions/check-forbidden-patterns.mjs)
- [`../shared/scripts/conventions/check-duplication.mjs`](../shared/scripts/conventions/check-duplication.mjs)
- [`../shared/scripts/conventions/check-staged-similarity.mjs`](../shared/scripts/conventions/check-staged-similarity.mjs)
- [`../shared/scripts/conventions/suggest-staged-style-drift.mjs`](../shared/scripts/conventions/suggest-staged-style-drift.mjs)

### Config files
- [`.pre-commit-config.yaml`](./.pre-commit-config.yaml)
  - file hygiene + Ruff hooks
- [`commitlint.config.js`](./commitlint.config.js)
  - commitlint baseline
- [`pyproject.toml.snippet`](./pyproject.toml.snippet)
  - suggested Python tooling config additions

## Why this exists

The FarMart standard is:
- Husky is the hook runner
- hooks stay minimal
- real logic lives in `scripts/hooks/` and `scripts/conventions/`
- Python tools still do Python-native work
- local hook behavior should feel consistent across JS and Python repos

That means pure Python repos get a tiny Node layer only for:
- Husky
- commitlint

Everything else stays Python-native.

## Setup steps

### 1. Add the minimal Node tooling layer

Copy `package.json` and `commitlint.config.js` into the repo root.

Install dependencies:

```bash
corepack enable
pnpm install
```

### 2. Add shared Husky assets

Copy `../shared/` into the repo root.

Then merge in the Python-specific `scripts/` folder.

Then run:

```bash
pnpm run prepare
chmod +x .husky/* scripts/hooks/*.sh scripts/conventions/*.sh
```

### 3. Add Python hook config

Copy `.pre-commit-config.yaml` into the repo root.

Install Python hook tooling in your Python environment:

```bash
uv add --dev pre-commit ruff pytest
```

If the repo does not use `uv`, install the equivalent with your Python environment manager.

### 4. Merge the `pyproject.toml` snippet

Use [`pyproject.toml.snippet`](./pyproject.toml.snippet) as a starter for:
- Ruff lint config
- Ruff format config
- pytest defaults

### 5. Install and verify hooks

```bash
pnpm run prepare
uv run pre-commit run --all-files
```

Then test:

```bash
git commit --allow-empty -m "chore: verify husky hooks"
```

## Expected behavior

### `pre-commit`
- validates Python runtime when `.python-version` exists
- runs a staged secret scan
- runs file hygiene checks
- runs `ruff check`
- runs `ruff format`
- fails fast on local issues before commit completes

### `commit-msg`
- enforces conventional commits

### `pre-push`
- optionally validates branch naming using the shared Node script
- optionally runs a smoke test scope like `tests/smoke`

## Notes

- Keep `pre-push` fast; do not run the full test suite there.
- If the repo has no smoke tests yet, keep the hook point but skip the command until the suite exists.
- If you need repo-specific branch rules, edit the shared `scripts/conventions/branch-lint.mjs` after copying it into the repo.
- If the repo uses notebooks heavily, add notebook output hygiene to `.pre-commit-config.yaml`.
- `check-duplication` and `check:similarity` are usually better in `pre-push` or CI than in `pre-commit`.
