#!/usr/bin/env bash
# Drenyra Bundle Report
# Uso: bun run perf:bundle
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WEB_DIST="$ROOT_DIR/apps/web/dist"

if [ ! -d "$WEB_DIST" ]; then
	echo "❌ No dist found. Build first: cd apps/web && bun run build"
	exit 1
fi

echo "📦 Drenyra Bundle Report"
echo "========================"
echo ""
echo "Total size: $(du -sh "$WEB_DIST" | cut -f1)"

echo ""
echo "Top assets:"
find "$WEB_DIST/assets" -name "*.js" -o -name "*.css" 2>/dev/null | while read -r f; do
	size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
	if [ "$size" -gt 10000 ]; then
		human=$(echo "scale=1; $size/1024" | bc 2>/dev/null || echo "${size}B")
		echo "  $human KB  $(basename "$f")"
	fi
done | sort -rn | head -10

echo ""
echo "Asset count:"
echo "  JS files:  $(find "$WEB_DIST/assets" -name '*.js' 2>/dev/null | wc -l)"
echo "  CSS files: $(find "$WEB_DIST/assets" -name '*.css' 2>/dev/null | wc -l)"
