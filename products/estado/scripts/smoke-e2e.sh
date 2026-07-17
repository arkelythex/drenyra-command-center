#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_TOKEN="${ADMIN_TOKEN:-dev-admin-token}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl

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

  local status
  local -a headers=()
  if [[ -n "$token" ]]; then
    headers+=(-H "authorization: Bearer $token")
  fi

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

echo "[smoke] checking health"
health_resp="$(request GET /health)"
expect_status 200 "$health_resp"

echo "[smoke] path A ingest demo"
ingest_resp="$(request POST /admin/ingest/demo '' "$ADMIN_TOKEN")"
expect_status 200 "$ingest_resp"

datasets_resp="$(request GET /public/datasets)"
expect_status 200 "$datasets_resp"

expenses_resp="$(request GET /public/expenses)"
expect_status 200 "$expenses_resp"

echo "[smoke] path B workflow"
create_resp="$(request POST /reports '{"category":"OBRAS","description":"Smoke test report"}')"
expect_status 201 "$create_resp"
create_body="${create_resp#*|}"
report_id="$(json_field id "$create_body")"

if [[ -z "$report_id" || "$report_id" == "null" ]]; then
  echo "failed to parse report id from create response" >&2
  echo "$create_body" >&2
  exit 1
fi

evidence_resp="$(request POST "/reports/$report_id/evidence" '{}')"
expect_status 200 "$evidence_resp"

submit_resp="$(request POST "/reports/$report_id/submit")"
expect_status 200 "$submit_resp"

triage_resp="$(request POST "/moderation/cases/$report_id/triage" '' "$ADMIN_TOKEN")"
expect_status 200 "$triage_resp"

verify_resp="$(request POST "/moderation/cases/$report_id/verify" '' "$ADMIN_TOKEN")"
expect_status 200 "$verify_resp"

publish_resp="$(request POST "/moderation/reports/$report_id/publish" '{"public_text":"Smoke published report (redacted)"}' "$ADMIN_TOKEN")"
expect_status 200 "$publish_resp"

public_feed_resp="$(request GET /public/reports)"
expect_status 200 "$public_feed_resp"

if ! echo "${public_feed_resp#*|}" | grep -q "Smoke published report"; then
  echo "public feed does not contain expected published text" >&2
  exit 1
fi

echo "[smoke] all checks passed"
