# Shared git hook assets

These files are shared across JavaScript and Python hook setups to avoid duplication.

## Shared assets

### Husky stubs
- [`.husky/pre-commit`](./.husky/pre-commit)
- [`.husky/commit-msg`](./.husky/commit-msg)
- [`.husky/pre-push`](./.husky/pre-push)

### Shared hook scripts
- [`scripts/hooks/commit-msg.sh`](./scripts/hooks/commit-msg.sh)

### Shared convention scripts
- [`scripts/conventions/scan-staged-secrets.sh`](./scripts/conventions/scan-staged-secrets.sh)
- [`scripts/conventions/check-forbidden-files.sh`](./scripts/conventions/check-forbidden-files.sh)
- [`scripts/conventions/check-forbidden-patterns.mjs`](./scripts/conventions/check-forbidden-patterns.mjs)
- [`scripts/conventions/check-duplication.mjs`](./scripts/conventions/check-duplication.mjs)
- [`scripts/conventions/check-staged-similarity.mjs`](./scripts/conventions/check-staged-similarity.mjs)
- [`scripts/conventions/suggest-staged-style-drift.mjs`](./scripts/conventions/suggest-staged-style-drift.mjs)
- [`scripts/conventions/branch-lint.mjs`](./scripts/conventions/branch-lint.mjs)

## Usage

Copy the shared assets first, then copy the repo-type-specific assets:
- `javascript/` for JS/TS repos
- `python/` for pure Python repos

The folders are designed to merge cleanly into one repo-level structure.

## Suggested usage

- `scan-staged-secrets.sh` and `check-forbidden-files.sh` are good `pre-commit` guardrails.
- `check-forbidden-patterns.mjs` is a good `pre-commit` or `pre-push` guardrail.
- `check-duplication.mjs` and `check-staged-similarity.mjs` are better in `pre-push` or CI than in `pre-commit`.
- `check-staged-similarity.mjs` uses token-based winnowing fingerprints with containment scoring, which is stronger than raw Jaccard alone for code clones.
- `suggest-staged-style-drift.mjs` is intentionally non-blocking and is best used in `pre-push` or CI comments.
- `suggest-staged-style-drift.mjs` prefers nearby reference files from the same directory or module subtree so reviewer hints stay locally relevant.
