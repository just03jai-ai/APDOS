#!/usr/bin/env sh
set -eu

if command -v uv >/dev/null 2>&1; then
  uv run pre-commit run --hook-stage pre-commit
else
  pre-commit run --hook-stage pre-commit
fi
