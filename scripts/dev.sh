#!/usr/bin/env bash
# ─── Drenyra Dev Environment — Start API + Web ───────────────────────
# Usage: ./scripts/dev.sh          # Start both API and web
# Usage: ./scripts/dev.sh api      # API only
# Usage: ./scripts/dev.sh web      # Web only
# Usage: ./scripts/dev.sh clean    # Full clean + install + typecheck

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="/tmp/drenyra-dev.pids"

cleanup() {
  echo ""
  echo "⏹  Stopping Drenyra dev servers..."
  if [ -f "$PID_FILE" ]; then
    while read -r pid; do kill "$pid" 2>/dev/null || true; done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi
  echo "✅ Stopped"
}
trap cleanup EXIT INT TERM

start_api() {
  echo "📡 Starting API server..."
  cd "$ROOT/apps/api"
  DATABASE_URL="${DATABASE_URL:-postgresql://mock:mock@localhost:5432/mock}" \
  bun run dev &
  echo $! >> "$PID_FILE"
  echo "   API starting on http://localhost:3000"
  echo "   Swagger: http://localhost:3000/api/swagger"
}

start_web() {
  echo "🌐 Starting Web dev server..."
  cd "$ROOT/apps/web"
  bun run dev &
  echo $! >> "$PID_FILE"
  echo "   Web starting on http://localhost:5173"
}

run_clean() {
  echo "🧹 Full clean..."
  cd "$ROOT"
  
  # Remove bun cache from git tracking (common issue)
  git rm -r --cached '~/.bun/' 2>/dev/null || true
  
  # Reinstall
  bun install 2>&1 | tail -1
  
  # Typecheck
  bun run typecheck 2>&1 | tail -5
  
  # Run all tests
  echo "🧪 Running tests..."
  (cd packages/domain && npx vitest run --reporter=verbose 2>&1 | tail -3)
  (cd packages/infrastructure && bun test --filter "fiscal-agent" 2>&1 | tail -3)
  
  echo "✅ Clean complete"
}

case "${1:-all}" in
  api)     start_api ;;
  web)     start_web ;;
  clean)   run_clean ;;
  all)
    start_api
    sleep 3
    start_web
    echo ""
    echo "═══════════════════════════════════════════"
    echo "  Drenyra Dev Environment"
    echo "  API:  http://localhost:3000"
    echo "  Web:  http://localhost:5173"
    echo "  Docs: http://localhost:3000/api/swagger"
    echo "═══════════════════════════════════════════"
    echo ""
    echo "  Press Ctrl+C to stop all servers"
    echo ""
    wait
    ;;
  *)
    echo "Usage: $0 {api|web|all|clean}"
    exit 1
    ;;
esac
