#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/civictech}"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to load seed data" >&2
  exit 1
fi

psql "$DB_URL" -f infra/seeds/001_demo.sql

echo "seed data loaded"
