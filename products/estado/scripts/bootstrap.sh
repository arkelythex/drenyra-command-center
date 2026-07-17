#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env && -f .env.example ]]; then
  cp .env.example .env
  echo "[bootstrap] created .env from .env.example"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[bootstrap] docker is required" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "[bootstrap] psql is required" >&2
  exit 1
fi

echo "[bootstrap] starting local infra"
docker compose -f infra/docker-compose.yml up -d

echo "[bootstrap] waiting for postgres"
until PGPASSWORD=postgres psql -h localhost -U postgres -d civictech -c "select 1" >/dev/null 2>&1; do
  sleep 2
done

echo "[bootstrap] waiting for keycloak realm"
bash ./scripts/keycloak/wait-ready.sh 180

echo "[bootstrap] running migrations"
bash ./scripts/migrate.sh

if command -v pnpm >/dev/null 2>&1; then
  echo "[bootstrap] installing pnpm dependencies"
  pnpm install --no-frozen-lockfile
else
  echo "[bootstrap] pnpm not found (skipping JS dependency install)"
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[bootstrap] installing git hooks"
  bash ./scripts/setup-githooks.sh || true
fi

echo "[bootstrap] done"
echo "Next:"
echo "  1) pnpm api:dev"
echo "  2) pnpm dev"
echo "  3) pnpm smoke:e2e"
echo "  4) (optional) AUTH_MODE=oidc + pnpm smoke:rbac"
