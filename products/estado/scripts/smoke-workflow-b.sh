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

echo "[workflow-b] create report"
create_resp="$(request POST /reports '{"category":"OBRAS","description":"Workflow B integration"}')"
expect_status 201 "$create_resp"
report_id="$(json_field id "${create_resp#*|}")"

if [[ -z "$report_id" || "$report_id" == "null" ]]; then
  echo "failed to parse report id" >&2
  echo "${create_resp#*|}" >&2
  exit 1
fi

echo "[workflow-b] invalid transition: TRIAGE before SUBMIT should fail"
triage_before_submit="$(request POST "/moderation/cases/$report_id/triage" '' "$ADMIN_TOKEN")"
expect_status 409 "$triage_before_submit"

echo "[workflow-b] submit"
submit_resp="$(request POST "/reports/$report_id/submit")"
expect_status 200 "$submit_resp"

echo "[workflow-b] invalid transition: PUBLISH before VERIFY should fail"
publish_before_verify="$(request POST "/moderation/reports/$report_id/publish" '{"public_text":"too early"}' "$ADMIN_TOKEN")"
expect_status 409 "$publish_before_verify"

echo "[workflow-b] triage + verify + publish"
triage_resp="$(request POST "/moderation/cases/$report_id/triage" '' "$ADMIN_TOKEN")"
expect_status 200 "$triage_resp"
verify_resp="$(request POST "/moderation/cases/$report_id/verify" '' "$ADMIN_TOKEN")"
expect_status 200 "$verify_resp"
publish_resp="$(request POST "/moderation/reports/$report_id/publish" '{"public_text":"Workflow B published"}' "$ADMIN_TOKEN")"
expect_status 200 "$publish_resp"

echo "[workflow-b] invalid transition: VERIFY after PUBLISH should fail"
verify_after_publish="$(request POST "/moderation/cases/$report_id/verify" '' "$ADMIN_TOKEN")"
expect_status 409 "$verify_after_publish"

echo "[workflow-b] metrics should expose transition and resolution families"
metrics_resp="$(request GET /metrics)"
expect_status 200 "$metrics_resp"
metrics_payload="${metrics_resp#*|}"

if ! echo "$metrics_payload" | grep -q "civictech_report_transition_total"; then
  echo "missing civictech_report_transition_total in /metrics" >&2
  exit 1
fi

if ! echo "$metrics_payload" | grep -q "civictech_report_resolution_seconds"; then
  echo "missing civictech_report_resolution_seconds in /metrics" >&2
  exit 1
fi

echo "[workflow-b] all checks passed"
