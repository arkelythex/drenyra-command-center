#!/usr/bin/env bash
set -euo pipefail

# Design tokens compliance check for Drenyra web.
# Replaces the ESLint-based design-tokens plugin.
# Uses ripgrep (rg) for fast, native pattern matching.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TARGET_DIR="${PROJECT_ROOT}/apps/web/src"
HAS_ERROR=false

# ── Check 1: Off-brand Tailwind colors ────────────────────────────────
# Disallow direct Tailwind color palette classes (blue, indigo, violet, etc.)
# Use CSS custom properties (--color-*, var(--surface-*)) instead.
OFF_BRAND_PATTERN='\b(?:text|bg|border|ring|fill|stroke)-(?:blue|indigo|violet|purple|pink|rose|sky|cyan|teal|emerald|lime|fuchsia)-\d{2,3}\b'
matches=$(rg -n --type-add 'web:*.{ts,tsx}' -t web -e "${OFF_BRAND_PATTERN}" "${TARGET_DIR}" 2>/dev/null || true)
if [ -n "${matches}" ]; then
	echo "❌ Off-brand Tailwind colors — use design tokens (--color-*, var(--surface-*)) instead:"
	echo "${matches}"
	HAS_ERROR=true
fi

# ── Check 2: Decorative backdrop-blur (Fiscal Editorial) ──────────────
# Deprecated — use SurfacePanel / flat editorial surfaces.
BLUR_PATTERN='\bbackdrop-blur-(?:glass|sm|md|lg|xl|2xl|3xl)\b'
matches=$(rg -n --type-add 'web:*.{ts,tsx}' -t web -e "${BLUR_PATTERN}" "${TARGET_DIR}" 2>/dev/null || true)
if [ -n "${matches}" ]; then
	echo "⚠️  Decorative backdrop-blur is deprecated — use SurfacePanel / flat editorial surfaces:"
	echo "${matches}"
fi

# ── Check 3: Deprecated glass surface imports ─────────────────────────
# GlassCard/LiquidGlass are deprecated — use SurfacePanel.
for pattern in "@/components/ui/glass-card" "@/components/ui/liquid-glass"; do
	matches=$(rg -n -F "${pattern}" "${TARGET_DIR}" 2>/dev/null || true)
	if [ -n "${matches}" ]; then
		echo "❌ Deprecated glass surface import found — use SurfacePanel from @/components/ui/SurfacePanel:"
		echo "${matches}"
		HAS_ERROR=true
	fi
done

if [ "${HAS_ERROR}" = true ]; then
	exit 1
fi

echo "✅ Design tokens check passed"
