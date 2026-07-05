#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

# Product-focused infra: PostgreSQL + Drenyra Engram evidence sidecar.
SERVICES=(postgres drenyra-engram)
COMPOSE_CMD=(docker compose)
STALE_CONTAINERS=(drenyra-db drenyra-engram)

if ! command -v docker >/dev/null 2>&1; then
  echo "[dev:stack] Missing dependency: docker" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "[dev:stack] .env not found. Creating from .env.example"
  cp .env.example .env
fi

for container in "${STALE_CONTAINERS[@]}"; do
  if docker container inspect "${container}" >/dev/null 2>&1; then
    running="$(docker container inspect -f '{{.State.Running}}' "${container}" 2>/dev/null || echo false)"
    if [[ "${running}" != "true" ]]; then
      echo "[dev:stack] Removing stale container: ${container}"
      docker rm -f "${container}" >/dev/null || true
    fi
  fi
done

echo "[dev:stack] Starting product infra: ${SERVICES[*]}"
"${COMPOSE_CMD[@]}" up -d --build "${SERVICES[@]}"

echo "[dev:stack] Waiting for PostgreSQL..."
for i in $(seq 1 30); do
  if docker exec drenyra-db pg_isready -U user -d drenyra &>/dev/null; then
    echo "[dev:stack] PostgreSQL ready"
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "[dev:stack] WARNING: PostgreSQL not ready after 30s"
  fi
  sleep 1
done

echo "[dev:stack] Running infra health checks"
CHECK_API=0 INCLUDE_WEB=0 bun run dev:check

echo "[dev:stack] Product infra is ready"
echo "[dev:stack] Next: bun run db:push && bun run dev   (or dev:api + dev:web in separate terminals)"
