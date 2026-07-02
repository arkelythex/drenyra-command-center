# Tasks — Agentic Shell (Plan 1)

**Última actualización:** 2026-07-02
**Estrategia:** auto-chain — 3 PRs
**Review budget:** 400 líneas por PR

---

## Review Workload Forecast

| PR  | Scope                                 | Archivos | Líneas estimadas | Review time |
| --- | ------------------------------------- | -------- | ---------------- | ----------- |
| PR1 | AgenticLayout + Sidebar + routing     | 12-15    | ~350             | 15-20 min   |
| PR2 | CommandBar + Palette + RightInspector | 15-18    | ~400             | 20-25 min   |
| PR3 | WorkspaceSelector + TopBar + cleanup  | 10-12    | ~250             | 10-15 min   |

**Total:** ~1,000 líneas · 3 PRs reviewables individualmente

---

## PR1: AgenticLayout + AgenticSidebar + routing tree

### Implementation tasks

- [ ] **PR1-1**: Create `stores/agentic-shell.store.ts` with Zustand store:
  - `isSidebarCollapsed`, `isSidebarMobileOpen`, toggle/setters
  - `activeInspector`, `openInspector`, `closeInspector`
  - `isCommandPaletteOpen`, `openCommandPalette`, `closeCommandPalette`
  - `isFocusMode`, `setFocusMode`
  - Persist `isSidebarCollapsed` and `isFocusMode` to localStorage

- [ ] **PR1-2**: Create `lib/navigation/items/agentic.ts` with agentic nav items:
  - 3 sections: workspace (New Thread, Review Queue, Agents), platform (Automations, Skills, Evidence Vault), organization (Clients, Settings)
  - Each item: id, section, label, icon, route, badge (dynamic via state)

- [ ] **PR1-3**: Create `lib/navigation/items/legacy.ts` with legacy items:
  - All existing nav items marked with `showInSidebar: false`
  - Preserved for command palette and direct URL access

- [ ] **PR1-4**: Create `components/agentic-shell/AgenticLayout/AgenticLayout.types.ts`:
  - Types: `AgenticLayoutProps`, `AgenticLayoutContextValue`, `InspectorPanel`, `WorkspaceSelection`

- [ ] **PR1-5**: Create `components/agentic-shell/AgenticLayout/AgenticLayout.context.tsx`:
  - React context provider wrapping Zustand store
  - Provides: workspace selection, inspector actions, command palette actions
  - `useAgenticLayout()` hook

- [ ] **PR1-6**: Create `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`:
  - Wraps FiscalEditorialShell
  - 3-column layout: sidebar | content | right inspector (conditional)
  - Responsive: sidebar overlay on mobile, fixed on desktop
  - Handles focus mode (hides sidebar)
  - Registers global keyboard shortcut for ⌘K

- [ ] **PR1-7**: Create `components/agentic-shell/AgenticSidebar/AgenticSidebar.types.ts`:
  - `AgenticSidebarProps`, `AgenticNavSectionId`, `AgenticNavItem`

- [ ] **PR1-8**: Create `components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`:
  - `AGENTIC_NAV_ITEMS` array with all 8 items across 3 sections
  - `AGENTIC_SECTION_CONFIG` with section labels and order

- [ ] **PR1-9**: Create `components/agentic-shell/AgenticSidebar/components/AgenticSidebarToggle.tsx`:
  - Collapse/expand button with chevron icon animation

- [ ] **PR1-10**: Create `components/agentic-shell/AgenticSidebar/components/AgenticSidebarNavItems.tsx`:
  - Renders sections with headers and nav items
  - Handles active route highlighting
  - Shows badges
  - Collapsed mode: icon-only with tooltips

- [ ] **PR1-11**: Create `components/agentic-shell/AgenticSidebar/components/AgenticSidebarFooter.tsx`:
  - User avatar + name
  - Settings gear icon
  - Collapsed: user avatar only

- [ ] **PR1-12**: Create `components/agentic-shell/AgenticSidebar/AgenticSidebar.tsx`:
  - Assembles toggle + logo + nav items + footer
  - Handles collapse/expand animation
  - Handles mobile overlay

- [ ] **PR1-13**: Create `components/agentic-shell/AgenticLayout/AgenticLayout.loading.tsx`:
  - Skeleton UI for sidebar (pulse placeholders)

- [ ] **PR1-14**: Modify `routes/__root.tsx`:
  - Replace `MainLayoutView` with `AgenticLayout`
  - Keep error boundaries and global providers

- [ ] **PR1-15**: Modify `routes/index.tsx`:
  - Change redirect from `/dashboard` to `/threads/new`

- [ ] **PR1-16**: Add new routes to route tree:
  - `/threads/new` (placeholder: "Threads coming in Plan 2")
  - `/review` (placeholder: "Review Queue coming in Plan 4")
  - `/agents` (placeholder: "Agents Window coming in Plan 3")
  - `/automations` (placeholder: "Automations coming in Plan 5")
  - `/skills` (placeholder: "Skills coming in Plan 5")
  - `/clients` (placeholder, or reuse existing ControlTower)

- [ ] **PR1-17**: Update `lib/navigation/types.ts`:
  - Add `workspace-section`, `platform-section`, `organization-section` to `NavigationSectionId`
  - Add `AGENTIC_GROUP_ORDER` constant

### Verification (PR1)

```bash
bun run typecheck
bun run lint apps/web/src/components/agentic-shell/
bun run test:run -- apps/web/src/components/agentic-shell/
bun run build
bun run check:bundle
```

### Files in scope (PR1)

| File                                                                            | Action               |
| ------------------------------------------------------------------------------- | -------------------- |
| `stores/agentic-shell.store.ts`                                                 | CREATE               |
| `lib/navigation/items/agentic.ts`                                               | CREATE               |
| `lib/navigation/items/legacy.ts`                                                | CREATE               |
| `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`                      | CREATE               |
| `components/agentic-shell/AgenticLayout/AgenticLayout.types.ts`                 | CREATE               |
| `components/agentic-shell/AgenticLayout/AgenticLayout.context.tsx`              | CREATE               |
| `components/agentic-shell/AgenticLayout/AgenticLayout.loading.tsx`              | CREATE               |
| `components/agentic-shell/AgenticSidebar/AgenticSidebar.tsx`                    | CREATE               |
| `components/agentic-shell/AgenticSidebar/AgenticSidebar.types.ts`               | CREATE               |
| `components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`                | CREATE               |
| `components/agentic-shell/AgenticSidebar/components/AgenticSidebarToggle.tsx`   | CREATE               |
| `components/agentic-shell/AgenticSidebar/components/AgenticSidebarNavItems.tsx` | CREATE               |
| `components/agentic-shell/AgenticSidebar/components/AgenticSidebarFooter.tsx`   | CREATE               |
| `routes/__root.tsx`                                                             | MODIFY               |
| `routes/index.tsx`                                                              | MODIFY               |
| `lib/navigation/types.ts`                                                       | MODIFY               |
| `routes/threads/new.tsx`                                                        | CREATE (placeholder) |
| `routes/review.tsx`                                                             | CREATE (placeholder) |
| `routes/agents.tsx`                                                             | CREATE (placeholder) |
| `routes/automations.tsx`                                                        | CREATE (placeholder) |
| `routes/skills.tsx`                                                             | CREATE (placeholder) |

---

## PR2: AgenticCommandBar + CommandPalette + RightInspector

### Implementation tasks

- [ ] **PR2-1**: Create `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.types.ts`:
  - `AgenticCommandBarProps`, `CommandSuggestion`, `ReferenceType`, `SkillCommand`

- [ ] **PR2-2**: Create `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.data.ts`:
  - `QUICK_REFERENCES`: @facturas, @banco, @comprobantes, @cliente
  - `SKILL_COMMANDS`: /sire, /close, /audit, /sunat, /reconcile
  - `QUICK_PROMPTS`: "Preparar declaración IGV", "Conciliar bancos", etc.

- [ ] **PR2-3**: Create `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.tsx`:
  - Input with placeholder: "Ask Drenyra anything..."
  - @ reference autocomplete (shows when typing @)
  - / skill autocomplete (shows when typing /)
  - Enter creates new thread with prompt
  - Chips for @ and / suggestions
  - Desktop: full width with chips. Mobile: compact.

- [ ] **PR2-4**: Create `components/agentic-shell/CommandPalette/CommandPalette.types.ts`:
  - `CommandPaletteCommand`, `CommandCategory`

- [ ] **PR2-5**: Create `components/agentic-shell/CommandPalette/CommandPalette.data.ts`:
  - Command registry: all routes (agentic + legacy), actions, agent commands
  - Categories: recent, navigation, actions, agents

- [ ] **PR2-6**: Create `components/agentic-shell/CommandPalette/CommandPalette.hooks.ts`:
  - `useCommandPalette` hook: ⌘K handler, escape handler, filter logic
  - `usePaletteKeyboard` hook: arrow navigation, enter selection

- [ ] **PR2-7**: Create `components/agentic-shell/CommandPalette/CommandPalette.tsx`:
  - Overlay with backdrop
  - Search input
  - Category-grouped results
  - Keyboard navigation (arrow keys, enter, escape)
  - Recent commands persisted in localStorage
  - Lazy-loaded: suspense with skeleton

- [ ] **PR2-8**: Create `components/agentic-shell/RightInspector/RightInspector.types.ts`:
  - `RightInspectorProps`, `InspectorPanelConfig`

- [ ] **PR2-9**: Create `components/agentic-shell/RightInspector/RightInspector.context.tsx`:
  - Context provider for inspector panel state
  - `useInspector()` hook

- [ ] **PR2-10**: Create `components/agentic-shell/RightInspector/RightInspector.tsx`:
  - Slides in from right (420px)
  - Panel router: thread | diff | agent | evidence | fiscal
  - Animated with framer-motion
  - Empty state
  - Close and pin buttons
  - Mobile: full-screen modal

- [ ] **PR2-11**: Create `components/agentic-shell/RightInspector/panels/InspectorFiscalPanel.tsx`:
  - Wraps existing `FiscalInspectorDetail` component
  - Adapter props from InspectorPanel to FiscalInspectorDetail props

- [ ] **PR2-12**: Modify `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`:
  - Wire CommandBar into layout footer
  - Wire CommandPalette (lazy-loaded overlay)
  - Wire RightInspector into right column

- [ ] **PR2-13**: Modify `hooks/useKeyboardShortcuts.ts`:
  - Add ⌘K binding (if not already present)
  - Add Escape binding (close palette/inspector)

### Verification (PR2)

```bash
bun run typecheck
bun run lint apps/web/src/components/agentic-shell/
bun run test:run -- apps/web/src/components/agentic-shell/
bun run build
```

### Files in scope (PR2)

| File                                                                      | Action |
| ------------------------------------------------------------------------- | ------ |
| `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.tsx`        | CREATE |
| `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.types.ts`   | CREATE |
| `components/agentic-shell/AgenticCommandBar/AgenticCommandBar.data.ts`    | CREATE |
| `components/agentic-shell/CommandPalette/CommandPalette.tsx`              | CREATE |
| `components/agentic-shell/CommandPalette/CommandPalette.types.ts`         | CREATE |
| `components/agentic-shell/CommandPalette/CommandPalette.data.ts`          | CREATE |
| `components/agentic-shell/CommandPalette/CommandPalette.hooks.ts`         | CREATE |
| `components/agentic-shell/RightInspector/RightInspector.tsx`              | CREATE |
| `components/agentic-shell/RightInspector/RightInspector.types.ts`         | CREATE |
| `components/agentic-shell/RightInspector/RightInspector.context.tsx`      | CREATE |
| `components/agentic-shell/RightInspector/panels/InspectorFiscalPanel.tsx` | CREATE |
| `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`                | MODIFY |
| `hooks/useKeyboardShortcuts.ts`                                           | MODIFY |

---

## PR3: WorkspaceSelector + AgenticTopBar + legacy cleanup

### Implementation tasks

- [ ] **PR3-1**: Create `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.types.ts`:
  - `WorkspaceSelectorProps`, `OrganizationOption`, `PeriodOption`, `WorkspaceSelection`

- [ ] **PR3-2**: Create `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.data.ts`:
  - Mock/client data for testing (will connect to real API in later PR)

- [ ] **PR3-3**: Create `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.tsx`:
  - Current org display: name + RUC + period + fiscal status
  - Dropdown: switch organization
  - Dropdown: switch period
  - Compact mode for mobile
  - Preserves `ActiveCompanySwitcher` behavior

- [ ] **PR3-4**: Create `components/agentic-shell/AgenticTopBar/AgenticTopBar.types.ts`:
  - `AgenticTopBarProps`

- [ ] **PR3-5**: Create `components/agentic-shell/AgenticTopBar/AgenticTopBar.tsx`:
  - Mobile-only top bar (hidden on desktop via CSS)
  - Hamburger → mobile sidebar
  - WorkspaceSelector (compact)
  - Notification bell with badge count
  - User menu (preserves existing UserMenu component)

- [ ] **PR3-6**: Modify `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`:
  - Wire AgenticTopBar (mobile only)
  - Wire WorkspaceSelector into sidebar or top bar

- [ ] **PR3-7**: Deprecate old layout files:
  - `components/layout/MainLayout/` — keep but add deprecation notice in comments
  - `components/layout/Sidebar/` — same
  - `components/layout/MainLayoutTopBar.tsx` — keep for backward compat
  - `components/layout/ActiveCompanySwitcher.tsx` — optionally keep as thin wrapper around WorkspaceSelector

- [ ] **PR3-8**: Verify all imports:
  - Search for `from "@/components/layout/MainLayout"` usage
  - Search for `from "@/components/layout/Sidebar"` usage
  - Ensure old paths still resolve (re-exports) or update imports

- [ ] **PR3-9**: Final verification:
  - All routes work (agentic + legacy)
  - Mobile responsive works at all breakpoints
  - Keyboard shortcuts work
  - Sidebar persistence works after page reload

### Verification (PR3)

```bash
bun run typecheck
bun run lint apps/web/src/
bun run test:run
bun run build
bun run check:bundle
# Manual: test all breakpoints, all routes, all keyboard shortcuts
```

### Files in scope (PR3)

| File                                                                    | Action |
| ----------------------------------------------------------------------- | ------ |
| `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.tsx`      | CREATE |
| `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.types.ts` | CREATE |
| `components/agentic-shell/WorkspaceSelector/WorkspaceSelector.data.ts`  | CREATE |
| `components/agentic-shell/AgenticTopBar/AgenticTopBar.tsx`              | CREATE |
| `components/agentic-shell/AgenticTopBar/AgenticTopBar.types.ts`         | CREATE |
| `components/agentic-shell/AgenticLayout/AgenticLayout.tsx`              | MODIFY |

---

## Gates (every PR)

```bash
bun run typecheck           # TypeScript strict
bun run lint                # ESLint
bun run test:run            # Vitest
bun run build               # Vite production build
bun run check:bundle        # Bundle budget
```

---

## Post-implementation

- [ ] Verify `openspec/changes/drenyra-agentic-shell/state.yaml` updated to `phase: completed`
- [ ] Create verify-report.md with build evidence and spec compliance matrix
- [ ] Archive SDD change (phase: archived)
