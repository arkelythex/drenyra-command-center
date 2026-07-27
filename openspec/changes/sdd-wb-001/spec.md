# SDD-WB-001 — Specification

**Change ID:** `sdd-wb-001`
**Status:** spec

## 1. Workspace Hierarchy Model

### Types

```typescript
// packages/domain/src/workbench/types.ts

type WorkspaceId = string & { readonly __brand: 'WorkspaceId' }
type PaneId = string & { readonly __brand: 'PaneId' }

interface OrganizationRef {
  id: string
  name: string
  slug: string
}

interface PortfolioRef {
  id: string
  name: string
  organizationId: string
}

interface CompanyRef {
  id: string
  name: string
  ruc: string
  organizationId: string
}

interface PeriodRef {
  year: number
  month: number // 1-12
  label: string // e.g. "Junio 2026"
}

type WorkspaceIntent =
  | 'close'       // Monthly close
  | 'reconcile'   // Bank reconciliation
  | 'review'      // Review queue
  | 'investigate' // Investigation/find
  | 'configure'   // Settings/admin
  | 'report'      // Report generation

interface Workspace {
  id: WorkspaceId
  company: CompanyRef
  period: PeriodRef
  intent: WorkspaceIntent
  label: string // user-editable label
  layout: WorkspaceLayout
}

interface WorkspaceLayout {
  panes: PaneConfig[]
  sidebarCollapsed: boolean
  rightPanelOpen: boolean
  densityMode: DensityMode
}

type DensityMode = 'comfortable' | 'default' | 'compact'

type PaneType =
  | 'ledger'
  | 'sire-diff'
  | 'evidence'
  | 'agent-activity'
  | 'siar'
  | 'approval'
  | 'reconciliation'
  | 'report'
  | 'generic' // fallback for any route content

interface PaneConfig {
  id: PaneId
  type: PaneType
  label: string
  position: 'left' | 'center' | 'right'
  size: number // flex ratio or px
  minSize: number
  metadata?: Record<string, unknown>
}

// Routing model
// /workspace/:companyId/:year/:month/:intent
// e.g. /workspace/arkelythex/2026/6/close
// Backward compat: existing routes redirect or mount inside workspace context
```

### Context Provider

```typescript
interface WorkspaceContextValue {
  workspace: Workspace | null
  isLoading: boolean
  error: Error | null
  setCompany: (companyId: string) => void
  setPeriod: (period: PeriodRef) => void
  setIntent: (intent: WorkspaceIntent) => void
  setLayout: (layout: WorkspaceLayout) => void
  resetLayout: () => void
  recentWorkspaces: Workspace[] // last 5
}
```

## 2. Sidebar Evolution

### New structure

```
┌──────────────────────┐
│ DRENYRA          [⌘K]│  ← Logo + command trigger
├──────────────────────┤
│ WORKSAPCE            │  ← Current workspace context
│ Arkelythex SAC       │
│ Junio 2026 · Cierre  │
├──────────────────────┤
│ Atajos               │  ← Quick-access buttons
│ ⚡ New Thread        │
│ 📋 Review Queue      │
├──────────────────────┤
│ ─── WORKSPACE ───    │  ← Existing 3-section nav
│ ◆ New Thread         │
│ ◆ Review Queue       │
│ ◆ Agents             │
│                       
│ ─── PLATFORM ───     │
│ ◆ Automations        │
│ ◆ Skills             │
│ ◆ Evidence Vault     │
│                       
│ ─── ORGANIZATION ──  │
│ ◆ Clientes           │
│ ◆ Configuración      │
│ └─                    │
├──────────────────────┤
│ User name       [⚙] │  ← Footer with settings
└──────────────────────┘
```

### Collapsed state (64px)

- Icons only
- Hover expands tooltip
- Active workspace indicator
- Workspace section shows company initial (e.g. "A" for Arkelythex)

## 3. Company/Period Switcher

Shown in the shell's top bar (only in workspace routes):

```
┌─────────────────────────────────────────────────────────────┐
│ Arkelythex SAC   ▼  │   Junio 2026   ▼  │   Cierre ▼   ... │
│                     │                    │                  │
│ Search companies... │   ← 2026           │ Close            │
│──────────────────── │  ○ Ene ○ Feb ● Jun │ Reconcile        │
│ Arkelythex SAC  ●  │  ○ Jul ○ Ago       │ Review           │
│ Otra Empresa    ○   │  ○ Sep              │ Investigate      │
│ ...                 │                    │                  │
└─────────────────────────────────────────────────────────────┘
```

## 4. Dynamic Pane System

### Default layout (3 panels, as today)

```
┌───────────┬──────────────────────────┬──────────────────┐
│ Sidebar   │      Main Content        │  Right Inspector │
│ (260px)   │      (flex-1)            │  (420px, toggle) │
└───────────┴──────────────────────────┴──────────────────┘
```

### Power user layout (multi-pane)

```
┌───────────┬─────────────────────┬─────────────────────┬──────────┐
│ Sidebar   │   SIRE Diff         │     Ledger          │ Evidence │
│ (64px)    │   (resizable)       │     (resizable)     │ (360px)  │
├───────────┼─────────────────────┼─────────────────────┤          │
│           │   Agent Activity    │     Notes           │          │
│           │   (200px)           │     (flex-1)        │          │
└───────────┴─────────────────────┴─────────────────────┴──────────┘
```

### Resize handles

- 4px wide invisible hit area
- Shows on hover with visible handle
- Min widths per pane (sidebar: 64px, center: 400px, right: 300px)

### Pane persistence

```typescript
interface StoredLayout {
  workspaceKey: string // companyId-periodYear-periodMonth-intent
  layout: WorkspaceLayout
  savedAt: string // ISO timestamp
}
```

Saved to `localStorage` key: `drenyra:layout:{workspaceKey}`

## 5. Command Palette (⌘K)

### Command model

```typescript
type CommandCategory = 'navigation' | 'query' | 'execution'

interface Command {
  id: string
  label: string
  description: string
  category: CommandCategory
  icon?: string
  shortcut?: string
  riskLevel?: 'R0' | 'R1' | 'R2' | 'R3'
  execute: () => void | Promise<void>
  precondition?: () => boolean | Promise<boolean>
}

interface CommandPaletteState {
  isOpen: boolean
  query: string
  results: Command[]
  selectedIndex: number
  mode: 'default' | 'preview' // R2/R3 show preview mode
}
```

### Categories

| Category | Examples | Behavior |
|----------|----------|----------|
| **Navigation** | `Open company`, `Go to June 2026`, `Show cierre mensual` | Instant, no risk |
| **Query** | `Explain IGV variation`, `Find unusual entries`, `Compare periods` | Opens result in workspace |
| **Execution** | `Prepare close candidate`, `Start bank reconciliation`, `Request approval` | R1: undo available. R2: preview. R3: step-up auth |

### Command sources

- Static: registered on app init (navigate, open, switch)
- Dynamic: provided by current workspace context (queries, actions)
- Plugin: from skills/automations (future, Wave D)

## 6. Keyboard Model

### Global shortcuts

| Key | Action |
|-----|--------|
| `⌘K` | Open command palette |
| `⌘B` | Toggle sidebar |
| `⌘\` | Toggle right panel |
| `⌘W` | Close current pane |
| `⌘S` | Search (focused on current workspace) |
| `⌘1-9` | Switch to workspace N in recent list |
| `⌘,` | Open settings |
| `⌘⇧F` | Toggle focus mode |
| `Esc` | Close palette / dismiss overlay |

### Navigation shortcuts

| Key | Action |
|-----|--------|
| `⌘⇧]` | Next tab/pane |
| `⌘⇧[` | Previous tab/pane |
| `⌘↑` | Go up in hierarchy (period → company → portfolio → org) |
| `⌘↓` | Drill into focused item |

### Density mode shortcuts

| Key | Action |
|-----|--------|
| `⌘⇧C` | Toggle comfortable |
| `⌘⇧D` | Toggle default |
| `⌘⇧Z` | Toggle compact |

### Accessibility

- All actions must be reachable via keyboard alone
- Focus indicators required on all interactive elements
- Screen reader announcements for: pane open/close, layout change, density change
- `aria-label` on every icon-only button
- Keyboard navigation follows natural tab order

## 7. Performance budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Command palette open | < 100ms | `performance.mark()` |
| Pane switch (loaded) | Instant (< 16ms) | React profiler |
| Layout restore | < 300ms | `performance.mark()` |
| Company switch | No blank screen | Visual check + Suspense boundary |
| Sidebar toggle | < 50ms | React profiler |
| Density mode switch | < 100ms | CSS variable swap time |
