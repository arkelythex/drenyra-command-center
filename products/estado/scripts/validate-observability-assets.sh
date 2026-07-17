#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 1
  fi
}

require_cmd docker
require_cmd jq

echo "[obs-validate] checking dashboard JSON"
for dashboard in infra/dashboards/*.json; do
  jq -e . "$dashboard" >/dev/null
done

echo "[obs-validate] checking prometheus config"
docker run --rm \
  --entrypoint promtool \
  -v "$ROOT_DIR/infra:/infra:ro" \
  -v "$ROOT_DIR/infra/alerts:/etc/prometheus/alerts:ro" \
  prom/prometheus:v2.54.1 \
  check config /infra/prometheus/prometheus.yml

echo "[obs-validate] checking prometheus alert rules"
docker run --rm \
  --entrypoint promtool \
  -v "$ROOT_DIR/infra:/infra:ro" \
  prom/prometheus:v2.54.1 \
  check rules /infra/alerts/prometheus-rules.yml

echo "[obs-validate] done"
