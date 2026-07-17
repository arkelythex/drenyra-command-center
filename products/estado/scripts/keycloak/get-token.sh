#!/usr/bin/env bash
set -euo pipefail

role="${1:-admin}"

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8081}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-civictech}"
KEYCLOAK_CLIENT_ID="${KEYCLOAK_CLIENT_ID:-civictech-api}"

case "$role" in
  admin)
    username="${KEYCLOAK_TEST_ADMIN_USER:-admin_user}"
    password="${KEYCLOAK_TEST_ADMIN_PASSWORD:-admin_user_pass}"
    ;;
  moderator)
    username="${KEYCLOAK_TEST_MODERATOR_USER:-moderator_user}"
    password="${KEYCLOAK_TEST_MODERATOR_PASSWORD:-moderator_user_pass}"
    ;;
  *)
    echo "usage: $0 [admin|moderator]" >&2
    exit 1
    ;;
esac

endpoint="$KEYCLOAK_BASE_URL/realms/$KEYCLOAK_REALM/protocol/openid-connect/token"

response="$(curl -sS -X POST "$endpoint" \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d "grant_type=password" \
  -d "client_id=$KEYCLOAK_CLIENT_ID" \
  -d "username=$username" \
  -d "password=$password")"

if command -v jq >/dev/null 2>&1; then
  token="$(echo "$response" | jq -r '.access_token // empty')"
else
  token="$(echo "$response" | sed -n 's/.*"access_token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
fi

if [[ -z "$token" ]]; then
  echo "failed to retrieve token from keycloak response" >&2
  echo "$response" >&2
  exit 1
fi

echo "$token"
