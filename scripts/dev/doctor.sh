#!/usr/bin/env bash
# Drenyra Doctor — Diagnóstico del entorno de desarrollo
# Uso: bun run doctor
# Versión: 1.0.0
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PASS=0 WARN=0 FAIL=0

green='\033[0;32m'
yellow='\033[1;33m'
red='\033[0;31m'
cyan='\033[0;36m'
bold='\033[1m'
nc='\033[0m'

pass() {
	PASS=$((PASS + 1))
	echo -e "  ${green}✅${nc} $1"
}
warn() {
	WARN=$((WARN + 1))
	echo -e "  ${yellow}⚠️${nc} $1"
}
fail() {
	FAIL=$((FAIL + 1))
	echo -e "  ${red}❌${nc} $1"
}
info() { echo -e "  ${cyan}ℹ️${nc} $1"; }

header() { echo -e "\n${bold}$1${nc}"; }

show_help() {
	cat <<'EOF'
Drenyra Doctor — Diagnóstico del entorno de desarrollo

Uso:  bun run doctor [flags]

Flags:
  --help, -h    Muestra esta ayuda
  --ci          Modo CI: output JSON, exit code estricto
EOF
	exit 0
}

# Parse flags
CI_MODE=false
for arg in "$@"; do
	case "$arg" in
	--help | -h) show_help ;;
	--ci) CI_MODE=true ;;
	esac
done

cd "$ROOT_DIR"

echo -e "${cyan}${bold}  Drenyra Doctor v1.0.0${nc}"
echo "  ─────────────────────"

header "🔧 Tools"
if command -v bun &>/dev/null; then
	ver=$(bun --version 2>/dev/null || echo "unknown")
	if [[ "$(printf '%s\n' "1.3" "$ver" | sort -V | head -n1)" = "1.3" ]] || [[ "$ver" == "1.3"* ]]; then
		pass "Bun $ver (>=1.3.0)"
	else
		warn "Bun $ver (<1.3.0 — puede haber problemas)"
	fi
else
	fail "Bun no instalado (https://bun.sh)"
fi

if command -v docker &>/dev/null; then
	dver=$(docker --version 2>/dev/null | grep -oP '\d+\.\d+' | head -1 || echo "?")
	if docker info &>/dev/null; then
		pass "Docker $dver (running)"
	else
		fail "Docker $dver (no está corriendo el daemon)"
	fi
else
	fail "Docker no instalado"
fi

if [ -d "$ROOT_DIR/apps/cli" ] && command -v go &>/dev/null; then
	gver=$(go version 2>/dev/null | grep -oP 'go\S+' || echo "unknown")
	pass "Go $gver"
elif [ -d "$ROOT_DIR/apps/cli" ]; then
	warn "Go no instalado (necesario para CLI)"
fi

if [ -d "$ROOT_DIR/apps/data-engine" ] && command -v python3 &>/dev/null; then
	pver=$(python3 --version 2>/dev/null || echo "unknown")
	pass "Python $pver"
elif [ -d "$ROOT_DIR/apps/data-engine" ]; then
	warn "Python3 no instalado (necesario para data-engine)"
fi

header "🐳 Docker Containers"
REQUIRED_CONTAINERS=("drenyra-db" "drenyra-engram" "drenyra-nats")
OPTIONAL_CONTAINERS=("drenyra-redis")

for container in "${REQUIRED_CONTAINERS[@]}"; do
	if docker container inspect "$container" &>/dev/null &&
		[[ "$(docker container inspect -f '{{.State.Running}}' "$container")" == "true" ]]; then
		pass "$container — running"
	else
		fail "$container — no encontrado o no corriendo"
	fi
done

for container in "${OPTIONAL_CONTAINERS[@]}"; do
	if docker container inspect "$container" &>/dev/null &&
		[[ "$(docker container inspect -f '{{.State.Running}}' "$container")" == "true" ]]; then
		pass "$container — running"
	else
		warn "$container — no encontrado (usando host si aplica)"
	fi
done

header "📡 Services"
# PostgreSQL
if command -v pg_isready &>/dev/null; then
	if pg_isready -h localhost -p 5436 -U user -d drenyra &>/dev/null 2>&1; then
		pass "PostgreSQL — conectable (:5436)"
	else
		# Try arkelythex (old name)
		if pg_isready -h localhost -p 5436 -U user -d arkelythex &>/dev/null 2>&1; then
			pass "PostgreSQL — conectable (:5436, db: arkelythex)"
		else
			fail "PostgreSQL — no responde (:5436)"
		fi
	fi
elif docker exec drenyra-db pg_isready -U user &>/dev/null 2>&1; then
	pass "PostgreSQL — conectable (via docker)"
else
	fail "PostgreSQL — no responde"
fi

# Engram
if curl -sf http://localhost:8733/health >/dev/null 2>&1; then
	pass "Engram — saludable (:8733)"
else
	fail "Engram — no responde (:8733)"
fi

# API
if curl -sf http://localhost:3000/health/live >/dev/null 2>&1; then
	pass "API — respondiendo (:3000)"
else
	warn "API — no responde (:3000, ejecutar: bun run dev:api)"
fi

# Web
if curl -sf -o /dev/null http://localhost:5174/ 2>/dev/null; then
	pass "Web — respondiendo (:5174)"
else
	warn "Web — no responde (:5174, ejecutar: bun run dev:web)"
fi

header "🔌 Ports"
for port_info in "5436:PostgreSQL" "6379:Redis" "4222:NATS" "3000:API" "5174:Web"; do
	port="${port_info%%:*}"
	name="${port_info##*:}"
	if ss -tlnp "sport = :$port" 2>/dev/null | grep -q ":$port" ||
		lsof -i :"$port" &>/dev/null 2>&1; then
		# Determine if it's docker or host
		if docker ps --format '{{.Names}}' 2>/dev/null | grep -q .; then
			pass ":$port — $name (en uso)"
		else
			pass ":$port — $name (en uso)"
		fi
	else
		warn ":$port — $name (libre)"
	fi
done

header "📋 Environment"
if [ -f "$ROOT_DIR/.env" ]; then
	pass ".env presente"
	# Check required vars
	required_vars=("DATABASE_URL" "BETTER_AUTH_URL" "WEB_PORT")
	missing_vars=()
	for var in "${required_vars[@]}"; do
		if grep -q "^${var}=" "$ROOT_DIR/.env" 2>/dev/null; then
			: # ok
		else
			missing_vars+=("$var")
		fi
	done
	if [ ${#missing_vars[@]} -eq 0 ]; then
		pass "${#required_vars[@]}/${#required_vars[@]} variables requeridas presentes"
	else
		warn "Faltan: ${missing_vars[*]}"
	fi
	# Count total
	total_vars=$(grep -c '^[A-Z_]\+=' "$ROOT_DIR/.env" 2>/dev/null || echo 0)
	info "$total_vars variables totales en .env"
else
	fail ".env no encontrado"
fi

header "📦 Dependencies"
if [ -d "$ROOT_DIR/node_modules" ]; then
	pass "node_modules — instalado"
else
	fail "node_modules — no instalado (ejecutar: bun install)"
fi

if [ -d "$ROOT_DIR/apps/data-engine/.venv" ]; then
	pass "data-engine .venv — instalado"
elif [ -d "$ROOT_DIR/apps/data-engine" ]; then
	warn "data-engine .venv — no encontrado"
fi

header "📄 Git"
if git rev-parse --git-dir &>/dev/null 2>&1; then
	branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
	pass "Git repo — branch: $branch"

	# Check lefthook or .git/hooks
	if [ -f "$ROOT_DIR/.git/hooks/pre-commit" ] || command -v lefthook &>/dev/null; then
		pass "Git hooks — instalados"
	else
		warn "Git hooks — no encontrados"
	fi
else
	fail "No es un repo git"
fi

# Resumen
echo ""
echo -e "${bold}─────────────────────────────────${nc}"
total=$((PASS + WARN + FAIL))
if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
	echo -e "  ${green}✅ $PASS/$total — Todo ok${nc}"
elif [ $FAIL -eq 0 ]; then
	echo -e "  ${yellow}⚠️  $PASS pass · $WARN warnings · $FAIL errors${nc}"
else
	echo -e "  ${red}❌ $PASS pass · $WARN warnings · $FAIL errors${nc}"
fi
echo ""

if [ "$CI_MODE" = true ]; then
	[ $FAIL -gt 0 ] && exit 1
fi
exit 0
