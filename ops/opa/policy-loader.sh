#!/usr/bin/env bash
set -euo pipefail
# Loads OPA policies from local files into a running OPA server
# Usage: ./policy-loader.sh [opa-url]
OPA_URL="${1:-http://localhost:8181}"
POLICIES_DIR="$(dirname "$0")/../../packages/os-supervisor/policies"

echo "Loading policies from $POLICIES_DIR into OPA at $OPA_URL..."

loaded=0
failed=0

for policy_file in "$POLICIES_DIR"/*.rego; do
    [ -f "$policy_file" ] || continue
    policy_name="$(basename "$policy_file" .rego)"
    echo "  📄 $policy_file → $policy_name"

    response=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
        --data-binary @"${policy_file}" \
        "${OPA_URL}/v1/policies/${policy_name}")

    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo "    ✅ HTTP $response"
        loaded=$((loaded + 1))
    else
        echo "    ❌ HTTP $response"
        failed=$((failed + 1))
    fi
done

echo ""
echo "Summary: $loaded loaded, $failed failed"
echo "Verify at: $OPA_URL/v1/policies"

if [ "$failed" -gt 0 ]; then
    exit 1
fi
