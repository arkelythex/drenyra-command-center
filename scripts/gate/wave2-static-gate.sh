#!/usr/bin/env bash
# W2-07E — Static Gates
# Búsquedas automatizadas para detectar violaciones de principios Wave 2.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
BOLD='\033[1m'
PASS=0
FAIL=0

pass() {
	PASS=$((PASS + 1))
	echo -e "  ${GREEN}✓${NC} $1"
}
fail() {
	FAIL=$((FAIL + 1))
	echo -e "  ${RED}✗${NC} $1"
}
header() { echo -e "\n${BOLD}═══ $1 ═══${NC}\n"; }

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

SRC="packages/domain/src packages/application/src"
ALL_TS="packages --include='*.ts' --exclude-dir=node_modules --exclude-dir=__tests__"

header "Static Gates — Wave 2"

# 1. No Map/Set como dedup crítica en capas productivas
echo "  Checking for in-memory dedup..."
IN_MEMORY=$(grep -rn "new Map\|new Set" $SRC --include="*.ts" 2>/dev/null | grep -iv "cache\|memoize\|config\|registry" | head -5)
if [ -z "$IN_MEMORY" ]; then
	pass "No in-memory Map/Set dedup in domain/application"
else
	fail "In-memory dedup found:\n$IN_MEMORY"
fi

# 2. No queue.add() directo desde dominio
echo "  Checking for queue.add in domain..."
QADD=$(grep -rn "queue\.add\|Queue\.add" packages/domain/src --include="*.ts" 2>/dev/null | head -5)
if [ -z "$QADD" ]; then
	pass "No queue.add() in domain"
else
	fail "queue.add() found in domain:\n$QADD"
fi

# 3. No jobId tratado como fuente de verdad
echo "  Checking for jobId as truth source..."
JOBID_TRUTH=$(grep -rn "jobId.*dedup\|dedup.*jobId\|jobId.*único\|jobId.*unico" packages --include="*.ts" --exclude-dir=node_modules --exclude-dir=__tests__ 2>/dev/null | head -5)
if [ -z "$JOBID_TRUTH" ]; then
	pass "No jobId treated as truth source"
else
	fail "jobId used as truth source:\n$JOBID_TRUTH"
fi

# 4. No imports productivos desde test-utils
echo "  Checking for productive imports of test-utils..."
TESTUTIL_IMPORTS=$(grep -rn "@drenyra/test-utils" packages --include="*.ts" --exclude-dir=node_modules --exclude-dir=__tests__ 2>/dev/null | head -5)
if [ -z "$TESTUTIL_IMPORTS" ]; then
	pass "No productive imports from @drenyra/test-utils"
else
	fail "Productive import of test-utils:\n$TESTUTIL_IMPORTS"
fi

# 5. No tokens completos ni payloads sensibles en logs
echo "  Checking for complete tokens in logs..."
TOKENS_IN_LOGS=$(grep -rn "executionToken.*log\|\.info.*executionToken\|\.warn.*token" packages/persistence/src --include="*.ts" 2>/dev/null | grep -v "executionTokenHash\|relayTokenHash\|__tests__" | head -5)
if [ -z "$TOKENS_IN_LOGS" ]; then
	pass "No complete tokens in logs"
else
	fail "Complete token found in log:\n$TOKENS_IN_LOGS"
fi

# 6. No labels Prometheus con IDs de alta cardinalidad
echo "  Checking for high-cardinality Prometheus labels..."
LABEL_IDS=$(grep -rn "execution_id\|organization_id\|logical_key\|company_id" packages/infrastructure/src/observability --include="*.ts" 2>/dev/null | head -5)
if [ -z "$LABEL_IDS" ]; then
	pass "No high-cardinality Prometheus labels"
else
	fail "High-cardinality label found:\n$LABEL_IDS"
fi

# 7. No sleep() para coordinar concurrencia
echo "  Checking for sleep() in tests..."
SLEEP=$(grep -rn "sleep(" packages/persistence/src/repositories/__tests__ --include="*.ts" 2>/dev/null | head -5)
if [ -z "$SLEEP" ]; then
	pass "No sleep() in tests"
else
	# Allow small setTimeout for AsyncBarrier test
	SLEEP_OK=$(echo "$SLEEP" | grep -v "failure-harness\|async-barrier" | head -5)
	if [ -z "$SLEEP_OK" ]; then
		pass "sleep() only in barrier tests (acceptable)"
	else
		fail "sleep() used for coordination:\n$SLEEP_OK"
	fi
fi

# 8. No UNKNOWN auto-recovery
echo "  Checking for UNKNOWN auto-recovery..."
UNKNOWN_RECOVERY=$(grep -rn "UNKNOWN" packages/persistence/src/repositories/job-recovery.ts 2>/dev/null | head -5)
# RecoverySweep should NOT reference UNKNOWN
if [ -z "$UNKNOWN_RECOVERY" ]; then
	pass "RecoverySweep does not reference UNKNOWN (intentional)"
else
	fail "RecoverySweep references UNKNOWN — verify"
fi

# 9. No cross-tenant operations without scope
echo "  Checking for un-scoped cross-tenant operations..."
UNSCOPED=$(grep -rn "\.findAll\|\.findById" packages/persistence/src/repositories --include="*.ts" 2>/dev/null | grep -v "company_id\|organization_id\|__tests__\|\.test\." | head -5)
# This is advisory — many repositories use scoped queries
if [ -z "$UNSCOPED" ]; then
	pass "All repository queries appear scoped"
else
	fail "Potentially unscoped queries found:\n$UNSCOPED"
fi

# ═══════════════════════════════════════════════════════════════════════════
header "Static Gate Summary"
echo -e "Passed: $PASS | Failed: $FAIL"

if [ "$FAIL" -eq 0 ]; then
	echo -e "${GREEN}${BOLD}✓ ALL STATIC GATES PASSED${NC}"
	exit 0
else
	echo -e "${RED}${BOLD}✗ $FAIL STATIC GATES FAILED${NC}"
	exit 1
fi
