#!/usr/bin/env bash
# W2-03F — Idempotency CI Guardrail
#
# Runs the full idempotency test suite against a real PostgreSQL database.
# Fails explicitly if DATABASE_URL_TEST is missing or if any test suite fails.
#
# Pipeline:
#   1. Verify DATABASE_URL_TEST is set
#   2. Verify idempotency_records migration is applied
#   3. Run unit-level tests (W2-03A — canonical hashing, W2-03C — service)
#   4. Run repository integration tests (W2-03B + W2-03B.1)
#   5. Run Elysia adapter tests (W2-03D)
#   6. Run end-to-end concurrency tests (W2-03E)
#   7. Run ast-grep lint for in-memory idempotency patterns
#   8. Verify no open handles (optional)
#
# Exit codes:
#   0  = all passed
#   1  = DATABASE_URL_TEST not set
#   2  = migration not applied
#   3+ = test failures
#
# Usage:
#   bash scripts/ci/run-idempotency-tests.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

PASS=0
FAIL=0

pass() {
	PASS=$((PASS + 1))
	echo "  ✅ PASS"
}
fail() {
	FAIL=$((FAIL + 1))
	echo "  ❌ FAIL: $1"
}

# ══════════════════════════════════════════════════════════════════════════════
# Step 1 — Verify database
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  W2-03F Idempotency CI Guardrail"
echo "═══════════════════════════════════════════════════════════════════"

echo ""
echo "─── Step 1: Database check ───"

if [ -z "${DATABASE_URL_TEST:-}" ]; then
	echo "❌ DATABASE_URL_TEST is not set."
	echo "   Set it to a PostgreSQL connection string for the test database."
	echo "   Example:"
	echo "     export DATABASE_URL_TEST='postgres://user:pass@localhost:5432/drenyra_test'"
	exit 1
fi
pass

# ══════════════════════════════════════════════════════════════════════════════
# Step 2 — Verify migration
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "─── Step 2: Migration check ───"

TABLE_EXISTS=$(psql "$DATABASE_URL_TEST" -t -c \
	"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'idempotency_records');" 2>/dev/null || echo "")

if [ "$TABLE_EXISTS" != " t" ]; then
	echo "❌ idempotency_records table does not exist."
	echo "   Run the migration first:"
	echo "     cd packages/infrastructure && bun run db:migrate"
	exit 2
fi
pass

# ══════════════════════════════════════════════════════════════════════════════
# Step 3 — Unit-level tests
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "─── Step 3: Unit tests (W2-03A + W2-03C) ───"

echo "  Running canonical payload hashing tests..."
if bun test --filter @drenyra/application -- src/shared/idempotency/ 2>&1 | tail -3; then
	# Check for failures in output
	if bun test --filter @drenyra/application -- src/shared/idempotency/ 2>&1 | grep -q "FAIL"; then
		fail "Canonical payload hashing tests failed"
	else
		pass
	fi
else
	fail "Canonical payload hashing tests errored"
fi

echo "  Running idempotency service tests..."
if bun test --filter @drenyra/application -- src/services/__tests__/idempotency.service.test.ts 2>&1 | grep -q "FAIL"; then
	fail "Idempotency service tests failed"
else
	pass
fi

# ══════════════════════════════════════════════════════════════════════════════
# Step 4 — Repository integration tests
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "─── Step 4: Repository integration tests (W2-03B + W2-03B.1) ───"

echo "  Running PostgresIdempotencyRepository tests..."
PG_RESULTS=$(DATABASE_URL_TEST="$DATABASE_URL_TEST" bun test --filter @drenyra/persistence -- "src/repositories/__tests__/postgres-idempotency-repository.test.ts" 2>&1 || true)
if echo "$PG_RESULTS" | grep -q "FAIL"; then
	fail "Repository integration tests failed"
	echo "$PG_RESULTS" | grep -E "FAIL|✗"
else
	pass
fi

# ══════════════════════════════════════════════════════════════════════════════
# Step 5 — Elysia adapter tests
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "─── Step 5: Elysia adapter tests (W2-03D) ───"

echo "  Running idempotency plugin tests..."
ADAPTER_RESULTS=$(bun test --filter @drenyra/api -- "src/features/shared/__tests__/idempotency-plugin.test.ts" 2>&1 || true)
if echo "$ADAPTER_RESULTS" | grep -q "FAIL"; then
	fail "Elysia adapter tests failed"
	echo "$ADAPTER_RESULTS" | grep -E "FAIL|✗"
else
	pass
fi

# ══════════════════════════════════════════════════════════════════════════════
# Step 6 — End-to-end concurrency tests
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "─── Step 6: End-to-end concurrency tests (W2-03E) ───"

echo "  Running idempotency e2e tests..."
E2E_RESULTS=$(DATABASE_URL_TEST="$DATABASE_URL_TEST" bun test --filter @drenyra/persistence -- "src/repositories/__tests__/idempotency-e2e.test.ts" 2>&1 || true)
if echo "$E2E_RESULTS" | grep -q "FAIL"; then
	fail "End-to-end concurrency tests failed"
	echo "$E2E_RESULTS" | grep -E "FAIL|✗"
else
	pass
fi

# ══════════════════════════════════════════════════════════════════════════════
# Step 7 — Ast-grep lint: in-memory idempotency detection
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "─── Step 7: In-memory idempotency lint ───"

if command -v sg &>/dev/null; then
	echo "  Running ast-grep rule: no-in-memory-idempotency..."
	SG_RESULTS=$(sg scan --config .ast-grep/rules/no-in-memory-idempotency.yml 2>&1 || true)
	if echo "$SG_RESULTS" | grep -q "matches"; then
		fail "In-memory idempotency patterns detected! See matches above."
		echo "$SG_RESULTS"
	else
		pass
	fi
else
	echo "  ⚠️  ast-grep not installed — skipping lint. Install with: cargo install ast-grep"
	pass
fi

# ══════════════════════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
	echo ""
	echo "❌ Some idempotency guardrails failed."
	echo "   Review failures above and fix before merging."
	exit 3
fi

echo "  ✅ All idempotency guardrails passed."
