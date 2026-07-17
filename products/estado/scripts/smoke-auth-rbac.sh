#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd bash

if [[ "${SKIP_WAIT:-0}" != "1" ]]; then
  bash ./scripts/keycloak/wait-ready.sh 120
  bash ./scripts/wait-for-http.sh "$BASE_URL/health" 200 120
fi

ADMIN_TOKEN="$(bash ./scripts/keycloak/get-token.sh admin)"
MODERATOR_TOKEN="$(bash ./scripts/keycloak/get-token.sh moderator)"

json_field() {
  local key="$1"
  local payload="$2"

  if command -v jq >/dev/null 2>&1; then
    echo "$payload" | jq -r ".$key"
    return
  fi

  echo "$payload" | sed -n "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n1
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local token="${4:-}"
  local tmp
  tmp="$(mktemp)"

  local -a headers=()
  if [[ -n "$token" ]]; then
    headers+=(-H "authorization: Bearer $token")
  fi

  local status
  if [[ -n "$body" ]]; then
    status="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$BASE_URL$path" "${headers[@]}" -H "content-type: application/json" -d "$body")"
  else
    status="$(curl -sS -o "$tmp" -w "%{http_code}" -X "$method" "$BASE_URL$path" "${headers[@]}")"
  fi

  local response
  response="$(cat "$tmp")"
  rm -f "$tmp"

  echo "$status|$response"
}

expect_status() {
  local expected="$1"
  local got_line="$2"
  local got_status="${got_line%%|*}"
  if [[ "$got_status" != "$expected" ]]; then
    echo "unexpected status: expected $expected got $got_status" >&2
    echo "response: ${got_line#*|}" >&2
    exit 1
  fi
}

echo "[rbac] health"
health_resp="$(request GET /health)"
expect_status 200 "$health_resp"

echo "[rbac] create + submit report"
create_resp="$(request POST /reports '{"category":"OBRAS","description":"RBAC smoke report"}')"
expect_status 201 "$create_resp"
report_id="$(json_field id "${create_resp#*|}")"

if [[ -z "$report_id" || "$report_id" == "null" ]]; then
  echo "failed to parse report id" >&2
  echo "${create_resp#*|}" >&2
  exit 1
fi

submit_resp="$(request POST "/reports/$report_id/submit")"
expect_status 200 "$submit_resp"

echo "[rbac] unauthorized without token"
triage_no_token="$(request POST "/moderation/cases/$report_id/triage")"
expect_status 401 "$triage_no_token"

echo "[rbac] moderator can moderate"
triage_mod="$(request POST "/moderation/cases/$report_id/triage" '' "$MODERATOR_TOKEN")"
expect_status 200 "$triage_mod"

verify_mod="$(request POST "/moderation/cases/$report_id/verify" '' "$MODERATOR_TOKEN")"
expect_status 200 "$verify_mod"

publish_mod="$(request POST "/moderation/reports/$report_id/publish" '{"public_text":"RBAC smoke publish"}' "$MODERATOR_TOKEN")"
expect_status 200 "$publish_mod"

echo "[rbac] moderator forbidden on admin endpoint"
admin_ingest_mod="$(request POST /admin/ingest/demo '' "$MODERATOR_TOKEN")"
expect_status 403 "$admin_ingest_mod"

echo "[rbac] admin allowed on admin endpoint"
admin_ingest_admin="$(request POST /admin/ingest/demo '' "$ADMIN_TOKEN")"
expect_status 200 "$admin_ingest_admin"

echo "[rbac] checks passed"
