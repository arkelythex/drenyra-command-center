#!/usr/bin/env bash
# Drenyra Quickstart — Setup de 0 a dev server
# Uso: bash scripts/dev/quickstart.sh [flags]
# Versión: 1.0.0
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKIP_DB=false
SKIP_DOCKER=false
CI_MODE=false

green='\033[0;32m'
yellow='\033[1;33m'
red='\033[0;31m'
cyan='\033[0;36m'
bold='\033[1m'
nc='\033[0m'

ok() { echo -e "  ${green}✅${nc} $1"; }
skip() { echo -e "  ${yellow}⏭️${nc} $1"; }
info() { echo -e "  ${cyan}ℹ️${nc} $1"; }

show_help() {
	cat <<'EOF'
Drenyra Quickstart — Setup de 0 a dev server

Uso: bash scripts/dev/quickstart.sh [flags]

Flags:
  --no-db       Skip database push + seed
  --no-docker   Skip docker compose up
  --ci          Non-interactive, fail on first error
  --help, -h    Muestra esta ayuda
EOF
	exit 0
}

for arg in "$@"; do
	case "$arg" in
	--no-db) SKIP_DB=true ;;
	--no-docker) SKIP_DOCKER=true ;;
	--ci) CI_MODE=true ;;
	--help | -h) show_help ;;
	esac
done

cd "$ROOT_DIR"

echo -e "${cyan}${bold}  🚀 Drenyra Quickstart v1.0.0${nc}"
echo "  ─────────────────────────"

# 1. Check prerequisites
echo -e "\n${bold}🔧 Prerequisites${nc}"
if command -v docker &>/dev/null; then
	ok "Docker instalado"
else
	echo -e "  ${red}❌${nc} Instalá Docker primero"
	exit 1
fi

if command -v bun &>/dev/null; then
	ok "Bun $(bun --version) instalado"
else
	echo -e "  ${red}❌${nc} Instalá Bun: curl -fsSL https://bun.sh/install | bash"
	exit 1
fi

# 2. Install dependencies
echo -e "\n${bold}📦 Instalando dependencias${nc}"
bun install
ok "Dependencias instaladas"

# 3. Start infrastructure
if [ "$SKIP_DOCKER" = false ]; then
	echo -e "\n${bold}🐳 Levantando servicios Docker${nc}"
	if docker compose ps --services --filter "status=running" 2>/dev/null | grep -q "drenyra-db"; then
		skip "Servicios Docker ya estaban corriendo"
	else
		docker compose up -d postgres drenyra-engram nats
		ok "Servicios Docker levantados"
	fi
else
	skip "Docker skip (flag --no-docker)"
fi

# 4. Wait for PostgreSQL
echo -e "\n${bold}⏳ Esperando PostgreSQL${nc}"
if command -v pg_isready &>/dev/null; then
	for i in $(seq 1 15); do
		if pg_isready -h localhost -p 5436 -U user &>/dev/null 2>&1; then
			ok "PostgreSQL listo"
			break
		fi
		if [ $i -eq 15 ]; then
			echo -e "  ${red}❌${nc} PostgreSQL no respondió después de 15s"
			exit 1
		fi
		sleep 2
	done
else
	sleep 8
	info "Verificación de PostgreSQL saltada (pg_isready no disponible)"
fi

# 5. Push DB schema
if [ "$SKIP_DB" = false ]; then
	echo -e "\n${bold}🗄️  Aplicando schema de base de datos${nc}"
	bun run db:push
	ok "Schema aplicado"

	# 6. Seed demo user
	echo -e "\n${bold}👤 Creando usuario demo${nc}"
	if [ -f "$ROOT_DIR/scripts/create-admin-user.ts" ]; then
		bun run auth:bootstrap:demo
		ok "Usuario demo creado"
	else
		info "Script de seed no encontrado — crear usuario manualmente"
	fi
else
	skip "DB skip (flag --no-db)"
fi

# 7. Done
echo ""
echo -e "${green}${bold}  ✅ Todo listo.${nc}"
echo ""
echo "  Para arrancar el stack de desarrollo:"
echo ""
echo "    ${cyan}bun run dev:api${nc}    # API en http://localhost:3000"
echo "    ${cyan}bun run dev:web${nc}    # Web en http://localhost:5174"
echo ""
echo "  Para verificar el entorno:"
echo ""
echo "    ${cyan}bun run doctor${nc}     # Diagnóstico completo"
echo ""
