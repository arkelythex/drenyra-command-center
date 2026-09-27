#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRESH_DB_OPT_IN="${DRENYRA_FRESH_DB:-}"

if [[ -z "${DATABASE_URL:-}" && -f "${ROOT_DIR}/.env" ]]; then
  # shellcheck source=/dev/null
  set -a
  # shellcheck disable=SC1091
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
  --dialect postgresql |
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(required_object, ', ' ORDER BY required_object)
  INTO missing
  FROM (
    VALUES
      ('table:public.users'),
      ('table:public.companies'),
      ('table:public.business_partners'),
      ('table:public.invoices'),
      ('table:public.bills'),
      ('table:public.transactions'),
      ('table:public.system_checks'),
      ('table:public.check_history'),
      ('extension:vector')
  ) AS required(required_object)
  WHERE CASE
    WHEN required_object LIKE 'table:%' THEN
      to_regclass(substr(required_object, 7)) IS NULL
    ELSE NOT EXISTS (
      SELECT 1
      FROM pg_extension
      WHERE extname = substr(required_object, 11)
    )
  END;

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Current schema verification failed; missing %', missing;
  END IF;

  SELECT string_agg(required_column, ', ' ORDER BY required_column)
  INTO missing
  FROM (
    VALUES
      ('invoices.buyer_tax_id'),
      ('companies.settings_language')
  ) AS required(required_column)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = split_part(required_column, '.', 1)
      AND column_name = split_part(required_column, '.', 2)
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Current schema verification failed; missing columns %', missing;
  END IF;
END $$;
SQL

echo "[infra-db:bootstrap] Current schema bootstrap and verification completed."
