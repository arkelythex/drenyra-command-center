#!/usr/bin/env bash
set -euo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "initialize a git repository first (git init)" >&2
  exit 1
fi

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/commit-msg

echo "Git hooks installed using .githooks/"
