# Git hook repo scaffold

This document shows the **final merged layout** that a repo should have after combining:
- `shared/`
- `javascript/` or `python/`

Use this as the target structure when standardizing an existing repo.

## JavaScript / TypeScript final layout

```text
repo/
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── scripts/
│   ├── hooks/
│   │   ├── pre-commit.sh
│   │   ├── commit-msg.sh
│   │   └── pre-push.sh
│   ├── conventions/
│   │   ├── branch-lint.mjs
│   │   ├── scan-staged-secrets.sh
│   │   ├── check-forbidden-files.sh        # optional
│   │   ├── check-forbidden-patterns.mjs    # optional
│   │   ├── check-duplication.mjs           # optional
│   │   ├── check-staged-similarity.mjs     # optional
│   │   ├── check-runtime.sh
│   │   └── check-pnpm-lockfiles.sh
│   └── dev/
│       └── pre-commit-codegen.sh   # optional
├── commitlint.config.js
├── lint-staged.config.mjs
└── package.json
```

### Source mapping
- `shared/.husky/*` → `.husky/*`
- `shared/scripts/hooks/commit-msg.sh` → `scripts/hooks/commit-msg.sh`
- `shared/scripts/conventions/scan-staged-secrets.sh` → `scripts/conventions/scan-staged-secrets.sh`
- `shared/scripts/conventions/branch-lint.mjs` → `scripts/conventions/branch-lint.mjs`
- `javascript/scripts/hooks/*` → `scripts/hooks/*`
- `javascript/scripts/conventions/*` → `scripts/conventions/*`
- `javascript/commitlint.config.js` → `commitlint.config.js`
- `javascript/lint-staged.config.mjs` → `lint-staged.config.mjs`

## Pure Python final layout

```text
repo/
├── .husky/
│   ├── pre-commit
│   ├── commit-msg
│   └── pre-push
├── scripts/
│   ├── hooks/
│   │   ├── pre-commit.sh
│   │   ├── commit-msg.sh
│   │   └── pre-push.sh
│   └── conventions/
│       ├── branch-lint.mjs
│       ├── scan-staged-secrets.sh
│       ├── check-forbidden-files.sh        # optional
│       ├── check-forbidden-patterns.mjs    # optional
│       ├── check-duplication.mjs           # optional
│       ├── check-staged-similarity.mjs     # optional
│       ├── check-runtime.sh
│       ├── run-pre-commit.sh
│       └── run-smoke-tests.sh
├── .pre-commit-config.yaml
├── commitlint.config.js
├── pyproject.toml
└── package.json
```

### Source mapping
- `shared/.husky/*` → `.husky/*`
- `shared/scripts/hooks/commit-msg.sh` → `scripts/hooks/commit-msg.sh`
- `shared/scripts/conventions/scan-staged-secrets.sh` → `scripts/conventions/scan-staged-secrets.sh`
- `shared/scripts/conventions/branch-lint.mjs` → `scripts/conventions/branch-lint.mjs`
- `python/scripts/hooks/*` → `scripts/hooks/*`
- `python/scripts/conventions/*` → `scripts/conventions/*`
- `python/.pre-commit-config.yaml` → `.pre-commit-config.yaml`
- `python/commitlint.config.js` → `commitlint.config.js`
- `python/package.json` → `package.json`
- `python/pyproject.toml.snippet` → merge into `pyproject.toml`

## Standard copy order

### JavaScript / TypeScript repos
1. copy `shared/.husky/`
2. copy shared scripts into `scripts/`
3. copy JavaScript-specific scripts into `scripts/`
4. copy `commitlint.config.js` and `lint-staged.config.mjs`
5. wire `package.json`

### Pure Python repos
1. copy `shared/.husky/`
2. copy shared scripts into `scripts/`
3. copy Python-specific scripts into `scripts/`
4. copy `.pre-commit-config.yaml`, `commitlint.config.js`, and `package.json`
5. merge `pyproject.toml.snippet` into `pyproject.toml`

## Optional extra guardrails

These are good additions for mature repos:
- `check-forbidden-files.sh`
- `check-forbidden-patterns.mjs`
- `check-duplication.mjs`
- `check-staged-similarity.mjs`

Use them in `pre-push` or CI if they are too heavy for `pre-commit`.

## Verification checklist

After wiring the scaffold:
- `.husky/*` files are thin wrappers only
- real logic lives in `scripts/hooks/*` and `scripts/conventions/*`
- `commit-msg` calls commitlint
- `pre-commit` runs runtime checks + secret scan + ecosystem checks
- `pre-push` runs branch lint + fast smoke scope
- all shell scripts are executable

```bash
chmod +x .husky/* scripts/hooks/*.sh scripts/conventions/*.sh
```
