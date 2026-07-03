# SDD Spec: Agentic Shell — Technical Specification

**Última actualización:** 2026-07-02
**Plan SDD:** 1 de 6 — Agentic Shell
**Fase:** Spec
**Estado:** Borrador

---

## 1. Overview

Reemplazar MainLayoutShell + Sidebar + TopBar + FiscalInspector + navigation system por una nueva shell agentic-first. Se conserva la estructura de routing de TanStack Router pero se cambian el layout root, los componentes de navegación, y la entry point de la app.

---

## 2. File Structure — New Files

```
apps/web/src/
  components/
    agentic-shell/                          ← NEW: All agentic shell components
      AgenticLayout/
        AgenticLayout.tsx                   ← Replaces MainLayoutShell
        AgenticLayout.types.ts
        AgenticLayout.loading.tsx
      AgenticSidebar/
        AgenticSidebar.tsx                  ← Replaces Sidebar
        AgenticSidebar.data.ts              ← Nav items definition
        AgenticSidebar.types.ts
        components/
          AgenticSidebarNavItems.tsx
          AgenticSidebarFooter.tsx
          AgenticSidebarBadge.tsx
          AgenticSidebarToggle.tsx
      AgenticCommandBar/
        AgenticCommandBar.tsx               ← NEW: Bottom command bar (always visible)
        AgenticCommandBar.types.ts
        AgenticCommandBar.data.ts           ← Quick commands, @ references, / skills
      CommandPalette/
        CommandPalette.tsx                  ← Refined from DrenyraCommandPalette
        CommandPalette.types.ts
        CommandPalette.data.ts              ← Global command registry
        CommandPalette.hooks.ts             ← Keyboard shortcut hooks
      RightInspector/
        RightInspector.tsx                  ← Replaces FiscalInspector + ArtifactRegistry
        RightInspector.types.ts
        RightInspector.context.tsx          ← Context provider for inspector state
        panels/
          InspectorThreadPanel.tsx           ← Thread detail (placeholder for Plan 2)
          InspectorDiffPanel.tsx            ← Diff detail (placeholder for Plan 4)
          InspectorAgentPanel.tsx           ← Agent detail (placeholder for Plan 3)
          InspectorEvidencePanel.tsx        ← Evidence detail (from Evidence Vault)
          InspectorFiscalPanel.tsx          ← Fiscal analysis (from FiscalInspector)
      WorkspaceSelector/
        WorkspaceSelector.tsx               ← Refined from ActiveCompanySwitcher
        WorkspaceSelector.types.ts
        WorkspaceSelector.data.ts
      AgenticTopBar/
        AgenticTopBar.tsx                   ← Refined from MainLayoutTopBar
        AgenticTopBar.types.ts

  lib/
    navigation/
      types.ts                              ← MODIFY: Add new NavigationSectionIds
      items/
        agentic.ts                          ← NEW: Agentic-first nav items
        legacy.ts                           ← NEW: Legacy items (for command palette only)

  stores/
    agentic-shell.store.ts                  ← NEW: Zustand store for agentic shell state

  routes/
    __root.tsx                              ← MODIFY: Use AgenticLayout instead of MainLayoutView
    index.tsx                               ← MODIFY: Redirect / → /threads/new
```

---

## 3. Component Contracts

### 3.1 AgenticLayout

```typescript
// AgenticLayout.types.ts
export interface AgenticLayoutProps {
  children: ReactNode
}

export interface AgenticLayoutContextValue {
  /** Currently open right inspector panel, or null */
  activeInspector: InspectorPanel | null
  /** Open a panel in the right inspector */
  openInspector: (panel: InspectorPanel) => void
  /** Close the right inspector */
  closeInspector: () => void
  /** Current workspace selection */
  workspace: WorkspaceSelection | null
  /** Set workspace (client + period) */
  setWorkspace: (ws: WorkspaceSelection) => void
  /** Command palette state */
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
}

export interface InspectorPanel {
  type: 'thread' | 'diff' | 'agent' | 'evidence' | 'fiscal'
  id: string
  title: string
}

export interface WorkspaceSelection {
  organizationId: string
  organizationName: string
  ruc: string
  period: string // "2026-06"
}
```

**Layout structure:**

```tsx
<FiscalEditorialShell mode="operational">
  <AgenticLayoutProvider>
    {/*
      DESKTOP (>1024px):
      ┌──────────────┬──────────────────────────────┬───────────────┐
      │              │                              │               │
      │ AgenticSide  │  <Outlet />                  │ RightInspector│
      │ bar          │  (scrollable content)         │ (optional)    │
      │              │                              │               │
      ├──────────────┴──────────────────────────────┴───────────────┤
      │                   AgenticCommandBar                          │
      └──────────────────────────────────────────────────────────────┘

      MOBILE (<1024px):
      ┌─────────────────────────────────────────────────┐
      │ AgenticTopBar (hamburger + workspace selector)   │
      ├─────────────────────────────────────────────────┤
      │ <Outlet />                                       │
      ├─────────────────────────────────────────────────┤
      │ AgenticCommandBar (compact)                      │
      └─────────────────────────────────────────────────┘
    */}
  </AgenticLayoutProvider>
  <CommandPalette />
</FiscalEditorialShell>
```

### 3.2 AgenticSidebar

```typescript
// AgenticSidebar.types.ts
export interface AgenticSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  onNavigate: () => void
}

export type AgenticNavSectionId = 'workspace' | 'platform' | 'organization'

export interface AgenticNavItem {
  id: string
  section: AgenticNavSectionId
  label: string
  icon: LucideIcon
  to: string
  badge?: number // notification count
  badgeVariant?: 'critical' | 'warning' | 'info'
}
```

**Nav items definition (AgenticSidebar.data.ts):**

```typescript
export const AGENTIC_NAV_ITEMS: AgenticNavItem[] = [
  // ─── WORKSPACE ───
  {
    id: 'new-thread',
    section: 'workspace',
    label: 'New Thread',
    icon: PlusCircle,
    to: '/threads/new',
  },
  {
    id: 'review-queue',
    section: 'workspace',
    label: 'Review Queue',
    icon: ClipboardCheck,
    to: '/review',
  },
  {
    id: 'agents',
    section: 'workspace',
    label: 'Agents',
    icon: Cpu,
    to: '/agents',
  },

  // ─── PLATFORM ───
  {
    id: 'automations',
    section: 'platform',
    label: 'Automations',
    icon: Timer,
    to: '/automations',
  },
  {
    id: 'skills',
    section: 'platform',
    label: 'Skills',
    icon: Puzzle,
    to: '/skills',
  },
  {
    id: 'evidence',
    section: 'platform',
    label: 'Evidence Vault',
    icon: FileSearch,
    to: '/evidence',
  },

  // ─── ORGANIZATION ───
  {
    id: 'clients',
    section: 'organization',
    label: 'Clientes',
    icon: Building2,
    to: '/clients',
  },
  {
    id: 'settings',
    section: 'organization',
    label: 'Settings',
    icon: Settings,
    to: '/settings',
  },
]
```

**Sidebar rendering:**

```tsx
<aside
  className={cn(
    'flex h-full flex-col bg-[var(--surface-1)] border-r border-[var(--border-subtle)] transition-[width] duration-300',
    isCollapsed ? 'w-[64px]' : 'w-[240px]'
  )}
>
  <AgenticSidebarToggle isCollapsed={isCollapsed} onToggle={onToggle} />

  {/* Logo / brand — always visible, compact */}
  <div className="px-3 py-4 flex items-center gap-2">
    {!isCollapsed && <span className="font-semibold text-sm">Drenyra</span>}
  </div>

  {/* Sectioned nav items */}
  <nav className="flex-1 overflow-y-auto px-2 space-y-4">
    <NavSection title="Workspace" items={workspaceItems} />
    <NavSection title="Platform" items={platformItems} />
    <NavSection title="Organization" items={orgItems} />
  </nav>

  <AgenticSidebarFooter isCollapsed={isCollapsed} />
</aside>
```

### 3.3 AgenticCommandBar

```typescript
// AgenticCommandBar.types.ts
export interface AgenticCommandBarProps {
  className?: string
}

export interface CommandSuggestion {
  type: 'quick-action' | '@reference' | '/skill'
  label: string
  description?: string
  action: () => void
}

export interface ReferenceType {
  prefix: '@'
  name: string
  items: Array<{ id: string; label: string }>
}

export interface SkillCommand {
  prefix: '/'
  name: string
  description: string
}
```

**Always-visible bottom bar:**

```tsx
<footer className="sticky bottom-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-1)]/95 backdrop-blur-sm">
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="relative flex-1">
      <MessageSquare size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
      <input
        type="text"
        placeholder="Ask Drenyra anything, @facturas @banco /sire /close /audit"
        className="h-9 w-full rounded-lg bg-[var(--surface-2)] pl-8 pr-3 text-sm outline-none"
        onFocus={() => /* expand suggestions */}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.value) /* create thread */
          if (e.key === '@') /* show reference autocomplete */
          if (e.key === '/') /* show skill autocomplete */
        }}
      />
    </div>
    <kbd className="hidden md:inline-flex text-[10px] text-[var(--text-muted)]">⌘K</kbd>
  </div>
</footer>
```

### 3.4 CommandPalette

```typescript
// CommandPalette.types.ts
export interface CommandPaletteCommand {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  category: 'navigation' | 'action' | 'agent' | 'recent'
  shortcut?: string
  action: () => void
  keywords?: string[]
}
```

**Behavior:**

- Opens with `⌘K` (global keybinding, registered once in AgenticLayout)
- Default: shows recent commands + quick actions
- Type to filter across all categories
- Categories:
  - `navigation`: All routes (agentic + legacy)
  - `action`: "Crear thread para...", "Revisar cola...", "Ejecutar skill..."
  - `agent`: "SIRE Agent para Andrés SAC", "Conciliación BCP..."
  - `recent`: Last 5 executed commands
- Closes on `Escape` or click outside

### 3.5 RightInspector

```typescript
// RightInspector.types.ts
export interface RightInspectorProps {
  panel: InspectorPanel | null
  onClose: () => void
}

// Context provider
// AgenticLayout.context.tsx — provides AgenticLayoutContextValue
```

**Behavior:**

- Slides in from the right (420px wide, matching current ArtifactRegistry width)
- Contains pluggable panels: one per panel.type
- Default empty state: "Select a thread, diff, or agent to inspect"
- Animates with framer-motion (same as FiscalInspector)
- FiscalInspector components are refactored into panel format:
  - InspectorFiscalPanel wraps FiscalInspectorDetail
  - InspectorEvidencePanel wraps FiscalInspectorEvidence
  - InspectorAgentPanel wraps FiscalInspectorAgentAnalysis

### 3.6 WorkspaceSelector

```typescript
// WorkspaceSelector.types.ts
export interface WorkspaceSelectorProps {
  compact?: boolean
  className?: string
}
```

**Refined from ActiveCompanySwitcher. Adds:**

- Period selector alongside organization
- Shows RUC and fiscal status
- Shows active period
- Dropdown: change organization or period

### 3.7 AgenticTopBar

```typescript
// AgenticTopBar.types.ts
export interface AgenticTopBarProps {
  onMenuOpen: () => void
}
```

**Mobile-only (like MainLayoutTopBar but refined):**

- Hamburger menu
- WorkspaceSelector (compact)
- Notification bell with badge
- User menu

---

## 4. Store Schema

```typescript
// agentic-shell.store.ts
import { create } from 'zustand'

interface AgenticShellState {
  // Sidebar
  isSidebarCollapsed: boolean
  isSidebarMobileOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarMobileOpen: (open: boolean) => void

  // Right Inspector
  activeInspector: InspectorPanel | null
  openInspector: (panel: InspectorPanel) => void
  closeInspector: () => void

  // Command Palette
  isCommandPaletteOpen: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void

  // Focus mode (hides sidebar)
  isFocusMode: boolean
  setFocusMode: (focus: boolean) => void
}

// Persisted keys: isSidebarCollapsed, isFocusMode
```

---

## 5. Routing Changes

### __root.tsx changes

**Current:** Uses `MainLayoutView` which dispatches to `MainLayoutShell` or `MainLayoutSettingsView`

**New:** Uses `AgenticLayout` as the default. Settings route can be detected inside `AgenticLayout` to render a simpler layout if needed, or use a separate `AgenticSettingsLayout`.

```typescript
// New __root.tsx structure
export function RootLayout() {
  return (
    <AgenticLayout>
      <Outlet />
    </AgenticLayout>
  )
}
```

### index.tsx changes

**Current:** Redirects to `/dashboard`

**New:** Redirects to `/threads/new`

```typescript
// Before
navigate({ to: '/dashboard' })

// After
navigate({ to: '/threads/new' })
```

### New routes to register

| Route          | Component         | Status                     |
| -------------- | ----------------- | -------------------------- |
| `/threads/new` | ThreadCreatePage  | Placeholder (Plan 2)       |
| `/review`      | ReviewQueuePage   | Placeholder (Plan 4)       |
| `/agents`      | AgentsWindowPage  | Placeholder (Plan 3)       |
| `/automations` | AutomationsPage   | Placeholder (Plan 5)       |
| `/skills`      | SkillsLibraryPage | Placeholder (Plan 5)       |
| `/clients`     | ClientListPage    | Refactor from ControlTower |

Routes must be registered in the route tree. Placeholder components show a "coming soon" state for Plans 2-5.

### Legacy route access

All existing routes (`/dashboard`, `/invoices`, `/banking`, etc.) continue to work. They are accessible via:

- Direct URL entry
- Command palette search
- `/tools` index page (hidden nav, accessible via command palette)

---

## 6. Migration Plan

### PR1: AgenticLayout + AgenticSidebar + routing tree

**Files to create:**

- `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`
- `components/agentic-shell/AgenticLayout/AgenticLayout.types.ts`
- `components/agentic-shell/AgenticLayout/AgenticLayout.loading.tsx`
- `components/agentic-shell/AgenticLayout/AgenticLayout.context.tsx`
- `components/agentic-shell/AgenticSidebar/AgenticSidebar.tsx`
- `components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`
- `components/agentic-shell/AgenticSidebar/AgenticSidebar.types.ts`
- `components/agentic-shell/AgenticSidebar/components/AgenticSidebarNavItems.tsx`
- `components/agentic-shell/AgenticSidebar/components/AgenticSidebarFooter.tsx`
- `components/agentic-shell/AgenticSidebar/components/AgenticSidebarToggle.tsx`
- `stores/agentic-shell.store.ts`
- `lib/navigation/items/agentic.ts`
- `lib/navigation/items/legacy.ts`

**Files to modify:**

- `routes/__root.tsx` — Use AgenticLayout
- `routes/index.tsx` — Redirect to /threads/new
- `lib/navigation/types.ts` — Add new section IDs
- `routeTree.gen.ts` — Auto-generated (will be regenerated)

**Files to keep (not touched in PR1):**

- `components/layout/MainLayout/` — Kept for reference during migration; will be removed in PR3
- `components/layout/Sidebar/` — Same
- `routeTree.gen.ts` — Auto-generated by Vite plugin

### PR2: AgenticCommandBar + CommandPalette + RightInspector

**Files to create:**

- `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.tsx`
- `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.types.ts`
- `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.data.ts`
- `components/agentic-shell/CommandPalette/CommandPalette.tsx`
- `components/agentic-shell/CommandPalette/CommandPalette.types.ts`
- `components/agentic-shell/CommandPalette/CommandPalette.data.ts`
- `components/agentic-shell/CommandPalette/CommandPalette.hooks.ts`
- `components/agentic-shell/RightInspector/RightInspector.tsx`
- `components/agentic-shell/RightInspector/RightInspector.types.ts`
- `components/agentic-shell/RightInspector/RightInspector.context.tsx`
- `components/agentic-shell/RightInspector/panels/InspectorFiscalPanel.tsx`

**Files to modify:**

- `components/agentic-shell/AgenticLayout/AgenticLayout.tsx` — Wire CommandBar + CommandPalette
- `hooks/useKeyboardShortcuts.ts` — Add ⌘K binding
- `context/FiscalInspectorContext.tsx` — May be deprecated in favor of RightInspector context; keep for backward compat

### PR3: WorkspaceSelector + AgenticTopBar + legacy cleanup

**Files to create:**

- `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.tsx`
- `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.types.ts`
- `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.data.ts`
- `components/agentic-shell/AgenticTopBar/AgenticTopBar.tsx`
- `components/agentic-shell/AgenticTopBar/AgenticTopBar.types.ts`

**Files to modify / deprecate:**

- `components/layout/ActiveCompanySwitcher.tsx` — Can be kept to delegate to WorkspaceSelector, or deprecated
- `components/layout/MainLayout/` — Remove old layout files
- `components/layout/Sidebar/` — Remove old sidebar files
- `components/layout/FiscalInspector.tsx` — Keep for backward compat but deprecate in favor of RightInspector
- `components/layout/MainLayoutTopBar.tsx` — Replace with AgenticTopBar

---

## 7. Type changes in lib/navigation

Add new sections to `NavigationSectionId`:

```typescript
export type NavigationSectionId =
  | 'home'
  | 'finanzas'
  | 'compliance'
  | 'operaciones'
  | 'agents'
  | 'sistema'
  | 'plugins'
  | 'automations'
  // NEW:
  | 'workspace-section'
  | 'platform-section'
  | 'organization-section'
```

Add `AGENTIC_GROUP_ORDER` alongside `SIDEBAR_GROUP_ORDER`:

```typescript
export const AGENTIC_GROUP_ORDER: readonly NavigationSectionId[] = [
  'workspace-section',
  'platform-section',
  'organization-section',
]
```

---

## 8. Edge Cases & Gotchas

- **Sidebar state persistence:** Current sidebar collapse state is in localStorage via Zustand. Must preserve or migrate the localStorage key.
- **Mobile responsiveness:** The current layout has carefully tuned mobile breakpoints. The new AgenticLayout must preserve: hamburger at <1024px, collapsible sidebar on tablet, always-visible on desktop.
- **Focus mode:** The existing `isFocusMode` in sidebar-layout.store hides the sidebar for focused work. Must preserve this in the new store.
- **Route import paths:** Many existing components and hooks import from the old layout paths (`@/components/layout/Sidebar`, etc.). Must handle these during migration — consider adding re-exports from old paths temporarily.
- **Command bar position:** The command bar must be absolute/fixed at the bottom of the viewport, not below the scroll. Use `sticky bottom-0` on the layout container.
- **RightInspector vs FiscalInspector:** The FiscalInspector is used via `useFiscalInspector()` context in many feature components. Must keep the context working while adding RightInspector on top. Consider making RightInspector the default and FiscalInspector a deprecated alias.

---

## 9. Testing Strategy

| Component         | Test type   | What to test                                                    |
| ----------------- | ----------- | --------------------------------------------------------------- |
| AgenticLayout     | Integration | Renders sidebar + content + command bar; responsive breakpoints |
| AgenticSidebar    | Unit        | All nav items render; collapse/expand; badges display           |
| AgenticCommandBar | Unit        | Input renders; @ and / trigger autocomplete; Enter submits      |
| CommandPalette    | Unit        | Filter works; categories display; command executes on click     |
| RightInspector    | Unit        | Opens/closes with animation; panel type routing                 |
| WorkspaceSelector | Unit        | Org list; period selector; RUC display                          |
| __root.tsx        | E2E         | Legacy routes still work; / redirects to /threads/new           |

---

## 10. Performance Budget

| Metric                              | Target         |
| ----------------------------------- | -------------- |
| AgenticLayout + Sidebar bundle size | < 15KB gzipped |
| CommandPalette (lazy loaded)        | < 8KB gzipped  |
| RightInspector panels (lazy loaded) | < 5KB each     |
| Initial layout render               | < 50ms         |
| Command palette open → render       | < 30ms         |
