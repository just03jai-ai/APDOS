#!/usr/bin/env sh
set -eu

TMP_FILE=$(mktemp)
trap 'rm -f "$TMP_FILE"' EXIT HUP INT TERM

git diff --cached --unified=0 --no-color > "$TMP_FILE"

if grep -E -i -q '(aws_secret_access_key|api[_-]?key\s*[:=]|private[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|ghp_[A-Za-z0-9]+)' "$TMP_FILE"; then
  echo "❌ Potential secret detected in staged changes."
  echo "   Review staged diff and remove sensitive values before committing."
  exit 1
fi
