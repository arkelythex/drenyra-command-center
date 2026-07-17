#!/usr/bin/env bash
# Test script for Arkelythex API monitoring.
# Validates API metrics, bounded labels, Prometheus targets/rules, and Grafana provisioning.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3002}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

require_endpoint() {
	local url=$1
	local description=$2

	printf 'Testing %s... ' "$description"
	if curl -fsS "$url" >/dev/null 2>&1; then
		printf '%b✓%b\n' "$GREEN" "$NC"
	else
		printf '%b✗%b\n' "$RED" "$NC"
		return 1
	fi
}

require_metric() {
	local metrics=$1
	local metric_name=$2
	local description=$3

	printf 'Checking metric %s... ' "$description"
	if grep -q "$metric_name" <<<"$metrics"; then
		printf '%b✓%b\n' "$GREEN" "$NC"
	else
		printf '%b✗%b\n' "$RED" "$NC"
		return 1
	fi
}

warn_only_endpoint() {
	local url=$1
	local description=$2

	printf 'Testing %s... ' "$description"
	if curl -fsS "$url" >/dev/null 2>&1; then
		printf '%b✓%b\n' "$GREEN" "$NC"
	else
		printf '%b⚠ unavailable%b\n' "$YELLOW" "$NC"
	fi
}

printf '🧪 Testing Arkelythex API Monitoring\n'
printf '=================================\n'
printf 'BASE_URL=%s\nPROMETHEUS_URL=%s\nGRAFANA_URL=%s\n\n' "$BASE_URL" "$PROMETHEUS_URL" "$GRAFANA_URL"

printf '1. Testing API endpoints\n'
printf -- '-----------------------\n'
require_endpoint "$BASE_URL/" "API root endpoint"
require_endpoint "$BASE_URL/health/live" "Health liveness endpoint"
require_endpoint "$BASE_URL/metrics" "Metrics endpoint"
require_endpoint "$BASE_URL/api/swagger" "API documentation"
printf '\n'

printf '2. Generating bounded-label traffic\n'
printf -- '-----------------------------------\n'
for _ in {1..5}; do
	curl -fsS "$BASE_URL/health/live" >/dev/null
	done
# Intentionally high-cardinality-looking path; the metric route label must not leak the raw ID.
curl -fsS "$BASE_URL/fiscal-truth/events/clh3k8u9p0000a1b2c3d4e5f6" >/dev/null 2>&1 || true
printf '%b✓ traffic generated%b\n\n' "$GREEN" "$NC"

metrics_payload="$(curl -fsS "$BASE_URL/metrics")"

printf '3. Testing core metrics\n'
printf -- '-----------------------\n'
require_metric "$metrics_payload" "arkelythex_api_http_requests_total" "HTTP requests counter"
require_metric "$metrics_payload" "arkelythex_api_http_request_duration_seconds" "HTTP request duration histogram"
require_metric "$metrics_payload" "arkelythex_api_http_errors_total" "HTTP errors counter"
require_metric "$metrics_payload" "arkelythex_api_process_cpu_user_seconds_total" "default process metrics"
printf '\n'

printf '4. Testing label safety\n'
printf -- '-----------------------\n'
if grep -q 'clh3k8u9p0000a1b2c3d4e5f6' <<<"$metrics_payload"; then
	printf '%b✗ high-cardinality route segment leaked into metrics%b\n' "$RED" "$NC"
	exit 1
fi
printf '%b✓ high-cardinality route segments are normalized%b\n\n' "$GREEN" "$NC"

printf '5. Testing Prometheus\n'
printf -- '---------------------\n'
warn_only_endpoint "$PROMETHEUS_URL/-/ready" "Prometheus readiness"
if curl -fsS "$PROMETHEUS_URL/api/v1/targets" >/dev/null 2>&1; then
	targets_payload="$(curl -fsS "$PROMETHEUS_URL/api/v1/targets")"
	if grep -q '"job":"arkelythex-api"' <<<"$targets_payload"; then
		printf '%b✓ arkelythex-api target configured%b\n' "$GREEN" "$NC"
	else
		printf '%b⚠ arkelythex-api target not found in Prometheus%b\n' "$YELLOW" "$NC"
	fi
fi
if curl -fsS "$PROMETHEUS_URL/api/v1/rules" >/dev/null 2>&1; then
	rules_payload="$(curl -fsS "$PROMETHEUS_URL/api/v1/rules")"
	if grep -q 'ArkelythexApiDown' <<<"$rules_payload"; then
		printf '%b✓ Arkelythex alert rules loaded%b\n' "$GREEN" "$NC"
	else
		printf '%b⚠ Arkelythex alert rules not visible%b\n' "$YELLOW" "$NC"
	fi
fi
printf '\n'

printf '6. Testing Grafana\n'
printf -- '------------------\n'
warn_only_endpoint "$GRAFANA_URL/api/health" "Grafana health"
printf '\n'

printf '=================================\n'
printf '%b✅ Monitoring smoke completed%b\n' "$GREEN" "$NC"
