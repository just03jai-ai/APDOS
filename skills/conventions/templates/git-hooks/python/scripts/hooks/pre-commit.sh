#!/usr/bin/env sh
set -eu

./scripts/conventions/check-runtime.sh
./scripts/conventions/scan-staged-secrets.sh
./scripts/conventions/run-pre-commit.sh
