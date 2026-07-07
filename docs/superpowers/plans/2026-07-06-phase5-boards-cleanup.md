# Phase 5: Boards Audit + Residual Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Final audit of 6 boards, cleanup /settings legacy routes, and verify /approvals cross-case inbox

**Architecture:** Phase 5 is primarily verification with targeted route cleanup. /settings sub-routes (7 files) duplicate /configuracion — parent already redirects, sub-routes are orphans. /approvals already redirects to /cumplimiento/approvals (real ApprovalHubPage). evidence-v2 already removed in Phase 1.

**Tech Stack:** TanStack Router file-based routing, apps/web/src

## Global Constraints

- Do NOT delete route files whose targets may still be linked — verify no imports first
- Every deleted route must maintain backward compatibility through existing redirects
- Guardrail (`bun run ci:forbidden-terms`) must pass after all changes
- Route tree must be regenerated after deletions

---

### Task 1: Delete 7 /settings/ sub-route files

**Files:**
- Delete: `apps/web/src/routes/settings/appearance.tsx`
- Delete: `apps/web/src/routes/settings/billing.tsx`
- Delete: `apps/web/src/routes/settings/index.tsx`
- Delete: `apps/web/src/routes/settings/integrations.tsx`
- Delete: `apps/web/src/routes/settings/notifications.tsx`
- Delete: `apps/web/src/routes/settings/organization.tsx`
- Delete: `apps/web/src/routes/settings/security.tsx`
- Modify: `apps/web/src/routes/settings.tsx` (keep — already redirects to /configuracion)
- Regenerate: `apps/web/src/routeTree.gen.ts` (via `cd apps/web && bun run build` or `vite build`)

**Interfaces:**
- Consumes: existing `/settings` parent route at `apps/web/src/routes/settings.tsx` (already has `throw redirect({ to: "/configuracion" })` in loader)
- Produces: clean route tree with no `/settings/` children

- [ ] **Step 1: Grep for imports from /settings sub-routes**

```bash
# Verify no feature files import these routes
rg -l "routes/settings/" apps/web/src/ --type ts --type tsx
# Expected: no results (empty)
```

- [ ] **Step 2: Delete the 7 files**

```bash
rm apps/web/src/routes/settings/appearance.tsx
rm apps/web/src/routes/settings/billing.tsx
rm apps/web/src/routes/settings/index.tsx
rm apps/web/src/routes/settings/integrations.tsx
rm apps/web/src/routes/settings/notifications.tsx
rm apps/web/src/routes/settings/organization.tsx
rm apps/web/src/routes/settings/security.tsx
```

- [ ] **Step 3: Regenerate route tree**

```bash
cd apps/web && bun run build
# This regenerates routeTree.gen.ts via vite build
```

- [ ] **Step 4: Verify route tree no longer has /settings/ children**

```bash
cd apps/web && rg "settings" src/routeTree.gen.ts
# Expected: only /settings (parent), no sub-routes
```

- [ ] **Step 5: Fast typecheck**

```bash
cd apps/web && bun run typecheck 2>&1 | head -20
# Expected: no errors (the parent /settings route still exists)
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/settings/ apps/web/src/routeTree.gen.ts
git commit -m "refactor: remove legacy /settings sub-routes (duplicate of /configuracion)"
```

---

### Task 2: Boards audit + approval-hub verification

**Files:**
- Verify: `apps/web/src/routes/approvals.tsx` (redirect to /cumplimiento/approvals — keep)
- Verify: `apps/web/src/routes/cumplimiento/approvals.tsx` (real route — keep)
- Verify: `apps/web/src/features/approval-hub/ApprovalHubPage.tsx` (real component — keep)
- Verify: evidence-v2 removal (rg "evidence-v2" — should be 0 hits)
- Verify: board routes exist (Ledger /ledger, Evidence /evidence, Invoices /invoices, Inventory /inventory, Compliance /compliance, Customers /customers, Vendors /vendors)
- Guardrail: `bun run ci:forbidden-terms`

**Interfaces:** N/A — pure verification

- [ ] **Step 1: Verify evidence-v2 fully removed**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra && rg -c "evidence-v2" apps/web/src/ | wc -l
# Expected: 0
```

- [ ] **Step 2: Verify approval-hub route works**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra && head -15 apps/web/src/routes/cumplimiento/approvals.tsx
# Expected: imports from ../../features/approval-hub/ApprovalHubPage
```

- [ ] **Step 3: Verify all 7 board routes exist**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra && for route in ledger evidence invoices inventory compliance customers vendors; do
  found=$(find apps/web/src/routes -name "${route}.tsx" | head -1)
  if [ -n "$found" ]; then echo "✅ /$route"; else echo "❌ /$route MISSING"; fi
done
```

- [ ] **Step 4: Guardrail check**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra && bun run ci:forbidden-terms
# Expected: "✅ No forbidden terms found" — exit 0
```

- [ ] **Step 5: Run typecheck**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra && bun run typecheck 2>&1 | tail -10
# Expected: no type errors
```

- [ ] **Step 6: Write audit report to .superpowers/sdd/phase5-audit.md**

Create `.superpowers/sdd/phase5-audit.md` with:
```markdown
# Phase 5 Audit Report

## Verification Results

| Check | Status |
|-------|--------|
| evidence-v2 removed | ✅ |
| /approvals redirects to /cumplimiento/approvals | ✅ |
| ApprovalHubPage component exists | ✅ |
| /ledger route | ✅ |
| /evidence route | ✅ |
| /invoices route | ✅ |
| /inventory route | ✅ |
| /compliance route | ✅ |
| /customers route | ✅ |
| /vendors route | ✅ |
| Typecheck passes | ✅ |
| Guardrail clean | ✅ |

## Residual Items
- [list any findings here]
```

- [ ] **Step 7: Commit**

```bash
git add .superpowers/sdd/phase5-audit.md
git commit -m "feat: complete Phase 5 boards audit and verification"
```

---

### Task 3: Sidebar cleanup to match target

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar/components/SidebarNavItems.tsx` or equivalent
- Verify: only target items (Ledger, Compliance, Aprobaciones, Clientes, Proveedores, Evidencia, Configuración, Control Tower) appear

**Interfaces:**
- Consumes: current sidebar nav items configuration
- Produces: cleaned sidebar matching the Phase 5 target

- [ ] **Step 1: Find current sidebar nav items**

```bash
cd /home/dreamcoder08/Documents/PROYECTOS/Drenyra && rg -l "showInSidebar\|navItems\|\"sidebar\"" apps/web/src/components/layout/ | head -10
```

- [ ] **Step 2: Read current sidebar items**

List all items currently shown, compare against target:
**Target items:** Ledger (/ledger), Compliance (/compliance), Aprobaciones (/approvals), Clientes (/customers), Proveedores (/vendors), Evidencia (/evidence), Configuración (/configuracion), Control Tower (/drenyra/control-tower)

**Items to hide/remove:** Invoices, Inventory, Banking, Bills, Cashflow, Taxation, Payroll, Skills, Automations (these become accessible only from within a case)

- [ ] **Step 3: Update sidebar configuration**

Set `showInSidebar: false` for items not in the target, or remove their entries from the nav items array. Keep route files intact — these items are still accessible within a case.

- [ ] **Step 4: Verify typecheck**

```bash
cd apps/web && bun run typecheck 2>&1 | tail -10
# Expected: no errors
```

- [ ] **Step 5: Commit**

```bash
git add <changed-files>
git commit -m "refactor: update sidebar to Phase 5 target (6 boards + settings + control tower)"
```
