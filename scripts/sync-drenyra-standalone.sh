#!/usr/bin/env bash
# Sync canonical Drenyra artifacts from arkelythex to standalone Drenyra repo.
# Usage:
#   ./scripts/sync-drenyra-standalone.sh           # dry-run
#   ./scripts/sync-drenyra-standalone.sh --apply   # copy files
#   ./scripts/sync-drenyra-standalone.sh --check   # exit 1 on drift

set -euo pipefail

ARKELYTHEX_ROOT="${ARKELYTHEX_ROOT:-$HOME/Documents/PROYECTOS/arkelythex}"
DRENYRA_ROOT="${DRENYRA_STANDALONE_ROOT:-$HOME/Documents/PROYECTOS/Drenyra}"

MODE="dry-run"
if [[ "${1:-}" == "--apply" ]]; then
  MODE="apply"
elif [[ "${1:-}" == "--check" ]]; then
  MODE="check"
fi

if [[ ! -d "$ARKELYTHEX_ROOT" ]]; then
  echo "error: ARKELYTHEX_ROOT not found: $ARKELYTHEX_ROOT" >&2
  exit 1
fi

if [[ ! -d "$DRENYRA_ROOT" ]]; then
  echo "error: DRENYRA_STANDALONE_ROOT not found: $DRENYRA_ROOT" >&2
  exit 1
fi

SYNC_PATHS=(
  "docs/01-architecture/drenyra-fiscal-app-server-2026.md"
  "docs/01-architecture/drenyra-dual-surface-brain.md"
  "docs/01-architecture/drenyra-command-envelope-2026.md"
  "docs/01-architecture/drenyra-agent-capability-matrix-2026.md"
  "docs/01-architecture/fiscal-intelligence-platform-architecture-2026.md"
  "docs/02-adr/adr-033-drenyra-fiscal-app-server.md"
  "docs/05-development/drenyra-repo-sync.md"
  "docs/superpowers/specs/drenyra-fiscal-app-server-tasks-2026.md"
  "scripts/sync-drenyra-standalone.sh"
  "packages/domain/src/drenyra/dfas-protocol-types.ts"
  "packages/domain/src/drenyra/dfas-item-stream.ts"
  "packages/domain/src/drenyra/guardian-policies.ts"
  "packages/domain/src/drenyra/skills-types.ts"
  "packages/domain/src/drenyra/index.ts"
  "packages/domain/src/drenyra/__tests__/dfas-protocol-types.test.ts"
  "packages/domain/src/drenyra/__tests__/dfas-item-stream.test.ts"
  "packages/domain/src/drenyra/__tests__/guardian-policies.test.ts"
  "packages/domain/src/drenyra/__tests__/skills-types.test.ts"
  "apps/api/src/features/drenyra/kernel/README.md"
)

DRIFT=0

sync_file() {
  local rel="$1"
  local src="$ARKELYTHEX_ROOT/$rel"
  local dst="$DRENYRA_ROOT/$rel"

  if [[ ! -f "$src" ]]; then
    echo "skip (missing canonical): $rel"
    return
  fi

  mkdir -p "$(dirname "$dst")"

  if [[ -f "$dst" ]] && cmp -s "$src" "$dst"; then
    echo "ok: $rel"
    return
  fi

  if [[ -f "$dst" ]]; then
    echo "drift: $rel"
    DRIFT=1
  else
    echo "missing in standalone: $rel"
    DRIFT=1
  fi

  if [[ "$MODE" == "apply" ]]; then
    cp "$src" "$dst"
    echo "  -> copied"
  fi
}

echo "Drenyra sync ($MODE)"
echo "  from: $ARKELYTHEX_ROOT"
echo "  to:   $DRENYRA_ROOT"
echo

for rel in "${SYNC_PATHS[@]}"; do
  sync_file "$rel"
done

if [[ "$MODE" == "check" && "$DRIFT" -eq 1 ]]; then
  echo
  echo "Drift detected. Run with --apply to sync." >&2
  exit 1
fi

if [[ "$MODE" == "apply" ]]; then
  echo
  echo "Sync complete. Run contract tests in both repos:"
  echo "  cd $DRENYRA_ROOT/packages/domain && bun run test -- src/drenyra/__tests__/dfas-*.test.ts"
fi
