#!/usr/bin/env bash
set -euo pipefail

# Drenyra CLI Release Script
# Builds native binaries for Linux x64 and macOS ARM64,
# computes SHA256 for Homebrew formula, and prints release instructions.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VERSION=$(grep '"version"' "${PROJECT_ROOT}/package.json" | head -1 | sed 's/.*"version": "\(.*\)",/\1/')

echo "🔨 Building Drenyra CLI v${VERSION}..."
echo ""

# Linux x64
echo "==> Linux x86_64..."
bun build --compile "${PROJECT_ROOT}/src/index.ts" \
	--outfile "${PROJECT_ROOT}/drenyra-linux" \
	--target bun-linux-x64 2>&1 | tail -1
LINUX_SHA=$(sha256sum "${PROJECT_ROOT}/drenyra-linux" | cut -d' ' -f1)
echo "    SHA256: ${LINUX_SHA}"

# macOS ARM64
echo "==> macOS ARM64..."
bun build --compile "${PROJECT_ROOT}/src/index.ts" \
	--outfile "${PROJECT_ROOT}/drenyra-macos" \
	--target bun-darwin-arm64 2>&1 | tail -1
MACOS_SHA=$(sha256sum "${PROJECT_ROOT}/drenyra-macos" | cut -d' ' -f1)
echo "    SHA256: ${MACOS_SHA}"

echo ""
echo "📦 Release artifacts:"
echo "  - drenyra-linux (${LINUX_SHA})"
echo "  - drenyra-macos (${MACOS_SHA})"
echo ""
echo "📝 Update homebrew/drenyra.rb with these SHA256 values before tagging."
echo ""
echo "🏷️  To publish:"
echo "  gh release create v${VERSION} ./drenyra-linux ./drenyra-macos --title \"v${VERSION}\""
