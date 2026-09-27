#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"

cd -- "${REPO_ROOT}"

# This command is intentionally narrow: it is the core maintainability gate.
# Fiscal and compliance checks remain separate commands with separate contracts.
printf '%s\n' 'quality:core: running the narrow core maintainability gate (quality:max-lines)'
printf '%s\n' 'quality:core: this is not a fiscal or compliance gate'

exec bun run quality:max-lines
