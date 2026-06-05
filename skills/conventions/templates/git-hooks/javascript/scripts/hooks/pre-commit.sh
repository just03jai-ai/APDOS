#!/usr/bin/env sh
set -eu

./scripts/conventions/check-runtime.sh
./scripts/conventions/scan-staged-secrets.sh
./scripts/conventions/check-pnpm-lockfiles.sh

corepack pnpm exec lint-staged

if [ -x ./scripts/dev/pre-commit-codegen.sh ]; then
  ./scripts/dev/pre-commit-codegen.sh
fi
