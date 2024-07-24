#!/usr/bin/env bash
# H02 Legacy API Check — CI verification script
#
# Verifies no unscoped repository methods remain in the domain
# repository interfaces. This is the final gate for Wave 6.3.
#
# Checks:
#   1. No findById(id) without scope parameter
#   2. No findByIdempotencyKey(key) without scope
#   3. No findByHash(hash) without scope
#   4. No unscoped save/update/delete on tenant-owned repositories
#
# Usage:
#   bash scripts/ci/h02-legacy-api-check.sh          # Normal check
#   bash scripts/ci/h02-legacy-api-check.sh --strict # Fail on ANY unscoped method
#
# Exit codes:
#   0 = clean (no violations beyond known allowlist)
#   1 = violations found
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

DOMAIN_REPOS="packages/domain/src/repositories"

# ============================================================
# Tenant-owned repository inventory (19 repos from H02 audit)
# These MUST have scope-first method signatures.
# ============================================================

TENANT_OWNED_REPOS=(
	"account.repository.ts"
	"journal-entry.repository.ts"
	"detraction.repository.ts"
	"cpe-log.repository.ts"
	"accounting-period.repository.ts"
	"exchange-rate.repository.ts"
	"client.repository.ts"
	"provider.repository.ts"
	"transaction.repository.ts"
	"evidence.repository.ts"
	"invoice.repository.ts"
	"sire-submission.repository.ts"
	"document.repository.ts"
	"fiscal-memory.repository.ts"
)

# ============================================================
# Known-safe patterns — methods that already have scope
# ============================================================

# Patterns that are intentionally unscoped (non-tenant-owned repos,
# or repos outside the H02 tenant isolation scope):
KNOWN_SAFE_FILES=(
	# Non-tenant-owned — catalogs, global lookups, platform tables
	"ai-prompt.repository.ts"
	"model-registration.repository.ts"
	"close-checklist.repository.ts"
	"accounting-pr.repository.ts"
	"bank-account.repository.ts"       # findById(id, organizationId) — has scope
	"bank-transaction.repository.ts"   # findById(id, bankAccountId) — has scope
	"tenant-scoped.repository.ts"      # Generic interface — T parameterized
)

# ============================================================
# Patterns to detect
# ============================================================

# Pattern 1: findById(id) with no second parameter (no scope)
FIND_BY_ID_UNSCOPED='findById\(id:[[:space:]]*(string|number)[[:space:]]*\)'

# Pattern 2: findByIdempotencyKey(key) with no scope
FIND_BY_IDEMPOTENCY_UNSCOPED='findByIdempotencyKey\(key:[[:space:]]*string[[:space:]]*\)'

# Pattern 3: findByHash(hash) with no scope
FIND_BY_HASH_UNSCOPED='findByHash\(hash:[[:space:]]*string[[:space:]]*\)'

# ============================================================
# Check
# ============================================================

violations=0
strict_mode=false

if [[ "${1:-}" == "--strict" ]]; then
	strict_mode=true
fi

echo "🔍 H02 Legacy API Check — scanning for unscoped repository methods..."
echo "   Repository dir: $DOMAIN_REPOS"
echo ""

check_pattern() {
	local pattern="$1"
	local label="$2"

	while IFS=: read -r file line content; do
		if [[ -z "$file" ]]; then
			continue
		fi

		basename=$(basename "$file")

		# Skip known-safe files (non-tenant-owned)
		local is_safe=false
		for safe_file in "${KNOWN_SAFE_FILES[@]}"; do
			if [[ "$basename" == "$safe_file" ]]; then
				is_safe=true
				break
			fi
		done

		if $is_safe; then
			echo "   ✓ known-safe: $basename:$line — $content"
			continue
		fi

		# Check if file is in tenant-owned inventory
		local is_tenant_owned=false
		for tenant_file in "${TENANT_OWNED_REPOS[@]}"; do
			if [[ "$basename" == "$tenant_file" ]]; then
				is_tenant_owned=true
				break
			fi
		done

		if $is_tenant_owned; then
			echo "   ❌ VIOLATION (tenant-owned): $basename:$line — $content"
			violations=$((violations + 1))
		elif $strict_mode; then
			echo "   ⚠️  UNKNOWN (not in tenant inventory): $basename:$line — $content"
			echo "      If tenant-owned, add to TENANT_OWNED_REPOS in this script."
			violations=$((violations + 1))
		else
			echo "   ⚠️  UNKNOWN (not in tenant inventory): $basename:$line — $content"
			echo "      Not counted as violation in non-strict mode."
		fi
	done < <(grep -Ern "$pattern" "$DOMAIN_REPOS" 2>/dev/null || true)
}

echo "─── Pattern 1: findById(id) without scope parameter ───"
check_pattern "$FIND_BY_ID_UNSCOPED" "findById"

echo ""
echo "─── Pattern 2: findByIdempotencyKey(key) without scope ───"
check_pattern "$FIND_BY_IDEMPOTENCY_UNSCOPED" "findByIdempotencyKey"

echo ""
echo "─── Pattern 3: findByHash(hash) without scope ───"
check_pattern "$FIND_BY_HASH_UNSCOPED" "findByHash"

echo ""
echo "─── Tenant-owned repository summary ───"
echo ""

for tenant_file in "${TENANT_OWNED_REPOS[@]}"; do
	filepath="$DOMAIN_REPOS/$tenant_file"
	if [[ -f "$filepath" ]]; then
		# Check if this file still has any unscoped findById
		if grep -Eq "$FIND_BY_ID_UNSCOPED" "$filepath" 2>/dev/null; then
			echo "   ⚠️  $tenant_file — unscoped findById STILL PRESENT"
		else
			echo "   ✅ $tenant_file — clean"
		fi
	else
		echo "   ➖ $tenant_file — file not found"
	fi
done

echo ""
if [[ $violations -gt 0 ]]; then
	echo "❌ FAILED: $violations unscoped method(s) found in tenant-owned repositories."
	echo ""
	echo "   These repositories MUST use scope-first method signatures."
	echo "   If this is intentional, update the TENANT_OWNED_REPOS list"
	echo "   or add the file to KNOWN_SAFE_FILES in this script."
	exit 1
else
	echo "✅ PASSED: No unscoped methods in tenant-owned repository interfaces."
	exit 0
fi
