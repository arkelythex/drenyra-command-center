#!/bin/bash
# Arkelythex Skills Setup Script
# Sincroniza skills a OpenCode, Claude, y otros asistentes AI

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🔧 Arkelythex Skills Setup${NC}"
echo "========================"

# Funciones de ayuda
show_help() {
    echo "Uso: $0 [opción]"
    echo ""
    echo "Opciones:"
    echo "  --opencode      Sincronizar skills a ~/.opencode/skills/"
    echo "  --claude        Sincronizar skills a ~/.claude/skills/"
    echo "  --all           Sincronizar a todos los asistentes"
    echo "  --help          Mostrar esta ayuda"
    echo ""
    echo "Sin argumentos: Mostrar información del proyecto"
}

# Info del proyecto
show_info() {
    echo -e "${GREEN}📋 Información del Proyecto:${NC}"
    echo ""
    echo "Nombre: Arkelythex Landing"
    echo "Tipo: Next.js 15 + React 19 + TypeScript"
    echo ""
    echo -e "${YELLOW}Skills disponibles:${NC}"
    ls -1 "$PROJECT_ROOT/.opencode/skills/" | grep "^arkelythex-" | sed 's/^/  - /'
    echo ""
    echo -e "${BLUE}Para sincronizar, ejecuta:${NC}"
    echo "  ./skills/setup.sh --opencode"
    echo "  ./skills/setup.sh --claude"
    echo "  ./skills/setup.sh --all"
}

# Sincronizar a OpenCode
sync_opencode() {
    echo -e "${BLUE}🔄 Sincronizando a OpenCode...${NC}"
    
    local opencode_dir="$HOME/.opencode/skills"
    mkdir -p "$opencode_dir"
    
    # Copiar skills de Arkelythex
    for skill in "$PROJECT_ROOT"/.opencode/skills/arkelythex-*; do
        if [ -d "$skill" ]; then
            skill_name=$(basename "$skill")
            echo "  Copiando $skill_name..."
            rm -rf "$opencode_dir/$skill_name"
            cp -r "$skill" "$opencode_dir/"
        fi
    done
    
    echo -e "${GREEN}✅ Skills sincronizadas a ~/.opencode/skills/${NC}"
    echo ""
    echo "Las siguientes skills están disponibles globalmente:"
    ls -1 "$opencode_dir" | grep "^arkelythex-" | sed 's/^/  ✓ /'
}

# Sincronizar a Claude
sync_claude() {
    echo -e "${BLUE}🔄 Sincronizando a Claude...${NC}"
    
    local claude_dir="$HOME/.claude/skills"
    mkdir -p "$claude_dir"
    
    # Copiar skills de Arkelythex
    for skill in "$PROJECT_ROOT"/.opencode/skills/arkelythex-*; do
        if [ -d "$skill" ]; then
            skill_name=$(basename "$skill")
            echo "  Copiando $skill_name..."
            rm -rf "$claude_dir/$skill_name"
            cp -r "$skill" "$claude_dir/"
        fi
    done
    
    echo -e "${GREEN}✅ Skills sincronizadas a ~/.claude/skills/${NC}"
}

# Sincronizar a todos
sync_all() {
    sync_opencode
    sync_claude
    
    echo ""
    echo -e "${GREEN}🎉 Sincronización completada en todos los asistentes!${NC}"
}

# Main
case "${1:-}" in
    --opencode)
        sync_opencode
        ;;
    --claude)
        sync_claude
        ;;
    --all)
        sync_all
        ;;
    --help|-h)
        show_help
        ;;
    "")
        show_info
        ;;
    *)
        echo -e "${RED}❌ Opción desconocida: $1${NC}"
        show_help
        exit 1
        ;;
esac
