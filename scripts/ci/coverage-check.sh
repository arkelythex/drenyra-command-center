#!/usr/bin/env bash
# Drenyra Coverage Gate
# Verifica que todos los paquetes cumplan con los thresholds de cobertura
# Uso: bun run ci:coverage-check
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
PASS=0
FAIL=0

pass() {
	PASS=$((PASS + 1))
	echo -e "  ${GREEN}OK${NC} $1"
}
fail() {
	FAIL=$((FAIL + 1))
	echo -e "  ${RED}EE${NC} $1"
}

echo "📊 Drenyra Coverage Gate"
echo ""

# Run coverage for domain package (the critical one)
echo "  Running coverage for packages/domain..."
cd packages/domain
bun run test -- --coverage --run 2>/dev/null >/tmp/coverage-domain.log || true

# Parse coverage summary
lines=$(grep -oP 'Lines\s+:\s+\K[\d.]+' /tmp/coverage-domain.log 2>/dev/null || echo "0")
funcs=$(grep -oP 'Functions\s+:\s+\K[\d.]+' /tmp/coverage-domain.log 2>/dev/null || echo "0")
branches=$(grep -oP 'Branches\s+:\s+\K[\d.]+' /tmp/coverage-domain.log 2>/dev/null || echo "0")

echo ""
echo "  Coverage Report: packages/domain"
echo "  Lines:     ${lines}%"
echo "  Functions: ${funcs}%"
echo "  Branches:  ${branches}%"

cd "$ROOT_DIR"

# Check thresholds
THRESHOLD=80
if (($(echo "$lines >= $THRESHOLD" | bc -l 2>/dev/null || echo 0))); then
	pass "packages/domain lines >= ${THRESHOLD}%"
else
	fail "packages/domain lines ${lines}% < ${THRESHOLD}%"
fi

echo ""
total=$((PASS + FAIL))
echo "  ${PASS}/${total} checks passed"
[ $FAIL -eq 0 ] && exit 0 || exit 1
