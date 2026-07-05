#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

if [[ ! -f .env ]]; then
  echo "[dev] Missing .env — copying from .env.example"
  cp .env.example .env
fi

# shellcheck source=/dev/null
set -a
source .env
set +a

export WEB_PORT="${WEB_PORT:-5174}"
export WEB_HOST="${WEB_HOST:-localhost}"

COMPOSE_CMD=(docker compose)
REQUIRED_SERVICES=(
  "postgres:drenyra-db"
  "drenyra-engram:drenyra-engram"
)

ensure_service() {
  local svc="$1" container="$2"

  if docker container inspect "${container}" &>/dev/null; then
    if [[ "$(docker container inspect -f '{{.State.Running}}' "${container}")" != "true" ]]; then
      echo "[dev] Starting ${container}..."
      if ! docker start "${container}" &>/dev/null; then
        echo "[dev] Recreating ${container}..."
        docker rm -f "${container}" &>/dev/null || true
        "${COMPOSE_CMD[@]}" up -d "${svc}"
      fi
    fi
  else
    echo "[dev] Creating ${container}..."
    "${COMPOSE_CMD[@]}" up -d "${svc}"
  fi
}

if command -v docker &>/dev/null; then
  "${COMPOSE_CMD[@]}" start 2>/dev/null || true

  for entry in "${REQUIRED_SERVICES[@]}"; do
    svc="${entry%%:*}"
    container="${entry##*:}"
    ensure_service "${svc}" "${container}"
  done

  echo "[dev] Waiting for PostgreSQL..."
  for i in $(seq 1 30); do
    if docker exec drenyra-db pg_isready -U user -d drenyra &>/dev/null; then
      echo "[dev] PostgreSQL ready"
      break
    fi
    if [[ $i -eq 30 ]]; then
      echo "[dev] WARNING: PostgreSQL not ready after 30s — API may fail"
    fi
    sleep 1
  done

  if docker exec drenyra-db psql -U user -d drenyra -c "SELECT 1 FROM pg_tables WHERE tablename='__drizzle_migrations'" 2>/dev/null | grep -q "1"; then
    echo "[dev] Migrations table exists — skipping push"
  else
    echo "[dev] Applying database schema..."
    if (
      cd packages/infrastructure &&
        DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5436/drenyra}" bun run db:push
    ); then
      echo "[dev] Schema applied"
    else
      echo "[dev] WARNING: Schema push failed (try: bun run db:push)"
    fi
  fi
else
  echo "[dev] WARNING: Docker not found — ensure PostgreSQL (:5436) and Engram (:8733) are reachable"
fi

declare -a PIDS=()

cleanup() {
  local exit_code=$?
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "${pid}" &>/dev/null; then
      kill "${pid}" &>/dev/null || true
    fi
  done
  wait "${PIDS[@]:-}" 2>/dev/null || true
  exit "${exit_code}"
}

trap cleanup EXIT INT TERM

echo "[dev] Starting Drenyra host stack (API + Web)"
echo "[dev] API:    http://localhost:${PORT:-3000}"
echo "[dev] Web:    http://${WEB_HOST}:${WEB_PORT}"
echo "[dev] Engram: http://localhost:8733"

bun run --filter @drenyra/api dev &
PIDS+=($!)

WEB_PORT="${WEB_PORT}" bun run --filter @drenyra/web dev &
PIDS+=($!)

wait -n "${PIDS[@]}"
