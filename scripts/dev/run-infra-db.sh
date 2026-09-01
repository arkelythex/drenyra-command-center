#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

usage() {
  echo "Usage: $0 {db:push|db:check|db:generate|db:migrate|db:studio} [args...]" >&2
}

command_name="${1:-}"
case "${command_name}" in
  db:push | db:check | db:generate | db:migrate | db:studio) ;;
  *)
    usage
    exit 2
    ;;
esac
shift

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT_DIR}/.env" ]]; then
  # shellcheck source=/dev/null
  set -a
  source "${ROOT_DIR}/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" || "${DATABASE_URL}" == *'$'* ]]; then
  echo "[infra-db] DATABASE_URL must be set to a non-placeholder URL." >&2
  exit 1
fi

cd "${ROOT_DIR}/packages/infrastructure"
exec bun run "${command_name}" "$@"
