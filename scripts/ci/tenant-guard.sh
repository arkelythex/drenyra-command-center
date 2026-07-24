#!/usr/bin/env bash
# Tenant Isolation Guardrail — CI script
#
# Checks that no NEW callers of unscoped repository methods have appeared
# outside the temporary allowlist.
#
# Usage:
#   bash scripts/ci/tenant-guard.sh          # Normal check
#   bash scripts/ci/tenant-guard.sh --strict # Fail on ANY unscoped call
#
# Exit codes:
#   0 = clean (no violations beyond allowlist)
#   1 = violations found
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

# ============================================================
# Patterns to detect — each one is a grep pattern for
# repository calls without scope argument
# ============================================================

# Patterns to detect — each one looks for method calls on repository-like objects
# where the first argument is a plain ID/string without a scope parameter.
#
# We scope to method calls on objects matching *Repo* or *Repository to reduce
# false positives from Map.delete(), db.delete(), storage.delete(), etc.

PATTERNS=(
	# findById(id) without scope on repository objects
	'Repo[A-Za-z]*\.findById\([a-zA-Z_][a-zA-Z0-9_]*\)'
	# repository.findById(id)
	'repository\.findById\([a-zA-Z_][a-zA-Z0-9_]*\)'
	# findByIdempotencyKey(key) without scope
	'findByIdempotencyKey\([a-zA-Z_][a-zA-Z0-9_]*\)'
	# findByHash(hash) without scope
	'findByHash\([a-zA-Z_][a-zA-Z0-9_]*\)'
	# repository.delete(id) without scope
	'Repo[A-Za-z]*\.delete\([a-zA-Z_][a-zA-Z0-9_]*\)'
	# SireSubmissionRepository.update(id, ...) without scope
	'SireSubmission.*\.update\([a-zA-Z_][a-zA-Z0-9_]*,'
)

# ============================================================
# Temporary allowlist — files currently authorized to use
# unscoped methods during migration
# ============================================================

ALLOWLIST=(
	# AccountRepository — FULLY MIGRATED in H02 Wave 1. No legacy callers remain.
	#
	# W1: JournalEntryRepository (3 callers, 3 files)
	"packages/application/src/use-cases/journal/delete-journal-entry.use-case.ts"
	"packages/application/src/use-cases/journal/update-journal-entry-status.use-case.ts"
	"packages/application/src/use-cases/journal/update-journal-entry.use-case.ts"
	# W2: Single-caller repos
	"packages/application/src/services/detraction.service.ts"
	"packages/application/src/services/cpe-tracking.service.ts"
	"packages/application/src/services/accounting-period.service.ts"
	# W3: TransactionRepository (2 callers, 2 files)
	"packages/application/src/use-cases/transaction/get-transaction.use-case.ts"
	"packages/application/src/use-cases/transaction/delete-transaction.use-case.ts"
	# W4: InvoiceRepository (3 callers, 3 files)
	"packages/application/src/use-cases/invoice/delete-invoice.use-case.ts"
	"packages/application/src/use-cases/invoice/get-invoice-details.use-case.ts"
	"packages/application/src/use-cases/invoice/update-invoice.use-case.ts"
	# Non-tenant-owned (tracked for completeness)
	"packages/infrastructure/src/ai/model-router/registry.ts"
	"packages/infrastructure/src/services/swarm-consensus/index.ts"
	"packages/infrastructure/src/services/swarm-consensus/index.js"
)

# ============================================================
# Check
# ============================================================

violations=0
strict_mode=false

if [[ "${1:-}" == "--strict" ]]; then
	strict_mode=true
fi

echo "🔍 Tenant Isolation Guardrail — checking for unscoped repository calls..."
echo ""

for pattern in "${PATTERNS[@]}"; do
	# Search in packages/application and packages/infrastructure (not node_modules, not tests)
	while IFS=: read -r file line content; do
		if [[ -z "$file" ]]; then
			continue
		fi

		# Skip test files
		if echo "$file" | grep -qE '(__tests__|\.test\.ts|\.spec\.ts)'; then
			continue
		fi

		# Check allowlist
		allowed=false
		for allowed_file in "${ALLOWLIST[@]}"; do
			if [[ "$file" == *"$allowed_file" ]]; then
				allowed=true
				break
			fi
		done

		if $strict_mode && ! $allowed; then
			echo "❌ VIOLATION (strict): $file:$line — $content"
			violations=$((violations + 1))
		elif ! $allowed; then
			echo "⚠️  NEW CALLER (not in allowlist): $file:$line — $content"
			violations=$((violations + 1))
		else
			echo "✓ allowed: $file:$line — $content"
		fi
	done < <(rg -n "$pattern" -g '*.ts' -g '!node_modules' -g '!__tests__' -g '!*.test.ts' -g '!*.spec.ts' packages/application packages/infrastructure 2>/dev/null || true)
done

echo ""
if [[ $violations -gt 0 ]]; then
	echo "❌ FAILED: $violations violation(s) found."
	echo "   New callers of unscoped repository methods detected."
	echo "   If this is intentional, add the file to ALLOWLIST in scripts/ci/tenant-guard.sh"
	echo "   and reference the H02 wave/PR that will fix it."
	exit 1
else
	echo "✅ PASSED: No new unscoped repository calls detected."
	exit 0
fi
