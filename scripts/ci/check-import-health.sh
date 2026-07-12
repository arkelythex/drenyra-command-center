#!/usr/bin/env bash
# Drenyra Import Health Checker
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASS=0
WARN=0
FAIL=0
ERRORS=()
pass() {
	PASS=$((PASS + 1))
	echo -e "  ${GREEN}OK${NC} $1"
}
warn() {
	WARN=$((WARN + 1))
	echo -e "  ${YELLOW}WW${NC} $1"
}
fail() {
	FAIL=$((FAIL + 1))
	echo -e "  ${RED}EE${NC} $1"
	ERRORS+=("$1")
}
header() { echo -e "\n${BOLD}$1${NC}"; }

echo -e "${CYAN}${BOLD}  Drenyra Import Health${NC}"
echo "  ---------------------------"

header "1. Barrel Exports"
for pkg in packages/domain/src packages/application/src packages/persistence/src packages/infrastructure/src packages/shared/src packages/ai/src packages/ui/src; do
	idx="$ROOT_DIR/$pkg/index.ts"
	if [ -f "$idx" ]; then
		exports=$(grep -c "^export" "$idx" 2>/dev/null || echo 0)
		pass "$pkg/index.ts -- $exports exports"
	else
		fail "$pkg/index.ts -- NO EXISTE"
	fi
done

header "2. Lazy Route Imports"
SRC="$ROOT_DIR/apps/web/src"
if [ -d "$SRC/routes" ]; then
	bad=0
	while IFS= read -r -d '' rf; do
		rname=$(basename "$rf")
		imports=$(grep -oP 'import\("\K[^"]+' "$rf" 2>/dev/null || true)
		[ -z "$imports" ] && continue
		while IFS= read -r imp; do
			case "$imp" in @/*) resolved="$SRC/${imp#@/}" ;; *) resolved="$(dirname "$rf")/$imp" ;; esac
			ok=false
			for ext in .tsx .ts /index.tsx /index.ts; do [ -f "${resolved}${ext}" ] && {
				ok=true
				break
			} || true; done
			if [ "$ok" = true ]; then pass "$rname -> $imp"; else
				fail "$rname -> $imp -- NO ENCONTRADO"
				bad=1
			fi
		done <<<"$imports"
	done < <(find "$SRC/routes" -name "*.tsx" -not -path "*/__tests__/*" -print0)
	[ "$bad" = 0 ] && pass "Todos los imports resuelven"
fi

header "3. Package Boundaries"
grep -qE '@drenyra/(persistence|infrastructure|application)' "$ROOT_DIR/packages/domain/package.json" 2>/dev/null && fail "domain depende de capas superiores" || pass "domain -- OK"
grep -qE '@drenyra/(persistence|infrastructure)' "$ROOT_DIR/packages/application/package.json" 2>/dev/null && fail "application depende de persistence/infra" || pass "application -- OK"

echo ""
echo -e "${BOLD}----------------------------------${NC}"
total=$((PASS + WARN + FAIL))
[ $FAIL -eq 0 ] && echo -e "  ${GREEN}OK ${PASS}/${total}${NC}" && exit 0
echo -e "  ${RED}EE ${PASS}/${total} -- ${FAIL} errors${NC}"
for err in "${ERRORS[@]}"; do echo "    - $err"; done
exit 1
