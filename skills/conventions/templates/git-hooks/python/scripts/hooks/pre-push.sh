#!/usr/bin/env sh
set -eu

while read local_ref local_sha remote_ref remote_sha; do
  node ./scripts/conventions/branch-lint.mjs --local-ref "$local_ref"
done

./scripts/conventions/run-smoke-tests.sh
