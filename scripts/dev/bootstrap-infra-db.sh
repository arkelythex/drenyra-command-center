#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRESH_DB_OPT_IN="${DRENYRA_FRESH_DB:-}"

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT_DIR}/.env" ]]; then
  # shellcheck source=/dev/null
  set -a
  source "${ROOT_DIR}/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" || "${DATABASE_URL}" == *'$'* ]]; then
  echo "[infra-db:bootstrap] DATABASE_URL must be set to a non-placeholder URL." >&2
  exit 1
fi

if [[ "${FRESH_DB_OPT_IN}" != "1" ]]; then
  echo "[infra-db:bootstrap] Refusing to bootstrap without DRENYRA_FRESH_DB=1." >&2
  exit 1
fi

case "${DATABASE_URL}" in
  postgres://* | postgresql://*) ;;
  *)
    echo "[infra-db:bootstrap] DATABASE_URL must use the postgres or postgresql scheme." >&2
    exit 1
    ;;
esac

authority_and_path="${DATABASE_URL#*://}"
if [[ "${authority_and_path}" != */* ]]; then
  echo "[infra-db:bootstrap] DATABASE_URL must include a database name." >&2
  exit 1
fi

authority="${authority_and_path%%/*}"
host_port="${authority##*@}"
host="${host_port%%:*}"
if [[ -z "${host}" || "${host_port}" == *:*:* ]]; then
  echo "[infra-db:bootstrap] DATABASE_URL has an invalid host." >&2
  exit 1
fi

host="${host,,}"
if [[ "${host}" != "localhost" && "${host}" != "127.0.0.1" ]]; then
  echo "[infra-db:bootstrap] Only localhost or 127.0.0.1 databases may be bootstrapped." >&2
  exit 1
fi

database_name="${authority_and_path#*/}"
database_name="${database_name%%\?*}"
database_name="${database_name%%#*}"
if [[ -z "${database_name}" || "${database_name}" == */* || "${database_name}" == *%* ]]; then
  echo "[infra-db:bootstrap] DATABASE_URL has an invalid database name." >&2
  exit 1
fi

lower_database_name="${database_name,,}"
if [[ "${lower_database_name}" == *prod* || "${lower_database_name}" == *production* ]]; then
  echo "[infra-db:bootstrap] Refusing to bootstrap a database whose name contains prod or production." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[infra-db:bootstrap] Missing dependency: psql" >&2
  exit 1
fi

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 \
  -c 'CREATE EXTENSION IF NOT EXISTS vector;' \
  >/dev/null

cd "${ROOT_DIR}/packages/infrastructure"
bunx --no-install drizzle-kit export --sql \
  --schema "${ROOT_DIR}/packages/persistence/src/schema/index.ts" \
  --dialect postgresql \
  | psql "${DATABASE_URL}" -v ON_ERROR_STOP=1
