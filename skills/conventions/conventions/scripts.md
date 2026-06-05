# Scripts

Prefer a common script surface so humans and AI can move between repos without guesswork.

## Two layers of scripts

FarMart repos should distinguish between:

### 1. Task commands
These are the commands developers run directly, usually from `package.json`, `Makefile`, or equivalent:
- `pnpm run dev`
- `pnpm run stage`
- `pnpm run prod`
- `pnpm run test`
- `pnpm run lint`
- `pnpm run format`
- `pnpm run check`

### 2. Repo scripts in `scripts/`
These are implementation details that keep repo behavior maintainable and reusable.

**Hooks should stay thin.**
The actual logic should live in the repo's `scripts/` directory, and hooks should mostly call those scripts.

## Standard `scripts/` structure

Prefer this structure:

```text
scripts/
  hooks/
    pre-commit.sh
    commit-msg.sh
    pre-push.sh
  conventions/
    branch-lint.js
    check-runtime.sh
    check-pnpm-lockfiles.sh
    scan-staged-secrets.sh
  dev/
    pre-commit-codegen.sh
    notify-runtime-refresh.sh
```

Not every repo needs every file, but this is the preferred layout.

## Standard JavaScript task commands

- `pnpm run dev`
- `pnpm run stage`
- `pnpm run prod`
- `pnpm run test`
- `pnpm run lint`
- `pnpm run format`
- `pnpm run check`

## Meaning

- `dev`: local development using `APP_ENV=dev`
- `stage`: local run or validation against stage-like config using `APP_ENV=stage`
- `prod`: local prod-like run using `APP_ENV=prod`
- `check`: lightweight repo health command; ideally format/lint/test/typecheck aggregation

## Rules

- Script names should be consistent even if the underlying implementation differs by repo type.
- Avoid bespoke names when a standard name will do.
- Add repo-specific scripts in addition to, not instead of, the standard verbs.
- Keep hook logic out of `.husky/*` files whenever possible.
- Put reusable validation logic in `scripts/conventions/`.
- Put hook orchestration in `scripts/hooks/`.

## Why hooks should call scripts

Thin hooks are easier to:
- review
- reuse across repos
- test manually
- update without editing hook stubs
- keep consistent between JavaScript and Python repos

### Preferred pattern

```sh
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

exec ./scripts/hooks/pre-commit.sh "$@"
```

## Do

- preserve legacy aliases temporarily when migrating
- keep script behavior obvious and documented
- make `check` cheap enough to run often
- prefer `scripts/hooks/` + `scripts/conventions/` over inline hook logic

## Don’t

- replace standard verbs with one-off names for common tasks
- make `dev`, `stage`, and `prod` mean different things in each repo without documenting it
- duplicate large shell blocks across `.husky/*` files

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
