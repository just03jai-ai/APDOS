#!/usr/bin/env sh
set -eu

if ! git diff --cached --quiet -- package-lock.json yarn.lock; then
  echo "❌ package-lock.json and yarn.lock are not allowed in this pnpm repository."
  git diff --cached --name-only -- package-lock.json yarn.lock
  exit 1
fi

if ! git diff --cached --quiet -- package.json && git diff --cached --quiet -- pnpm-lock.yaml; then
  echo "❌ package.json is staged without pnpm-lock.yaml."
  echo "   Run corepack pnpm install and stage pnpm-lock.yaml."
  exit 1
fi
