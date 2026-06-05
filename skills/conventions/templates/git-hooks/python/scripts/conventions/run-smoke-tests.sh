#!/usr/bin/env sh
set -eu

if [ ! -d tests/smoke ]; then
  exit 0
fi

if command -v uv >/dev/null 2>&1; then
  uv run pytest -q tests/smoke
else
  pytest -q tests/smoke
fi
