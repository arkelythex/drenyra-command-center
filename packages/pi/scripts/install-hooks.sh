#!/usr/bin/env bash
# @drenyra/pi — Install fiscal pre-commit hooks
# Installs a pre-commit hook that validates accounting invariants.

set -euo pipefail

HOOK_DIR="$(git rev-parse --git-dir 2>/dev/null)/hooks"
if [ -z "$HOOK_DIR" ] || [ "$HOOK_DIR" = "/hooks" ]; then
  echo "❌ Not in a git repository"
  exit 1
fi

HOOK_FILE="$HOOK_DIR/pre-commit"

cat > "$HOOK_FILE" << 'HOOK'
#!/usr/bin/env bash
# @drenyra/pi — Fiscal pre-commit hook
# Validates accounting invariants before each commit.

set -euo pipefail

echo "  ╔══════════════════════════════════════╗"
echo "  ║  @drenyra/pi Fiscal Gate             ║"
echo "  ╚══════════════════════════════════════╝"

# Check 1: No float money values in staged changes
if git diff --cached -G'\b(amount|precio|monto|total|igv)\s*[:=]\s*\d+\.\d+' -- '*.ts' '*.js' | grep -q .; then
  echo "  ❌ FAIL: Float money values detected in staged changes."
  echo "     Use BigInt (cents): 1500n instead of 15.00"
  exit 1
fi

# Check 2: RUC scope in SQL queries
if git diff --cached -G'(SELECT|INSERT|UPDATE|DELETE).*(FROM|INTO).*' -- '*.ts' '*.sql' | grep -v 'ruc.*=.*:ruc\|WHERE.*ruc' | grep -q .; then
  echo "  ⚠️  WARNING: SQL changes without explicit RUC filter detected."
  echo "     Verify tenant isolation is in place."
fi

# Check 3: No console.log in production code
if git diff --cached -G'console\.(log|debug)' -- '*.ts' -- ':(exclude)*.test.ts' -- ':(exclude)*/__tests__/*' | grep -q .; then
  echo "  ⚠️  WARNING: console.log/debug in production code."
fi

echo "  ✅ Fiscal gate passed"
HOOK

chmod +x "$HOOK_FILE"
echo "✅ Pre-commit hook installed: $HOOK_FILE"
