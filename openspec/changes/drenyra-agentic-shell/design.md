# SDD Design: Agentic Shell — Visual & Interaction Design

**Última actualización:** 2026-07-02
**Plan SDD:** 1 de 6 — Agentic Shell
**Fase:** Design
**Estado:** Borrador

---

## 1. Design Principles

1. **Minimal hasta el dolor** — menos chrome, más contenido. La shell no compite con el trabajo del usuario.
2. **Command-first** — ⌘K y la command bar son el entry point primario. Navegación por clics es secundaria.
3. **Contextual** — el right inspector aparece solo cuando hay algo que inspeccionar. No hay paneles fijos.
4. **Contraste fiscal** — colores premium (cocoa/graphite) con acentos funcionales (copper=acción, sage=éxito, amber=advertencia, restrained red=riesgo).
5. **Consistente con Fiscal Editorial v3** — respeta los design tokens existentes. No introduce nuevas variables de color.

---

## 2. Visual Design — Layout

### Desktop (>1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌───────────┬──────────────────────────────────┬─────────────────┐  │
│  │           │                                  │                 │  │
│  │  Drenyra  │                                  │   Inspector     │  │
│  │           │                                  │                 │  │
│  │  ◆ New    │    <main content>                │   ──────────   │  │
│  │    Thread │                                  │   Evidence      │  │
│  │  ◆ Review │    (router outlet)               │   Risk          │  │
│  │    Queue  │                                  │   Explanation   │  │
│  │  ◆ Agents │                                  │   Logs          │  │
│  │           │                                  │   Actions       │  │
│  │  ─────── │                                  │                 │  │
│  │  ○ Auto- │                                  │                 │  │
│  │    mations│                                  │                 │  │
│  │  ○ Skills│                                  │                 │  │
│  │  ○ Evid. │                                  │                 │  │
│  │    Vault │                                  │                 │  │
│  │           │                                  │                 │  │
│  │  ─────── │                                  │                 │  │
│  │  ○ Cli-  │                                  │                 │  │
│  │    entes │                                  │                 │  │
│  │  ○ Set-  │                                  │                 │  │
│  │    tings │                                  │                 │  │
│  │           │                                  │                 │  │
│  ├───────────┴──────────────────────────────────┴─────────────────┤  │
│  │  💬 Ask Drenyra anything...      @facturas  /sire  /audit  ⌘K  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

        240px               flex-1                       420px
      (collapsed: 64px)                         (hidden when no inspector)
```

### Mobile (<1024px)

```
┌──────────────────────────────────────────────┐
│  ☰ Andrés Capital SAC · Jun 2026        🔔👤 │  ← 56px AgenticTopBar
├──────────────────────────────────────────────┤
│                                              │
│  <main content>                              │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│  💬 Ask Drenyra...                    ⌘K     │  ← 48px CommandBar
└──────────────────────────────────────────────┘

  Sidebar slides in as overlay when hamburger tapped
```

### Sizing

| Element           | Desktop                 | Mobile                               |
| ----------------- | ----------------------- | ------------------------------------ |
| Sidebar width     | 240px (collapsed: 64px) | Full-width overlay (88vw, max 336px) |
| Content area      | `flex-1`                | `flex-1`                             |
| Inspector width   | 420px                   | Hidden (slide up as modal)           |
| CommandBar height | 48px                    | 48px                                 |
| TopBar height     | Hidden on desktop       | 56px                                 |

---

## 3. Component Designs

### 3.1 AgenticSidebar

**Structure:**

```
┌──────────────────────┐  ← rounded-none, border-r
│ [Toggle button]       │  ← chevrons, collapse/expand
│                       │
│   ✦ Drenyya           │  ← logo + brand (only when expanded)
│                       │
│  ── WORKSPACE ──     │  ← section label (only when expanded)
│  ◆ New Thread     (3) │  ← icon + label + badge
│  ◆ Review Queue  (12) │  ← icon + label + critical badge
│  ◆ Agents         (2) │  ← icon + label + info badge
│                       │
│  ── PLATFORM ────    │
│  ○ Automations        │
│  ○ Skills             │
│  ○ Evidence Vault     │
│                       │
│  ── ORGANIZATION ──  │
│  ○ Clientes           │
│  ○ Settings           │
│                       │
│ ───────────────────── │
│  👤 User              │  ← user avatar + name (collapse: avatar only)
│  ⚙️                   │  ← settings gear
└──────────────────────┘
```

**Collapsed state (64px):**

```
┌──────┐
│  ☰   │
│      │
│  ✦   │
│      │
│  ✚   │  ← New Thread (icon only)
│  ✓   │  ← Review Queue (icon only + dot badge)
│  ◆   │  ← Agents (icon only)
│      │
│  ⏱   │  ← Automations
│  🧩  │  ← Skills
│  📋  │  ← Evidence Vault
│      │
│  🏢  │  ← Clientes
│  ⚙   │  ← Settings
│      │
│  👤  │
└──────┘
```

**Visual tokens:**

- Background: `var(--surface-1)`
- Border: `var(--border-subtle)`
- Section labels: text-[10px] uppercase tracking-wider `var(--text-muted)`
- Nav items: `var(--text-secondary)` → hover `var(--text-primary)` + `var(--surface-hover)`
- Active item: `var(--color-primary)` text with subtle bg highlight
- Badge: `var(--color-danger)` for critical, `var(--color-warning)` for warning, `var(--color-info)` for info

**States:**

| State        | Behavior                                                              |
| ------------ | --------------------------------------------------------------------- |
| Default      | All items visible. First item (New Thread) focused if no route active |
| Active route | Item highlighted with accent color + left border indicator            |
| Hover        | Background changes to `var(--surface-hover)`                          |
| Collapsed    | 64px width, icon-only, no labels. Tooltip on hover                    |
| Mobile       | Full overlay with backdrop. Close on outside click or Escape          |
| Focus mode   | Width 0, hidden. Content takes full width                             |

### 3.2 AgenticCommandBar

**Structure (desktop):**

```
┌─────────────────────────────────────────────────────────────────────┐
│ 💬 Ask Drenyra anything...  [  @facturas  /sire  /audit  /close  ]  │
└─────────────────────────────────────────────────────────────────────┘
```

**Structure (mobile):**

```
┌──────────────────────────────────────┐
│ 💬 Ask Drenyra...              ⌘K   │
└──────────────────────────────────────┘
```

**Visual tokens:**

- Background: `var(--surface-1)`/95 with `backdrop-blur-sm`
- Border-top: `var(--border-subtle)`
- Input bg: `var(--surface-2)`
- Input text: `var(--text-primary)`
- Placeholder: `var(--text-muted)`
- @chips: rounded-full border `var(--border-subtle)` text-2xs `var(--text-tertiary)`
- /chips: same as @chips but with accent color for skill prefix

**Interaction design:**

```
1. DEFAULT STATE
   ┌──────────────────────────────────────────────────┐
   │ 💬 Ask Drenyra anything...        @ /      ⌘K   │
   └──────────────────────────────────────────────────┘

2. TYPING — shows inline suggestions
   ┌──────────────────────────────────────────────────┐
   │ 💬 cerrar mes para andes sac                     │
   └──────────────────────────────────────────────────┘
   │ → "Cerrar mes" — Andrés Capital SAC · Jun 2026  │
   │ → Thread: Cierre Jun 2026 (3 tareas pendientes) │
   │ → Skill: /close                                  │
   └──────────────────────────────────────────────────┘

3. @ REFERENCE
   ┌──────────────────────────────────────────────────┐
   │ 💬 @                                             │
   └──────────────────────────────────────────────────┘
   │ ┌ @facturas — buscar en facturas del periodo    │
   │ │ @banco — buscar en movimientos bancarios       │
   │ │ @comprobantes — buscar en SIRE comprobantes    │
   │ └ @cliente — cambiar cliente activo              │
   └──────────────────────────────────────────────────┘

4. / SKILL
   ┌──────────────────────────────────────────────────┐
   │ 💬 /                                             │
   └──────────────────────────────────────────────────┘
   │ ┌ /sire — Validar SIRE compras                   │
   │ │ /close — Preparar cierre mensual               │
   │ │ /audit — Revisar riesgos fiscales              │
   │ │ /sunat — Consultar SUNAT                       │
   │ └ /reconcile — Conciliar bancos                  │
   └──────────────────────────────────────────────────┘

5. ENTER — creates a new thread with the prompt
   Navigates to /threads/new?q=<encoded prompt>
```

### 3.3 CommandPalette

**Visual tokens:**

- Overlay: `rgba(0,0,0,0.4)` backdrop
- Surface: `var(--surface-1)` with `var(--border-subtle)` border
- Input: transparent bg, `var(--text-primary)`
- Section headers: `var(--text-muted)` text-[10px] uppercase
- Items: `var(--text-primary)` with `var(--accent-subtle)` hover
- Shortcut key: `var(--surface-2)` bg, `var(--text-muted)` text
- Max height: 50vh
- Width: 480px (max-w-md)

**Categories and sample commands:**

```
RECENT
  ┌ 🔄 Validar SIRE — Andrés Capital SAC           ⌘1 ┐
  └ 🔄 Conciliar BCP — Nova SAC                    ⌘2 ┘

NAVIGATION
  ┌ 🧵 New Thread                                    ┐
  │ 📋 Review Queue                                   │
  │ 💻 Agents                                         │
  │ ⏱ Automations                                    │
  │ 🧩 Skills                                         │
  │ 📁 Evidence Vault                                 │
  │ 🏢 Clientes                                       │
  └ ⚙ Settings                                       ┘

ACTIONS
  ┌ 📤 Subir factura                                  ┐
  │ 📥 Importar extracto bancario                     │
  └ 📄 Exportar reporte                               ┘

AGENTS
  ┌ 🤖 SIRE Agent — Andrés Capital SAC                ┐
  │ 🤖 Reconciliation Agent — Nova SAC                │
  └ 🤖 Tax Risk Agent — Luna EIRL                    ┘
```

**Global keyboard shortcuts registered:**

| Shortcut | Action                                  |
| -------- | --------------------------------------- |
| ⌘K       | Open/close command palette              |
| Escape   | Close command palette / close inspector |
| ⌘1-9     | Quick execute recent commands           |
| ⌘N       | New thread                              |
| ⌘R       | Go to review queue                      |
| ⌘,       | Settings                                |

### 3.4 RightInspector

**Structure:**

```
┌──────────────────────────────┐  ← 420px, border-left
│  [Close ×]   [Pin 📌]       │  ← header
│  Inspector: Diff #2841      │  ← title
├──────────────────────────────┤
│                              │
│  <pluggable panel content>   │  ← determined by panel.type
│                              │
│  ── Actions ──              │
│  [Approve] [Edit] [Reject]  │
└──────────────────────────────┘
```

**Visual tokens:**

- Background: `var(--surface-1)` or `var(--color-bg-0)` (reusing FiscalInspector tokens)
- Border-left: `var(--color-stroke-1)` or `var(--border-default)`
- Width: 420px (matching ArtifactRegistry)
- Animation: slide in from right, 200ms ease-out

**Panel routing:**

```typescript
function RightInspectorContent({ panel }: { panel: InspectorPanel }) {
  switch (panel.type) {
    case 'thread':
      return <InspectorThreadPanel id={panel.id} />
    case 'diff':
      return <InspectorDiffPanel id={panel.id} />
    case 'agent':
      return <InspectorAgentPanel id={panel.id} />
    case 'evidence':
      return <InspectorEvidencePanel id={panel.id} />
    case 'fiscal':
      return <InspectorFiscalPanel id={panel.id} />
  }
}
```

**Empty state:**

```
┌──────────────────────────────┐
│                              │
│   🔍                        │
│   Select a thread, diff,    │
│   or agent to inspect       │
│                              │
│   Recent activity will      │
│   appear here               │
│                              │
└──────────────────────────────┘
```

### 3.5 WorkspaceSelector

**Structure (expanded):**

```
┌──────────────────────────────────────┐
│ 🏢 Andrés Capital SAC         ▼     │  ← current org
│ RUC: 20123456789                     │
│ Periodo: Junio 2026                  │
├──────────────────────────────────────┤
│ ── Cambiar empresa ──               │
│ ○ Andrés Capital SAC     (actual)   │
│ ○ Nova SAC                          │
│ ○ Luna EIRL                         │
│ ○ Agroexport Norte                  │
├──────────────────────────────────────┤
│ ── Cambiar periodo ──               │
│ ○ Julio 2026     (en curso)         │
│ ● Junio 2026     (activo)           │
│ ○ Mayo 2026                         │
└──────────────────────────────────────┘
```

**Compact (mobile):**

```
┌──────────────────────────────┐
│ 🏢 Andrés Capital · Jun 2026 ▼ │
└──────────────────────────────┘
```

### 3.6 AgenticTopBar (mobile only)

```
┌──────────────────────────────────────────────────────┐
│  ☰    🏢 Andrés Capital · Jun 2026        🔔(3)  👤  │
└──────────────────────────────────────────────────────┘
```

- Height: 56px
- Background: `var(--surface-1)`
- Border-bottom: `var(--border-subtle)`
- Shadow: `shadow-sm`

---

## 4. Animations

| Element                 | Animation                     | Duration | Easing                          |
| ----------------------- | ----------------------------- | -------- | ------------------------------- |
| Sidebar collapse/expand | Width transition              | 300ms    | ease-in-out                     |
| Sidebar mobile open     | Slide from left               | 300ms    | ease-in-out                     |
| Mobile overlay fade     | Opacity                       | 200ms    | ease-out                        |
| RightInspector slide    | Width + opacity               | 200ms    | [0.4, 0, 0.2, 1] (cubic-bezier) |
| CommandBar focus        | Border color                  | 150ms    | ease                            |
| CommandPalette open     | Scale + opacity (from center) | 150ms    | ease-out                        |
| Badge count change      | Scale pulse                   | 200ms    | ease                            |

```css
/* Sidebar */
.sidebar-collapse {
  transition: width 300ms ease-in-out;
}

/* Inspector */
@media (prefers-reduced-motion: no-preference) {
  .inspector-enter {
    animation: slideInRight 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .inspector-exit {
    animation: slideOutRight 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@keyframes slideInRight {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 420px;
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    width: 420px;
    opacity: 1;
  }
  to {
    width: 0;
    opacity: 0;
  }
}
```

---

## 5. Responsive Breakpoints

```typescript
const BREAKPOINTS = {
  mobile: 639, // max-width: 639px — hamburger sidebar, compact command bar
  tablet: 1023, // 640-1023px — collapsible sidebar, mobile top bar
  desktop: 1024, // min-width: 1024px — full sidebar, hidden top bar
}
```

| Feature        | <640px             | 640-1023px             | ≥1024px            |
| -------------- | ------------------ | ---------------------- | ------------------ |
| Sidebar        | Overlay (tappable) | Overlay or collapsible | Fixed, collapsible |
| TopBar         | Visible            | Visible                | Hidden             |
| CommandBar     | Compact (no chips) | Full                   | Full               |
| RightInspector | Hidden (modal)     | Hidden (modal)         | Visible (420px)    |
| Content area   | Full width         | Sidebar-adjacent       | Sidebar-adjacent   |

---

## 6. States

### 6.1 AgenticSidebar

| State                    | Visual                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| **Loading**              | Skeleton: 6 placeholder items with pulse animation                |
| **Loaded — empty**       | All nav items render. No badges.                                  |
| **Loaded — with badges** | Badges show on Review Queue (critical count), Agents (info count) |
| **Active route**         | Current route item highlighted with accent                        |
| **Collapsed**            | 64px, icon-only. Tooltip on hover.                                |
| **Mobile**               | Full overlay. Close button. Backdrop.                             |

### 6.2 AgenticCommandBar

| State           | Visual                                                   |
| --------------- | -------------------------------------------------------- |
| **Default**     | "Ask Drenyra anything..." placeholder. @/ chips visible. |
| **Focused**     | Border highlight. Chips expand to suggestions.           |
| **Typing**      | Suggestions dropdown appears below input                 |
| **@ prefix**    | Reference autocomplete: @facturas, @banco, @comprobantes |
| **/ prefix**    | Skill autocomplete: /sire, /close, /audit, /sunat        |
| **Empty input** | Suggestions hide. Placeholder shows.                     |
| **Loading**     | Spinner next to input while processing                   |

### 6.3 RightInspector

| State                   | Visual                                  |
| ----------------------- | --------------------------------------- |
| **Closed**              | Hidden. Content takes full width.       |
| **Opening**             | Slide in from right, 200ms              |
| **Open — with content** | Panel renders based on type             |
| **Open — empty**        | "Select an item to inspect" empty state |
| **Closing**             | Slide out to right, 200ms               |
| **Mobile**              | Full-screen modal slide up from bottom  |

### 6.4 CommandPalette

| State          | Visual                                                  |
| -------------- | ------------------------------------------------------- |
| **Closed**     | Not rendered                                            |
| **Opening**    | Scale up from center (transform + opacity)              |
| **Default**    | Recent commands + categories                            |
| **Filtering**  | Results update as user types. "No results" if no match. |
| **No results** | Search icon + "No commands match..." message            |
| **Closing**    | Scale down + fade out                                   |

---

## 7. Accessibility

| Requirement    | Implementation                                                        |
| -------------- | --------------------------------------------------------------------- |
| Skip link      | "Saltar al contenido principal" link (preserved from MainLayoutShell) |
| ARIA labels    | All interactive elements have `aria-label`                            |
| Keyboard nav   | Tab through sidebar items. Arrow keys in command palette.             |
| Focus trap     | Command palette traps focus when open                                 |
| Reduced motion | All animations respect `prefers-reduced-motion: reduce`               |
| Color contrast | All text contrasts meet WCAG AA minimum                               |
| Screen reader  | Sidebar items announce badge counts. Inspector announces open/close.  |

---

## 8. Integration with Fiscal Editorial v3

### What to keep from FiscalEditorialShell

- `data-shell-mode` and `data-design-system` attributes
- CSS class `fiscal-editorial-shell`
- Background `var(--bg-primary)`, text `var(--text-primary)`
- `h-[100dvh] overflow-hidden` for operational mode

### What changes

- AgenticLayout wraps FiscalEditorialShell directly (removes old MainLayoutShell layer)
- Mode remains "operational" for general work
- RightInspector uses FiscalInspector sub-components for fiscal panels
- All design tokens remain unchanged — no new CSS variables

### Deprecation path

```
┌────────────────────────────────────────────────────┐
│ BEFORE:                                           │
│ FiscalEditorialShell                              │
│   └─ MainLayoutShell                             │
│        ├─ Sidebar                                │
│        ├─ MainLayoutContent                      │
│        │    ├─ ArtifactRegistry (right)          │
│        │    └─ FiscalInspector (right, overlay)  │
│        ├─ MainLayoutTopBar                       │
│        └─ MainLayoutMobileNav                    │
│                                                   │
│ AFTER:                                            │
│ FiscalEditorialShell                              │
│   └─ AgenticLayout                                │
│        ├─ AgenticSidebar                         │
│        ├─ <Outlet />                              │
│        ├─ RightInspector (unified)               │
│        │    ├─ InspectorFiscalPanel              │
│        │    ├─ InspectorEvidencePanel            │
│        │    └─ ...                               │
│        ├─ AgenticCommandBar                      │
│        ├─ AgenticTopBar (mobile only)            │
│        └─ CommandPalette (overlay)               │
└────────────────────────────────────────────────────┘
```

---

## 9. File Dependencies

```
AgenticLayout
  ├── FiscalEditorialShell      (existing, unchanged)
  ├── AgenticSidebar            (new)
  │   ├── AgenticSidebarNavItems
  │   ├── AgenticSidebarFooter
  │   ├── AgenticSidebarToggle
  │   └── AgenticSidebarBadge
  ├── AgenticTopBar             (new, mobile only)
  │   └── WorkspaceSelector     (new, refined from ActiveCompanySwitcher)
  ├── RightInspector            (new)
  │   └── InspectorFiscalPanel  (new, wraps FiscalInspectorDetail)
  ├── AgenticCommandBar          (new)
  ├── CommandPalette             (new, refined from DrenyraCommandPalette)
  └── zustand: agentic-shell.store
       └── stores sidebar/inspector/palette/workspace state
```

---

## 10. Loading States (Skeleton UI)

### Sidebar skeleton

```
┌──────────────────────┐
│  ██  ████████████    │  ← toggle placeholder
│                      │
│  ✦                   │  ← logo
│                      │
│  ── WORKSPACE ──    │
│  ██  ██████          │  ← pulse animation
│  ██  ████████████    │
│  ██  ██████          │
│                      │
│  ── PLATFORM ────   │
│  ██  ████████████    │
│  ██  ██████          │
│  ██  ████████████    │
└──────────────────────┘
```

### Inspector skeleton (when loading panel data)

```
┌──────────────────────────────┐
│  ████████████              × │
├──────────────────────────────┤
│  ████████████████████████    │
│  ██████████                  │
│                              │
│  ████████████████████        │
│  ████████████████████████    │
│  ██████                      │
│                              │
│  ██████████████████████████  │
└──────────────────────────────┘
```

---

## 11. Error States

| Scenario                                | Handling                                                     |
| --------------------------------------- | ------------------------------------------------------------ |
| Sidebar fails to load nav items         | Show minimal sidebar with just logo and settings. Log error. |
| CommandBar fails to load suggestions    | Show input-only. No @/ chips.                                |
| RightInspector panel fails              | Show error state inside panel: "Failed to load. [Retry]"     |
| CommandPalette fails to open            | Log error silently. Fallback: browser native address bar.    |
| WorkspaceSelector fails to load clients | Show "No client selected". Retry button.                     |
