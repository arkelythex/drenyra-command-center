#!/usr/bin/env sh
# ODD guard — rejects legacy SDD/OpenSpec workflow artifacts and tracked build output.
# ODD (Gentle AI v4) is the only development workflow. When something still reaches for
# SDD, this check fails with a clear message and the paths that are available instead.
set -eu

fail=0
report() {
  fail=1
  printf '\n✖ %s\n' "$1"
  shift
  for line in "$@"; do printf '    %s\n' "$line"; done
}

# 1. openspec/ must not come back.
if [ -d openspec ] || [ -n "$(git ls-files openspec 2>/dev/null | head -1)" ]; then
  report "openspec/ is retired: SDD and OpenSpec no longer exist in Drenyra." \
    "Do this instead:" \
    "  - simple work: do it directly (branch + atomic commit)" \
    "  - uncertain work: investigate first and note what you learned" \
    "  - large work: write odd/tasks/<task>.md (objective, scope, out of scope, constraints)" \
    "  - critical work: test-first + high-risk review (see docs/10-development/odd-workflow.md)" \
    "History is in git: git show d428534:openspec/<path>"
fi

# 2. No SDD automation workflows.
sdd_workflows="$(git ls-files '.github/workflows/*sdd*' 2>/dev/null || true)"
if [ -n "$sdd_workflows" ]; then
  report "SDD workflow files are retired:" $sdd_workflows \
    "Use ODD: odd/tasks/<task>.md documents the work; CI gates stay in ci.yml and quality-gates.yml."
fi

# 2b. Scope policy: this repo is the Accounting Command Center (see AGENTS.md).
if [ -n "$(git ls-files products 2>/dev/null | head -1)" ]; then
  report "products/ is not allowed: non-accounting products must live in their own repo." \
    "Do this instead:" \
    "  - extract it with history: git subtree split -P products/<name> -b extract/<name>" \
    "    then push that branch to a new repository (see odd/tasks/gentle-ai-v4-migration.md)" \
    "  - or archive it outside this repo; never grow inside drenyra-command-center"
fi

# 3. No compiled output committed next to TypeScript sources (it shadows .ts in tests).
shadow=""
for f in $(git ls-files 'packages/*/src/*' 'packages/*/src/**/*' 'apps/*/src/*' 'apps/*/src/**/*' 2>/dev/null | grep -E '\.(js|d\.ts)$' || true); do
  b="${f%.d.ts}"; b="${b%.js}"
  if [ -f "$b.ts" ] || [ -f "$b.tsx" ]; then shadow="$shadow $f"; fi
done
if [ -n "$shadow" ]; then
  report "Compiled .js/.d.ts committed next to .ts sources (they shadow the real code in tests):" $shadow \
    "Remove them (git rm) and build into dist/ instead."
fi

if [ "$fail" -ne 0 ]; then
  printf '\nODD guard failed. Nothing is blocked for good: pick one of the paths above.\n' >&2
  exit 1
fi
echo "[odd-guard] ✅ ODD is the only workflow; no legacy SDD/OpenSpec or shadowing build output."
