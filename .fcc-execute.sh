#!/usr/bin/env bash
set -euo pipefail

echo "=== Step 0: Tracker PR ==="
git checkout feat/fcc-tracker
git push -u origin feat/fcc-tracker
gh pr create --base main --head feat/fcc-tracker --title "feat(fcc): command center reset — tracker PR" --body "Tracker PR for 6 chained PRs (cleanup → design-system → api-inbox → fiscal-features → agentic-shell → settings-misc)" --draft

echo "=== Step 1: Cleanup ==="
git checkout feat/fcc-cleanup
git stash pop
git add -A
git commit -m "feat(cleanup): remove dead code and legacy features"
git push -u origin feat/fcc-cleanup
gh pr create --base feat/fcc-tracker --head feat/fcc-cleanup --title "feat(cleanup): remove dead code and legacy features" --body "Delete CompareLoansView, fiscal-chat, payroll, review-queue + dead UI components. 35 files, +16/-2502."

echo "=== Step 2: Design System ==="
git checkout feat/fcc-design-system
git stash pop
git add -A
git commit -m "feat(design): add design system foundation and theme tokens"
git push -u origin feat/fcc-design-system
gh pr create --base feat/fcc-cleanup --head feat/fcc-design-system --title "feat(design): add design system foundation" --body "New design-system.css, theme-package refactor, index.css, Select component. 11 files, +545/-87."

echo "=== Step 3: API + Accounting Inbox ==="
git checkout feat/fcc-api-inbox
git stash pop
git add -A
git commit -m "feat(api): add accounting inbox API and feature"
git push -u origin feat/fcc-api-inbox
gh pr create --base feat/fcc-design-system --head feat/fcc-api-inbox --title "feat(api): add accounting inbox" --body "Dashboard routes, inbox service, full AccountingInbox component + tests. 10 files, +1390/-89."

echo "=== Step 4: Fiscal Features ==="
git checkout feat/fcc-fiscal-features
git stash pop
git add -A
git commit -m "feat(fiscal): add cierre mensual, reconciliations, and fiscal components"
git push -u origin feat/fcc-fiscal-features
gh pr create --base feat/fcc-api-inbox --head feat/fcc-fiscal-features --title "feat(fiscal): add fiscal features" --body "AgentMissionTimeline, FiscalRiskLayer, ClosePhaseStrip, TaxReviewGate, ReconciliationDiffView + cierre mensual refactor. 22 files, +2164/-149."

echo "=== Step 5: Agentic Shell ==="
git checkout feat/fcc-agentic-shell
git stash pop
git add -A
git commit -m "feat(shell): refactor agentic shell, sidebar, and command palette"
git push -u origin feat/fcc-agentic-shell
gh pr create --base feat/fcc-fiscal-features --head feat/fcc-agentic-shell --title "feat(shell): refactor agentic shell" --body "AgenticLayout, Sidebar nav items, CommandPalette, RightPanel, ThreadView. 12 files, +707/-340."

echo "=== Step 6: Settings + Misc ==="
git checkout feat/fcc-settings-misc
git stash pop
git add -A
git commit -m "feat(settings): refactor settings and polish misc features"
git push -u origin feat/fcc-settings-misc
gh pr create --base feat/fcc-agentic-shell --head feat/fcc-settings-misc --title "feat(settings): refactor settings and misc polish" --body "Settings refactor (19 files), command center updates, misc feature polish. 37 files, +542/-502."

echo ""
echo "✅ All PRs created!"
echo "⚠️  Remember: after ALL child PRs are merged to tracker:"
echo "   git checkout main && git merge feat/fcc-tracker && git push origin main"
