# SDD-WB-001 — Implementation Tasks

**Change ID:** `sdd-wb-001`
**Test runner:** vitest (web), vitest (domain)
**Strict TDD:** RED → GREEN → TRIANGULATE → REFACTOR per task
**Delivery:** 8 PRs, auto-forecast chained

---

## PR1 — Domain types & layout utilities

**Files:** 4 new in `packages/domain/src/workbench/`
**Est. lines:** ~120
**Strict TDD:** YES

- [x] `RED`: Test workspace type construction and validation
  - `WorkspaceId` branded type compiles correctly
  - `Workspace` factory rejects invalid period (month < 1 or > 12, year < 2020 or > 2100)
  - `WorkspaceIntent` enum has all 6 values
  - `DensityMode` enum has all 3 values
  - `PaneConfig` validates `minSize` <= `size`
- [x] `GREEN`: Implement `packages/domain/src/workbench/types.ts`
  - All types per spec
  - `Workspace` factory with validation
- [x] `TRIANGULATE`: Add edge cases (missing company, empty label)
- [x] `REFACTOR`: Clean up validation, extract reusable validators

---

## PR2 — Workspace context + store

**Files:** 4 new in `apps/web/src/`
**Est. lines:** ~180
**Strict TDD:** YES

- [x] `RED`: Workspace store tests
  - Store initializes with `null` current workspace
  - `navigateTo` sets workspace correctly
  - `recent` list capped at 5, most recent first
  - `updateLayout` merges partial layout
  - `switchIntent` changes intent, preserves company/period
  - `setDensity` persists to localStorage + updates store
  - Persistence: save/restore roundtrip
- [x] `GREEN`: Implement `stores/workspace.store.ts` (Zustand)
  - All store actions
  - localStorage hydration on load
  - Subscribe for auto-save
- [x] `GREEN`: Implement `contexts/workspace-context.tsx`
  - `WorkspaceProvider` that wires store to React context
  - `useWorkspace` hook
- [x] `GREEN`: Implement `contexts/density-context.tsx`
  - `DensityProvider` with CSS variable management
  - `useDensity` hook
  - Persistence to localStorage
- [x] `TRIANGULATE`: Error cases (localStorage full, corrupted data)
- [x] `REFACTOR`: Extract localStorage abstraction

---

## PR3 — Sidebar evolution

**Files:** 3 modified in `apps/web/src/`
**Est. lines:** ~80
**Strict TDD:** YES

- [ ] `RED`: Sidebar workspace section tests
  - Shows current company/period when workspace is active
  - Shows "(sin workspace)" when no workspace selected
  - Quick-access buttons render
- [ ] `GREEN`: Evolve `AgenticSidebarNavItems.tsx`
  - Add workspace context section at top
  - Conditionally show/hide based on collapsed state
  - Workspace section shows company initial in collapsed mode
- [ ] `GREEN`: Add workspace context to `AgenticSidebar.tsx`
  - Wire useWorkspace hook
  - Pass workspace info to nav items
- [ ] `REFACTOR`: Extract `SidebarWorkspaceSection` component

---

## PR4 — Workspace top bar (switchers)

**Files:** 4 new in `apps/web/src/components/workbench/`
**Est. lines:** ~160
**Strict TDD:** YES

- [ ] `RED`: Company switcher tests
  - Opens dropdown on click
  - Search filters companies
  - Select fires `onChange`
  - Keyboard navigation: ↑↓ arrows, Enter selects, Esc closes
- [ ] `RED`: Period switcher tests
  - Month/year navigation works
  - Select fires `onChange`
- [ ] `RED`: Intent switcher tests
  - All 6 intents shown as clickable tabs
  - Active intent highlighted
  - Select fires `onChange`
- [ ] `GREEN`: Implement `CompanySwitcher.tsx`
  - Searchable dropdown with company list from context
  - Keyboard nav: arrows, enter, esc
- [ ] `GREEN`: Implement `PeriodSwitcher.tsx`
  - Dropdown with YYYY-MM grid
  - Arrow navigation between months
- [ ] `GREEN`: Implement `WorkspaceIntentSwitcher.tsx`
  - Tabs for each intent
  - Icons per intent
- [ ] `GREEN`: Implement `WorkspaceTopBar.tsx`
  - Composes all 3 switchers in a horizontal bar
  - Responsive: collapses on mobile
- [ ] `TRIANGULATE`: Mobile layout, overflow
- [ ] `REFACTOR`: Extract shared dropdown logic

---

## PR5 — Universal command palette

**Files:** 4 new in `apps/web/src/`
**Est. lines:** ~200
**Strict TDD:** YES

- [x] `RED`: Command registry tests
  - `register` / `unregister` works
  - `search` returns matching commands by label and description
  - `search` respects category filter
  - Commands sorted: navigation > query > execution
  - `getNavigationCommands` returns only nav commands
  - `getQueryCommands` returns only query commands
  - `getExecutionCommands` returns only execution commands
- [x] `GREEN`: Implement `command-registry.ts`
  - Singleton `CommandRegistry` class
  - Registration API
  - Search API
- [x] `GREEN`: Implement `default-commands.ts`
  - Navigation commands for all sidebar routes
  - Execution commands (toggle sidebar, panel, terminal)
- [x] `GREEN`: Evolve `CommandPalette.tsx`
  - Uses registry with search
  - Categories: navigation/query/execution
  - R2/R3 preview mode
  - Extracted CommandPaletteItem component
- [x] `TRIANGULATE`: Extracted CommandItem component, fallback to static data
- [x] `REFACTOR`: Extracted CommandPaletteItem, simplified CommandPalette

---

## PR6 — Dynamic pane system

**Files:** 4 new in `apps/web/src/`
**Est. lines:** ~250
**Strict TDD:** YES

- [x] `GREEN`: Implement `Pane.tsx`
  - Wrapper with header, close button
  - Flexible content area, minWidth respected
- [x] `GREEN`: Implement `ResizeHandle.tsx`
  - Mouse drag to resize adjacent panes
  - Keyboard: Shift+Arrow resizes by 10px
  - Visible handle on hover
- [x] `GREEN`: Implement `PaneContainer.tsx`
  - Manages array of panes with flex layout
  - Resize handles between panes
  - Debounced localStorage save
  - Center pane not closable

---

## PR7 — Density modes + keyboard model

**Files:** 3 new/modified in `apps/web/src/`
**Est. lines:** ~100
**Strict TDD:** YES

- [x] `GREEN`: Implement `density-context.tsx`
  - `DensityProvider` with CSS variable management
  - `useDensity` hook
  - Persistence to localStorage
- [x] `GREEN`: Define CSS variables for all 3 density modes in `index.css`
  - `--spacing-unit`, `--font-scale`, `--sidebar-width`, `--pane-gap`, `--topbar-height`
- [x] `GREEN`: Implement `useWorkspaceKeyboard.ts`
  - Global shortcuts: ⌘K, ⌘B, ⌘\, ⌘`, Esc
  - Disabled when input is focused
  - Extracted inline for complexity
- [x] `GREEN`: Wire keyboard hook into `AgenticLayout.tsx`

---

## PR8 — Integration: AgenticLayout + routing

**Files:** 5 modified in `apps/web/src/`
**Est. lines:** ~120
**Strict TDD:** NO (integration, manual verification)

- [x] Wrap `AgenticLayout` in `WorkspaceProvider` + `DensityProvider`
- [x] Add `WorkspaceTopBar` to layout (shown only in workspace routes)
- [x] Replace old command palette with new universal one
- [x] Wire sidebar workspace section to store
- [x] Wire keyboard hook into AgenticLayout
- [x] Add `/workspace/:companyId/:year/:month/:intent` route (route file + TanStack Router auto-discovery)
- [x] Ensure backward compat: existing routes work without workspace context
  - `/cierre-mensual` still works
  - `/` still works (no workspace context)
  - `/drenyra/*` inherits workspace context
  - AgenticLayout detects workspace routes via path matching
- [ ] Verify: keyboard shortcuts work without conflicts
- [ ] Verify: layout persists across page navigation (SPA)
- [ ] Verify: company switch animates without blank screen

---

## Review Workload Forecast

| PR        | Estimated lines | 400-line risk               |
| --------- | --------------- | --------------------------- |
| PR1       | ~120            | ✅ Safe                     |
| PR2       | ~180            | ✅ Safe                     |
| PR3       | ~80             | ✅ Safe                     |
| PR4       | ~160            | ✅ Safe                     |
| PR5       | ~200            | ✅ Safe                     |
| PR6       | ~250            | ✅ Safe                     |
| PR7       | ~100            | ✅ Safe                     |
| PR8       | ~120            | ✅ Safe                     |
| **Total** | **~1,210**      | **Chained PRs recommended** |

**Chained PR strategy:** PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8 (sequential, each < 400 lines)
