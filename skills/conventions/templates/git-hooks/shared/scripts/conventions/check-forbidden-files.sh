#!/usr/bin/env sh
set -eu

STAGED=$(git diff --cached --name-only)

if [ -z "$STAGED" ]; then
  exit 0
fi

if printf '%s
' "$STAGED" | grep -E -q '(^|/)\.env$|(^|/)\.env\.local$|(^|/)id_rsa$|\.pem$|\.key$|\.p12$|\.pfx$|(^|/)credentials\.json$'; then
  echo "❌ Forbidden sensitive file detected in staged changes."
  echo "   Do not commit raw env files, local overrides, or private key material."
  printf '%s
' "$STAGED" | grep -E '(^|/)\.env$|(^|/)\.env\.local$|(^|/)id_rsa$|\.pem$|\.key$|\.p12$|\.pfx$|(^|/)credentials\.json$' || true
  exit 1
fi
