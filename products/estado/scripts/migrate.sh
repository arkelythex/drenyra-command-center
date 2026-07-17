#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/civictech}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to run migrations" >&2
  exit 1
fi

mapfile -t migrations < <(find infra/migrations -maxdepth 1 -type f -name '*.sql' | sort)

for migration in "${migrations[@]}"; do
  echo "[migrate] applying $migration"
  psql "$DB_URL" -f "$migration"
done
