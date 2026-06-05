#!/usr/bin/env sh
set -eu

EXPECTED=""
if [ -f .python-version ]; then
  EXPECTED=$(tr -d '[:space:]' < .python-version)
fi

if [ -z "$EXPECTED" ]; then
  exit 0
fi

if command -v uv >/dev/null 2>&1; then
  ACTUAL=$(uv run python -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
else
  ACTUAL=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
fi

case "$ACTUAL" in
  "$EXPECTED"* ) exit 0 ;;
  * )
    echo "❌ Python runtime mismatch."
    echo "   Expected: $EXPECTED"
    echo "   Actual:   $ACTUAL"
    exit 1
    ;;
esac
