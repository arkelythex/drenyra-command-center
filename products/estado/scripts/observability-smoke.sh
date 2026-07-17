#!/usr/bin/env bash
set -euo pipefail

PROM_URL="${PROM_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3001}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

bash ./scripts/wait-for-http.sh "$PROM_URL/-/ready" 200 120 "Prometheus"
bash ./scripts/wait-for-http.sh "$GRAFANA_URL/api/health" 200 120 "\"database\":\"ok\""

query='sum(civictech_http_requests_total)'
result="$(curl -sS --get --data-urlencode "query=$query" "$PROM_URL/api/v1/query")"

if command -v jq >/dev/null 2>&1; then
  status="$(echo "$result" | jq -r '.status')"
  if [[ "$status" != "success" ]]; then
    echo "prometheus query failed: $result" >&2
    exit 1
  fi
else
  if ! echo "$result" | grep -q '"status":"success"'; then
    echo "prometheus query failed: $result" >&2
    exit 1
  fi
fi

domain_query='sum(civictech_report_transition_total)'
domain_result="$(curl -sS --get --data-urlencode "query=$domain_query" "$PROM_URL/api/v1/query")"

if command -v jq >/dev/null 2>&1; then
  domain_status="$(echo "$domain_result" | jq -r '.status')"
  if [[ "$domain_status" != "success" ]]; then
    echo "prometheus domain query failed: $domain_result" >&2
    exit 1
  fi
else
  if ! echo "$domain_result" | grep -q '"status":"success"'; then
    echo "prometheus domain query failed: $domain_result" >&2
    exit 1
  fi
fi

echo "[obs-smoke] prometheus and grafana are healthy"
