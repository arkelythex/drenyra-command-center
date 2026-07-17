#!/usr/bin/env bash
set -euo pipefail

URL="${1:-}"
EXPECTED_STATUS="${2:-200}"
TIMEOUT_SECONDS="${3:-60}"
MATCH_PATTERN="${4:-}"

if [[ -z "$URL" ]]; then
  echo "usage: $0 <url> [expected_status=200] [timeout_seconds=60] [match_pattern]" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

deadline=$((SECONDS + TIMEOUT_SECONDS))

echo "[wait-http] waiting for $URL status=$EXPECTED_STATUS"
while (( SECONDS < deadline )); do
  status="$(curl -sS -o /dev/null -w "%{http_code}" "$URL" || true)"
  if [[ "$status" == "$EXPECTED_STATUS" ]]; then
    if [[ -n "$MATCH_PATTERN" ]]; then
      body="$(curl -sS "$URL" || true)"
      if echo "$body" | grep -q "$MATCH_PATTERN"; then
        echo "[wait-http] ready"
        exit 0
      fi
    else
      echo "[wait-http] ready"
      exit 0
    fi
  fi
  sleep 1
done

echo "[wait-http] timeout after ${TIMEOUT_SECONDS}s (last status=$status)" >&2
exit 1
