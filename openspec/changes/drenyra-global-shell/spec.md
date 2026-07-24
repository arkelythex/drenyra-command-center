# SDD Spec — drenyra-global-shell

## 1. Changes

### 1.1 `__root.tsx`

- Import `AgenticLayout` from `@/components/agentic-shell/AgenticLayout`
- Wrap `<Outlet />` in `<AgenticLayout>`
- `AgenticLayout` internamente provee `FiscalInspectorProvider`, sidebar, right panel, command palette

### 1.2 `drenyra.tsx`

- Remove `AgenticLayout` import
- Change to simple route component that renders `<Outlet />` for child routes
- Or make `/drenyra/` render directly (simplest: remove lazy AgenticLayout, render Outlet)

### 1.3 `cierre-mensual.tsx`

- Remove `FiscalInspectorProvider` wrapper (AgenticLayout lo provee)
- Route component renders `CierreMensualPage` directly

### 1.4 `index.tsx`

- Remove `FiscalInspectorProvider` wrapper
- Route component renders `AccountingInbox` directly

### 1.5 `routeTree.gen.ts`

- Regeneración automática con `bun run dev` (TanStack Router codegen)
- No se modifica manualmente

## 2. Verification

```bash
bun run typecheck
# Navigate to /, /cierre-mensual, /drenyra — all should show sidebar
# /drenyra/* should NOT show nested sidebar
```
