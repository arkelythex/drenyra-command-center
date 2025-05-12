#!/usr/bin/env bash
# W2-07E — Wave 2 Full Gate
# Usage: DATABASE_URL_TEST=postgres://... REDIS_URL=redis://... ./wave2-gate.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
_YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'
PASS=0
FAIL=0
TOTAL=0

pass() {
	PASS=$((PASS + 1))
	TOTAL=$((TOTAL + 1))
	echo -e "  ${GREEN}✓${NC} $1"
}
fail() {
	FAIL=$((FAIL + 1))
	TOTAL=$((TOTAL + 1))
	echo -e "  ${RED}✗${NC} $1"
}
header() { echo -e "\n${BOLD}═══ $1 ═══${NC}\n"; }

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT"

# ═══════════════════════════════════════════════════════════════════════════
# E1 — Environment
# ═══════════════════════════════════════════════════════════════════════════
header "E1 — Environment"

if [ -z "${DATABASE_URL_TEST:-}" ]; then
	fail "DATABASE_URL_TEST not set"
elif psql "$DATABASE_URL_TEST" -c "SELECT 1" &>/dev/null; then
	pass "PostgreSQL reachable"
else
	fail "PostgreSQL not reachable at DATABASE_URL_TEST"
fi

if [ -z "${REDIS_URL:-}" ]; then
	fail "REDIS_URL not set — required for W2-07 D2-D3"
elif redis-cli -u "$REDIS_URL" PING &>/dev/null; then
	pass "Redis reachable"
else
	fail "Redis not reachable at REDIS_URL"
fi

if command -v bun &>/dev/null; then
	pass "Bun $(bun --version)"
else
	fail "Bun not found"
fi

# ═══════════════════════════════════════════════════════════════════════════
# E2 — Migrations Fresh
# ═══════════════════════════════════════════════════════════════════════════
header "E2 — Fresh Install"

MIGRATIONS_DIR="$PROJECT_ROOT/packages/infrastructure/drizzle"
MIGRATIONS=(
	0000_canonical_baseline 0001_add_ai_worker_queues 0002_lying_satana
	0003_warm_forgotten_one 0004_amazing_juggernaut 0005_violet_overlord
	0006_drenyra_command_center 0007_add_ai_control_plane_tables
	0008_melodic_tusk 0009_early_secret_warriors 0010_tidy_thena
	0011_fiscal_audit_ledger_hash_chain 0012_agent_run_persistence
	0013_ai_tool_permissions 0014_agent_run_inputs 0015_batch_runs
	0016_batch_cancelled 0018_error_recovery 0022_job_executions
	0023_job_outbox_relay_fields 0024_job_unknown_state
)

FRESH_OK=0
for m in "${MIGRATIONS[@]}"; do
	FILE="$MIGRATIONS_DIR/$m.sql"
	# 0024 contains ALTER TYPE ... ADD VALUE which cannot run inside a
	# transaction block in PostgreSQL 16. Apply without -1 for that file.
	if grep -q "ALTER TYPE.*ADD VALUE" "$FILE" 2>/dev/null; then
		TX_FLAG=""
	else
		TX_FLAG="-1"
	fi
	if [ -f "$FILE" ] && psql "$DATABASE_URL_TEST" $TX_FLAG -f "$FILE" &>/dev/null; then
		echo "  ✓ $m"
		FRESH_OK=$((FRESH_OK + 1))
	else
		echo "  ✗ $m"
		fail "Migration $m failed on fresh install"
	fi
done
if [ "$FRESH_OK" -eq "${#MIGRATIONS[@]}" ]; then
	pass "All ${#MIGRATIONS[@]} migrations applied (fresh)"
fi

# ═══════════════════════════════════════════════════════════════════════════
# E3 — pg_catalog verification
# ═══════════════════════════════════════════════════════════════════════════
header "E3 — pg_catalog"

CATALOG_OUT=$(psql "$DATABASE_URL_TEST" -f "$MIGRATIONS_DIR/verify-w2-06-pg_catalog.sql" -t -A 2>/dev/null)
CATALOG_FAILS=$(echo "$CATALOG_OUT" | grep -i "false\|f\\b" | wc -l || true)

if [ "$CATALOG_FAILS" -eq 0 ]; then
	pass "pg_catalog all checks passed"
else
	fail "pg_catalog: $CATALOG_FAILS checks failed"
	echo "$CATALOG_OUT" | grep -i "false" | head -5
fi

# ═══════════════════════════════════════════════════════════════════════════
# E4 — Test suite (via bun)
# ═══════════════════════════════════════════════════════════════════════════
header "E4 — Test Suite"

echo "Running persistence tests with DATABASE_URL_TEST..."
# W2-03/W2-06/W2-07
if bun test packages/persistence/src/repositories/__tests__/ 2>&1; then
	pass "Persistence test suite passed"
else
	fail "Persistence test suite failed"
fi

# W2-06 W2-06C W2-06D specific
if bun test packages/persistence/src/repositories/__tests__/job-executions.integration.test.ts 2>&1; then
	pass "W2-06B persistence tests passed"
else
	fail "W2-06B persistence tests failed"
fi

if bun test packages/persistence/src/repositories/__tests__/job-executions-w2-06c.integration.test.ts 2>&1; then
	pass "W2-06C integration tests passed"
else
	fail "W2-06C integration tests failed"
fi

if bun test packages/persistence/src/repositories/__tests__/job-executions-w2-06d.integration.test.ts 2>&1; then
	pass "W2-06D failure injection tests passed"
else
	fail "W2-06D failure injection tests failed"
fi

# W2-07 cross-layer
if bun test packages/persistence/src/repositories/__tests__/wave2/scenarios/ 2>&1; then
	pass "W2-07 cross-layer scenarios passed"
else
	fail "W2-07 cross-layer scenarios failed"
fi

# W2-07 smoke + helpers
if bun test packages/persistence/src/repositories/__tests__/wave2/smoke/ 2>&1; then
	pass "W2-07 smoke tests passed"
else
	fail "W2-07 smoke tests failed"
fi

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
header "Gate Summary"
echo -e "Passed: $PASS | Failed: $FAIL | Total: $TOTAL"

if [ "$FAIL" -eq 0 ]; then
	echo -e "${GREEN}${BOLD}✓ ALL GATES PASSED${NC}"
	exit 0
else
	echo -e "${RED}${BOLD}✗ $FAIL GATES FAILED${NC}"
	exit 1
fi
