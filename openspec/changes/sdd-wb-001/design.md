# SDD-WB-001 — Architecture Design

**Change ID:** `sdd-wb-001`
**Status:** design
**Strict TDD:** yes (vitest)
**Test runner:** `vitest --project web`

## 1. Package alignment

All Workbench types live in a new `packages/domain/src/workbench/` directory (framework-free, as per DRENYRA rules). The web app imports them.

```
packages/domain/src/workbench/
  types.ts               — Workspace, PaneConfig, DensityMode, etc.
  workspace.test.ts      — Pure function tests for workspace logic
  layout-utils.ts         — Layout serialization, validation, defaults
  layout-utils.test.ts    — Tests for layout logic
```

## 2. Component tree

```
<FiscalEditorialShell>                      // existing, unchanged
  <WorkspaceProvider>                        // NEW — context + state
    <AgenticCommandBar />                    // existing, already global
    <CommandPalette />                       // EVOLVED — new command model
    <div class="flex flex-1">
      <Sidebar />                            // EVOLVED — workspace-aware
      <main>
        <DensityProvider>                    // NEW — CSS variable context
          <FiscalInspectorProvider>          // existing
            <WorkspaceTopBar>                // NEW — company/period switcher
              <CompanySwitcher />            // NEW
              <PeriodSwitcher />             // NEW
              <WorkspaceIntentSwitcher />     // NEW
            </WorkspaceTopBar>
            <PaneContainer />                // NEW — dynamic pane layout
            {children ?? <Outlet />}
          </FiscalInspectorProvider>
        </DensityProvider>
      </main>
      <RightPanel />                         // existing, moved to pane model
    </div>
  </WorkspaceProvider>
</FiscalEditorialShell>
```

## 3. File map

### New files

```
apps/web/src/
  contexts/
    workspace-context.tsx         — WorkspaceProvider + useWorkspace hook
    density-context.tsx           — DensityProvider + useDensity hook
  components/
    workbench/
      WorkspaceTopBar.tsx         — Top bar with company/period/intent switchers
      CompanySwitcher.tsx         — Company dropdown with search
      PeriodSwitcher.tsx          — Period dropdown (year/month)
      WorkspaceIntentSwitcher.tsx — Intent tabs (close/reconcile/review/...)
      PaneContainer.tsx           — Dynamic pane layout manager
      Pane.tsx                    — Single pane wrapper (resizable, closable)
      ResizeHandle.tsx            — Vertical resize handle between panes
      CommandPalette.tsx          — EVOLVED: universal command model
      command-registry.ts         — Static + dynamic command registration
  stores/
    workspace.store.ts            — Zustand store for workspace state + recent list
  hooks/
    useWorkspaceKeyboard.ts       — Keyboard model shortcuts

packages/domain/src/
  workbench/
    types.ts
    layout-utils.ts
    layout-utils.test.ts
```

### Modified files

```
apps/web/src/
  components/agentic-shell/AgenticLayout/AgenticLayout.tsx
    → Wrap in WorkspaceProvider + DensityProvider, add WorkspaceTopBar
  components/agentic-shell/AgenticSidebar/AgenticSidebar.tsx
    → Add workspace context section
  components/agentic-shell/AgenticSidebar/components/AgenticSidebarNavItems.tsx
    → Make nav items context-aware
  components/layout/ActiveCompanySwitcher.tsx
    → Replace with new CompanySwitcher (or keep as thin wrapper)
  components/agentic/CommandPalette.tsx
    → Replace with new universal CommandPalette
  hooks/useCodexKeyboardShortcuts.ts
    → Merge into useWorkspaceKeyboard.ts
  routes/__root.tsx
    → May need minor updates for workspace routing (backward compat)
```

## 4. State architecture

```typescript
// Zustand store
interface WorkspaceStore {
  // Current workspace
  current: Workspace | null
  isLoading: boolean
  
  // Recent workspaces (max 5, persisted to localStorage)
  recent: Workspace[]
  
  // Actions
  navigateTo: (companyId: string, year: number, month: number, intent: WorkspaceIntent) => void
  switchIntent: (intent: WorkspaceIntent) => void
  switchCompany: (companyId: string) => void
  switchPeriod: (period: PeriodRef) => void
  
  // Layout
  updateLayout: (layout: Partial<WorkspaceLayout>) => void
  resetLayout: () => void
  
  // Density
  setDensity: (mode: DensityMode) => void
}
```

## 5. Persistence

```typescript
// localStorage keys
const LAYOUT_KEY_PREFIX = 'drenyra:layout:'
const RECENT_KEY = 'drenyra:recent-workspaces'
const DENSITY_KEY = 'drenyra:density-mode'

// On workspace nav → save current layout + push to recent
// On app load → restore last workspace + layout
// On density change → save immediately + apply CSS variables
```

Density mode applies CSS custom properties:

```css
:root[data-density='comfortable'] {
  --spacing-unit: 6px;
  --font-scale: 1.05;
  --sidebar-width: 280px;
}

:root[data-density='default'] {
  --spacing-unit: 4px;
  --font-scale: 1;
  --sidebar-width: 260px;
}

:root[data-density='compact'] {
  --spacing-unit: 2px;
  --font-scale: 0.95;
  --sidebar-width: 240px;
}
```

## 6. Command palette model

```typescript
// Singleton registry
class CommandRegistry {
  private commands: Map<string, Command> = new Map()
  
  register(command: Command): void
  unregister(id: string): void
  search(query: string, context?: { workspace?: Workspace }): Command[]
  getNavigationCommands(): Command[]
  getQueryCommands(): Command[]
  getExecutionCommands(): Command[]
}
```

Registered at app init + workspace context changes. Commands have preconditions (e.g., "Start reconciliation" requires appropriate permission).

## 7. Pane system model

```typescript
interface PaneContainerProps {
  defaultLayout: PaneConfig[]
  storageKey: string // derived from workspace
  onLayoutChange?: (layout: PaneConfig[]) => void
}

// Pane handles resize via ResizeHandle
// Layout stored in localStorage per workspaceKey
// On mount: try restore, fall back to defaultLayout
// Resize: save debounced (500ms)
```

## 8. PR breakdown

| PR | Scope | Files est. | Lines est. |
|----|-------|------------|------------|
| PR1 | Domain types + layout utils + tests | 4 (domain) | ~120 |
| PR2 | WorkspaceProvider + store + context | 4 (web) | ~180 |
| PR3 | Sidebar evolution + workspace section | 3 (web) | ~80 |
| PR4 | WorkspaceTopBar (company/period/intent switchers) | 4 (web) | ~160 |
| PR5 | Command palette (registry + UI) | 4 (web) | ~200 |
| PR6 | Pane system + resize + persistence | 4 (web) | ~250 |
| PR7 | Density modes + keyboard model + tests | 3 (web) | ~100 |
| PR8 | Integration: AgenticLayout + routing + backward compat | 5 (web) | ~120 |
