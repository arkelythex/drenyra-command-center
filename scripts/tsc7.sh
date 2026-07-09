#!/usr/bin/env bash
set -euo pipefail

# TypeScript wrapper — runs tsc from the project's typescript installation.
# Use this in package.json scripts for consistent tsc invocation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec "${SCRIPT_DIR}/node_modules/.bin/tsc" "$@"
