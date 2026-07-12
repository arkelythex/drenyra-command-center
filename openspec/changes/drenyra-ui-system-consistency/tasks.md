# Tasks: UI System Consistency

**Change**: `drenyra-ui-system-consistency`
**Date**: 2026-07-12
**Based on**: design.md

## Review Workload Forecast

- **Estimated total lines**: ~2500
- **Chained PRs recommended**: Yes (5 PRs)
- **400-line budget risk**: High — each PR is ~400-500 lines
- **Decision needed before apply**: No (auto-forecast: chain approved)
- **Hot paths**: MainLayoutShell, Sidebar, PageShell (used by ALL pages)

## Task Groups

### Group 1: Design System Foundation — PR #1 (~450 lines)

- [ ] `1.1` Extend design tokens: add radius-sm/md/lg/xl/2xl to `src/lib/design-tokens/tokens.dtcg.json`
- [ ] `1.2` Regenerate CSS from tokens: run `bun tokens:generate`
- [ ] `1.3` Refactor `PageShell` (`src/components/ui/PageShell.tsx`):
  - Replace 4 variants with 3: `focal` (max-w-3xl), `operativo` (flex + rail), `data-heavy` (full + padding)
  - Add `aside?: boolean` prop for right rail reservation
  - Add radius tokens to default classes
- [ ] `1.4` Create `BORDER_RADIUS` constants or add to design tokens lib
- [ ] `1.5` Update all route page components to use new PageShell variants (check ~47 route files)
- [ ] `1.6` Verify CI: `bun run typecheck && bun run lint && bun run test:run`

### Group 2: Sidebar + Composer — PR #2 (~500 lines)

- [ ] `2.1` Create `SidebarSection` component (`src/components/layout/Sidebar/components/SidebarSection.tsx`):
  - Collapsible with disclosure arrow
  - Accepts items array, label, defaultCollapsed
- [ ] `2.2` Refactor `Sidebar.data.ts`:
  - Replace `SIDEBAR_NAV_ITEMS` with `SIDEBAR_SECTIONS` array
  - Define TRABAJO / ÁREAS / Cierres activos / Recientes / Sistema sections
- [ ] `2.3` Refactor `Sidebar.tsx`:
  - Use `SIDEBAR_SECTIONS` + `SidebarSection`
  - Replace `SidebarNavItems` usage with sections
  - Keep `SidebarSearch` and `SidebarCaseList` as-is
- [ ] `2.4` Delete `SidebarNavItems.tsx` (replaced by SidebarSection)
- [ ] `2.5` Refactor `SidebarFooter.tsx`:
  - Compact: user avatar + name + settings + "● 3 agentes activos" indicator
  - Move company/period info to TopBar
- [ ] `2.6` Add `composerMode` to route meta (create utility hook `useComposerMode`):
  - `src/hooks/useComposerMode.ts` — reads route meta from router state
- [ ] `2.7` Refactor `MainLayoutShell.tsx`:
  - Read `composerMode` from useComposerMode
  - Pass to Composer component
- [ ] `2.8` Refactor `Composer.tsx`:
  - Accept `mode: ComposerMode` prop
  - `hidden`: render null
  - `compact`: single-line input + send button only
  - `expanded`: full controls (current behavior)
- [ ] `2.9` Refactor `ComposerControls.tsx`:
  - Only render in `expanded` mode
- [ ] `2.10` Set composerMode on routes:
  - `/inbox`, `/review-queue`, `/approvals`, `/drenyra/*`: expanded
  - `/dashboard`, `/invoices`, `/compliance`, `/control-tower`, `/banking`: compact
  - `/settings/*`, `/audit`: hidden
- [ ] `2.11` Verify CI: `bun run typecheck && bun run lint && bun run test:run`

### Group 3: Inbox + Empty States — PR #3 (~400 lines)

- [ ] `3.1` Refactor `InboxPage.tsx`:
  - Reduce dropzone height 30% (from min-h-[180px] to ~120px, p-10 → p-6)
  - Remove "Sin archivos cargados" text
  - Replace button variant to standard outline
- [ ] `3.2` Refactor `InboxUploadZone.tsx`:
  - Reduce min-h from 180px to 120px
  - Reduce padding
  - Remove example file list or make it optional
- [ ] `3.3` Add "Actividad reciente" section below dropzone in empty state:
  - Static placeholder that shows last processed batches
  - Wire to backend data when available
- [ ] `3.4` Add error recovery UI to expedientes page (`features/expedientes/`):
  - "No pudimos cargar los expedientes. [Reintentar]"
  - "Ver detalles técnicos" only for advanced users
- [ ] `3.5` Ensure all loading/error states across the app have actionable recovery:
  - At minimum: retry button on API errors
  - "Ver detalles" for technical users
- [ ] `3.6` Verify CI: `bun run typecheck && bun run lint && bun run test:run`

### Group 4: Control Tower + Facturas — PR #4 (~500 lines)

- [ ] `4.1` Rename Control Tower to Centro de Operaciones:
  - Rename `src/routes/drenyra/control-tower.tsx` → `centro-de-operaciones.tsx`
  - Rename `src/features/control-tower/` → `src/features/centro-de-operaciones/`
  - Rename component `ControlTowerPage` → `CentroDeOperacionesPage`
  - Update link in sidebar data (old routes: add redirect)
  - Update `Sidebar.data.ts` label and icon
- [ ] `4.2` Add redirect from old `/drenyra/control-tower` to `/drenyra/centro-de-operaciones`
- [ ] `4.3` Fix Buzón SOL message in `ControlTowerPage.tsx`:
  - Replace technical variable with human-readable message
  - Add [Configurar conexión] action button
- [ ] `4.4` Improve company grid: show detail view when only 1 company
- [ ] `4.5` Refactor invoices board styling:
  - Reduce border width: 2px → 1px (use `border-subtle`)
  - Reduce typography weight: semibold → medium for labels, bold → semibold for values
  - Reduce metric font-size by ~15%
  - Replace uppercase tracking-wider with normal
  - Standardize toolbar height/spacing
  - Reduce "Nueva factura" button size
- [ ] `4.6` Verify CI: `bun run typecheck && bun run lint && bun run test:run`

### Group 5: Pipeline + Naming + Polish — PR #5 (~350 lines)

- [ ] `5.1` Compress cierre pipeline:
  - Convert from card-based to horizontal band (compact)
  - Show phase name + dot progress bar
  - Current phase label with count beneath
  - Reduce height from ~200px to ~80px
- [ ] `5.2` Replace "Gate Fiscal" block with status line:
  - "Antes de declarar: 4/6 verificaciones completadas"
  - Collapsible to detail view
- [ ] `5.3` Naming fixes across the app:
  - "Nuevo" → "Nuevo expediente" (in expedientes)
  - "Nueva tarea" → "Nueva revisión" (in sidebar)
  - "Cola de aprobación" → "Aprobaciones" (if still used)
  - "Expedientes Fiscales" → "Expedientes" (in sidebar)
  - "Contexto (inspector)" → "Detalle"
- [ ] `5.4` Reduce recommendation cards height in cierre/revision views
- [ ] `5.5` Ensure agent status bar in sidebar footer works with real agent count
- [ ] `5.6` Verify CI: `bun run typecheck && bun run lint && bun run test:run`

## Task ordering

```
1.1 ── 1.2 ── 1.3 ── 1.4 ── 1.5 ── 1.6
                                         │
                                         2.1 ── 2.2 ── 2.3 ── 2.4 ── 2.5
                                                                │
                                                                2.6 ── 2.7 ── 2.8 ── 2.9 ── 2.10 ── 2.11
                                                                                                        │
                                                                                                        3.1 ── 3.2 ── 3.3 ── 3.4 ── 3.5 ── 3.6
                                                                                                                               │
                                                                                                                               4.1 ── 4.2 ── 4.3 ── 4.4 ── 4.5 ── 4.6
                                                                                                                                                                     │
                                                                                                                                                                     5.1 ── 5.2 ── 5.3 ── 5.4 ── 5.5 ── 5.6
```

## Verification

```bash
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test:run
bun run build
```

## Acceptance criteria checklist

**Must pass**:

- [ ] PageShell typecheck: focal | operativo | data-heavy works
- [ ] Composer hidden in settings
- [ ] Composer compact in invoices
- [ ] Composer expanded in inbox
- [ ] Sidebar sections collapsible
- [ ] Control Tower renamed with redirect
- [ ] Inbox dropzone reduced
- [ ] Facturas border/typography unified
- [ ] No hardcoded technical errors visible
- [ ] All CI gates pass
