# JavaScript repo hook setup

This template pack shows the standard FarMart hook setup for JavaScript and TypeScript repos.

## Design

The preferred pattern is:
- shared `.husky/*` wrappers from `../shared/`
- shared convention scripts from `../shared/scripts/conventions/`
- repo-specific hook orchestration in `scripts/hooks/`
- repo-specific enforcement logic in `scripts/conventions/`
- optional repo-specific helpers in `scripts/dev/`

## Files in this pack

### Shared assets to copy first
- [`../shared/.husky/pre-commit`](../shared/.husky/pre-commit)
- [`../shared/.husky/commit-msg`](../shared/.husky/commit-msg)
- [`../shared/.husky/pre-push`](../shared/.husky/pre-push)
- [`../shared/scripts/hooks/commit-msg.sh`](../shared/scripts/hooks/commit-msg.sh)
- [`../shared/scripts/conventions/scan-staged-secrets.sh`](../shared/scripts/conventions/scan-staged-secrets.sh)
- [`../shared/scripts/conventions/branch-lint.mjs`](../shared/scripts/conventions/branch-lint.mjs)

### JS-specific config
- [`commitlint.config.js`](./commitlint.config.js)
- [`lint-staged.config.mjs`](./lint-staged.config.mjs)

### JS-specific hook scripts
- [`scripts/hooks/pre-commit.sh`](./scripts/hooks/pre-commit.sh)
- [`scripts/hooks/pre-push.sh`](./scripts/hooks/pre-push.sh)

### JS-specific convention scripts
- [`scripts/conventions/check-runtime.sh`](./scripts/conventions/check-runtime.sh)
- [`scripts/conventions/check-pnpm-lockfiles.sh`](./scripts/conventions/check-pnpm-lockfiles.sh)

### Optional shared guardrail scripts to copy
- [`../shared/scripts/conventions/check-forbidden-files.sh`](../shared/scripts/conventions/check-forbidden-files.sh)
- [`../shared/scripts/conventions/check-forbidden-patterns.mjs`](../shared/scripts/conventions/check-forbidden-patterns.mjs)
- [`../shared/scripts/conventions/check-duplication.mjs`](../shared/scripts/conventions/check-duplication.mjs)
- [`../shared/scripts/conventions/check-staged-similarity.mjs`](../shared/scripts/conventions/check-staged-similarity.mjs)
- [`../shared/scripts/conventions/suggest-staged-style-drift.mjs`](../shared/scripts/conventions/suggest-staged-style-drift.mjs)

## What this gives you

### `pre-commit`
- runtime/tooling sanity check
- staged secret scan
- pnpm lockfile drift protection
- staged formatting and linting
- optional codegen hook point

### `commit-msg`
- conventional commit validation

### `pre-push`
- branch naming validation
- smoke-check hook point

## Suggested repo wiring

### `package.json`
Add or confirm these scripts exist:

```json
{
  "scripts": {
    "prepare": "husky install",
    "check:runtime": "node ./scripts/dev/check-runtime.js",
    "check:smoke": "pnpm test -- --runInBand",
    "check:security": "./scripts/conventions/check-forbidden-files.sh && node ./scripts/conventions/check-forbidden-patterns.mjs && ./scripts/conventions/scan-staged-secrets.sh",
    "check:duplication": "node ./scripts/conventions/check-duplication.mjs",
    "check:similarity": "node ./scripts/conventions/check-staged-similarity.mjs",
    "check:guardrails": "pnpm run check:security && pnpm run check:duplication && pnpm run check:similarity",
    "suggest:style-drift": "node ./scripts/conventions/suggest-staged-style-drift.mjs"
  }
}
```

Adjust `check:smoke` to match the repo's real fast smoke command.

## Setup

1. Copy `../shared/` into the repo root first, then merge in the JavaScript-specific `scripts/`, `commitlint.config.js`, and `lint-staged.config.mjs` files.
2. Ensure `package.json` includes `husky`, `lint-staged`, and `@commitlint/config-conventional`.
3. Run:

```bash
corepack enable
pnpm install
pnpm run prepare
chmod +x .husky/* scripts/hooks/*.sh scripts/conventions/*.sh
```

## Notes

- Keep the real logic in `scripts/`, not in `.husky/*`.
- If the repo needs generated artifacts, wire that into `scripts/dev/pre-commit-codegen.sh`.
- If the repo uses npm instead of pnpm during migration, adapt the scripts but keep the structure.
- `check:duplication` and `check:similarity` are usually better in `pre-push` or CI than in `pre-commit`.
