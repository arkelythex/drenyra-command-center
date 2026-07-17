#!/usr/bin/env bash
set -euo pipefail

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8081}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-civictech}"
TIMEOUT_SECONDS="${1:-120}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

endpoint="$KEYCLOAK_BASE_URL/realms/$KEYCLOAK_REALM/.well-known/openid-configuration"
deadline=$((SECONDS + TIMEOUT_SECONDS))

echo "[wait-keycloak] waiting for $endpoint"
while (( SECONDS < deadline )); do
  status="$(curl -sS -o /dev/null -w "%{http_code}" "$endpoint" || true)"
  if [[ "$status" == "200" ]]; then
    echo "[wait-keycloak] ready"
    exit 0
  fi
  sleep 2
done

echo "[wait-keycloak] timeout after ${TIMEOUT_SECONDS}s" >&2
exit 1
