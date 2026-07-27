# SDD-WB-001 — Application Shell & Workspace Hierarchy

**Change ID:** `sdd-wb-001`
**Capability:** CAP-WB-01 (Application Shell & Hierarchy)
**Wave:** A (Shell)
**Created:** 2026-07-27
**Status:** proposal
**Delivery constraint:** auto-forecast, 400-line review budget, strict TDD

## Purpose

Evolve Drenyra's shell from a fixed three-panel layout into an **operational workbench** with a proper workspace hierarchy, persistent layout, dynamic panes, universal command palette, and keyboard-first navigation.

## Current-state gap

| Area | Current state | Target state |
|------|---------------|--------------|
| **Workspace hierarchy** | No workspace model. Users navigate routes directly. | Org → Portfolio → Company → Period → Workspace as first-class navigation |
| **Sidebar** | AgenticSidebar with 3 sections, collapsible to 64px. Static nav items. | Context-aware sidebar showing current workspace hierarchy + active workstreams |
| **Company/period** | `ActiveCompanySwitcher` exists as separate component, not integrated into shell | Top bar company/period selector visible in all workspace routes |
| **Pane system** | Fixed three panels (sidebar | main | right). No resize, no persistence. | Dynamic panes per workspace: resizable, detachable, persistable |
| **Layout persistence** | No layout save/restore | Per-workspace layout persisted to localStorage, restored on reattach |
| **Command palette** | `CommandPalette` component exists but route-specific | Universal ⌘K: navigation commands, query commands, execution commands |
| **Keyboard model** | `useCodexKeyboardShortcuts` hook exists for basic shortcuts | Full keyboard model: shortcuts, three density modes, accessibility |

## Scope

### Included

1. **Workspace hierarchy model** — TypeScript types and context provider for `Org → Portfolio → Company → Period → Workspace`. The `Workspace` model is the central navigation concept.
2. **Sidebar evolution** — Add workspace-aware section at top (current company/period, recent workspaces). Keep existing 3-section structure but make nav items context-sensitive.
3. **Company/period switcher** — Integrate into shell's top bar. Switches workspace scope globally with animated transition.
4. **Dynamic pane system** — Allow workspaces to define their own pane layout (split, resize, close). Default: sidebar | main | right. Power user: multi-pane ledger, SIRE, evidence.
5. **Layout persistence** — Save pane layout + sidebar state per workspace to `localStorage`. Restore on reopen. Reset option.
6. **Universal command palette (⌘K)** — Global palette with 3 command classes: navigation (`Open company`, `Go to period`), query (`Explain variance`, `Find entry`), execution (`Prepare close`, `Request approval`). R2/R3 commands show preview.
7. **Keyboard model** — Three density modes (Comfortable / Default / Compact). Persisted per user. Full keyboard nav: `⌘K`, `⌘B` sidebar, `⌘\` right panel, `⌘W` close pane, `⌘S` search, `⌘1-9` switch workspaces.
8. **Three panel sizes** (from the vision): Comfortable (executives), Default (daily ops), Compact (power accountants).

### Non-goals

- Agent state, activity feed, or event streaming (Wave B)
- Financial Change Sets, diffs, or evidence inspector (Wave C)
- Attention inbox, approvals, or automations (Wave D)
- Tauri desktop shell or mobile (future waves)
- Rebuilding existing route content — only the shell that wraps it

## Existing SDDs to evolve

| SDD | Status | Relationship |
|-----|--------|-------------|
| `drenyra-agentic-shell` | ✅ applied | Sidebar structure and nav items → evolved |
| `drenyra-global-shell` | ✅ applied | Three-panel as global layout → evolved into dynamic pane system |
| `drenyra-three-panel-layout` | ✅ applied | Fixed panels → dynamic |
| `drenyra-frontend-command-center-reset` | ✅ applied | Command center → universal ⌘K palette |
| `drenyra-component-states` | ✅ applied | Density/state → keyboard model |

## Key design decisions

1. **Workspace is the central model.** Not routes. A workspace = Company + Period + Intent (close, reconcile, review, investigate). Routes become views within a workspace context.
2. **Panes are presentation-only.** They never own domain logic. A pane renders a view (ledger, SIRE, diff, evidence) and can be moved/resized/closed without affecting data.
3. **Layout is per-workspace.** Save to localStorage per `company-period-workspaceType` key. Restore on navigation. Reset available.
4. **⌘K is universal.** Navigation commands are always available. Query/execution commands are context-sensitive based on current workspace and permissions.
5. **Density is a user preference.** Persisted across sessions. Three modes: comfortable (spacious, readable), default (balanced), compact (dense, power-user).
