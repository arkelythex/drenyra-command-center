<!-- Manual navigation map for Drenyra Web (React SPA). See CODEX-MAP.md for monorepo root. -->

# WEB-MAP — Drenyra Web App Navigation

**Última actualización**: 2026-07-08

> 🗺️ Este mapa es tu guía de navegación del web app de Drenyra. No necesitás leerlo completo — usalo como referencia cuando necesités encontrar algo. Cada sección es independiente: saltá directo a lo que te interese.

## Start here

- **Location:** `apps/web/`
- **Product philosophy:** Drenyra Financial Engineering Environment. See [`docs/products/drenyra-product-philosophy.md`](../../docs/products/drenyra-product-philosophy.md).
- **Package:** `@drenyra/web` — React 19 SPA
- **Language:** TypeScript 6 + React 19 (JSX)
- **Framework:** React 19 + Vite 8 + TanStack Router 1.103
- **Source files:** 1,089 `.ts`/`.tsx` files
- **Test files:** 125 `.test.*`/`.spec.*` files
- **Test runner:** Vitest 4.1.5 (jsdom, coverage v8, threshold: lines 60%, functions 60%, branches 55%, statements 60%)
- **Entry point:** `src/client.tsx`
- **Build:** `bun run build` (Vite), `bun run typecheck` (tsc), `bun run lint` (eslint)
- **Auth:** better-auth 1.4.15 with Eden Treaty client

## Product model

The web app is Drenyra's Financial Engineering Environment command center. Design web work around supervised accounting outcomes, not disconnected ERP pages.

Use this workspace model:

```text
Left: outcome navigation and command entry
Center: fiscal workspace, accounting artifact, or receipt-driven workflow
Right: evidence, agent reasoning, approvals, and next actions
```

Web changes must keep evidence, confidence, fiscal scope, approval state, and reversal path near every high-risk agentic recommendation. Do not ship generic chat UI, unsupervised fiscal mutations, or visual polish that hides SUNAT, UBL 2.1, SIRE, IGV, tenant/RUC scope, or audit requirements.

### Web-specific non-goals

- Do not make magical AI claims without evidence, fiscal scope, and review state.
- Do not allow unsupervised fiscal mutation for invoices, journals, taxes, SIRE, payments, or period close.
- Do not add route sprawl when a workflow, command surface, or artifact can carry the outcome better.
- Do not hide tenant, company, RUC, period, SUNAT, UBL, IGV, approval, or reversal context behind visual polish.

### Philosophy links and frontend plan alignment

| Plan                                                                                      | Role in the web command center                                    |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [North Star Philosophy](../../openspec/changes/drenyra-north-star-philosophy/proposal.md) | Product-level operating contract for Drenyra surfaces.            |
| [F1 Agentic Shell](../../openspec/changes/drenyra-agentic-shell/proposal.md)              | Shell, outcome navigation, and context rail foundation.           |
| [F2 Thread System](../../openspec/changes/drenyra-thread-system/proposal.md)              | Durable work context and reviewable agent collaboration history.  |
| [F3 Agents Window](../../openspec/changes/drenyra-agents-window/proposal.md)              | Multi-agent visibility tied to real accounting workflows.         |
| [F4 Accounting Diff](../../openspec/changes/drenyra-accounting-diff/proposal.md)          | Evidence and review surface for risky fiscal/accounting changes.  |
| [F5 Skills + Automations](../../openspec/changes/drenyra-skills-automations/proposal.md)  | Approval-aware automation with audit output.                      |
| [F6 Evidence Vault 2.0](../../openspec/changes/drenyra-evidence-vault-2/proposal.md)      | Proof layer for evidence, reversibility, and fiscal audit trails. |

**First flagship workflow candidate:** monthly close. Use it to prove the
command-center model before expanding to SIRE, reconciliation, or invoice review.

### Flagship workflow — Monthly close

Monthly close is the first web flagship workflow because it combines recurring
operator pain, fiscal risk, evidence review, approvals, and auditability without
requiring a full SUNAT submission flow in the first slice.

Requirements:

- **Outcome:** help the user close a fiscal period with visible blockers,
  evidence, and next actions.
- **Scope:** show company, RUC, fiscal period, affected books, and source
  systems.
- **Evidence:** keep reconciliations, invoices, ledger movements, tax checks,
  and unresolved documents near each decision.
- **Confidence:** show completion, mismatches, stale data, and unresolved risk
  instead of vague AI certainty.
- **Approval:** prepare risky journal, tax, or period-lock actions for explicit
  human approval before execution.
- **Audit:** keep reviewer, timestamp, source evidence, rationale, and reversal
  path for every accepted change.

First-slice boundaries:

- Document the workflow model before implementing new React screens.
- Reuse existing `cierre-mensual`, reconciliation, ledger, review queue,
  approval, and evidence surfaces where possible.
- Treat the agent as a preparer and reviewer assistant, not as an autonomous
  fiscal actor.
- Exclude irreversible period locks, SUNAT submission, and unsupervised
  accounting mutations from the first implementation slice.

### Agentic accounting UI checklist

Use this checklist before shipping any web change that presents agentic fiscal
or accounting recommendations:

- [ ] The screen names the company, RUC, fiscal period, and affected books or
      documents.
- [ ] The primary recommendation has visible source evidence, not only generated
      prose.
- [ ] Confidence is explained through concrete signals: completeness,
      mismatches, stale data, and unresolved risks.
- [ ] Risky mutations are prepared, explained, and routed through explicit human
      approval.
- [ ] The user can see the audit trail and reversal path before accepting a
      high-risk change.
- [ ] Empty, loading, blocked, and error states teach the next safe fiscal
      action.
- [ ] UI copy avoids magical AI promises and says why the recommendation exists.

### Frontend review path for agentic accounting PRs

Reviewers should verify these areas in order:

1. **Fiscal scope:** tenant, company, RUC, period, and document boundaries are
   visible and preserved.
2. **Evidence path:** source records, calculations, and affected artifacts are
   reachable from the decision point.
3. **Approval path:** risky actions cannot execute without explicit human
   approval and review state.
4. **Reversal path:** accepted changes expose audit metadata and a rollback or
   correction path.
5. **Cognitive load:** first screen answers status, next action, blockers, and
   risk without forcing route hunting.

### Metrics for cognitive load and fiscal confidence

- **Time to next action:** user can identify the safest next step in under 60
  seconds.
- **Evidence proximity:** source evidence is visible or one click away from each
  recommendation.
- **Scope clarity:** company, RUC, period, and affected documents are visible
  before action.
- **Approval clarity:** risky actions show approval state and reviewer
  responsibility.
- **Blocker clarity:** blocked workflows show reason, owner, and recovery path.
- **Reversal clarity:** accepted changes show audit metadata and correction
  path.

## Tech stack

| Layer             | Technology                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| **UI Framework**  | React 19.2.5 + React Compiler (production only)                                     |
| **Build**         | Vite 8.0.10 + TanStack Router Vite plugin (auto-generates `routeTree.gen.ts`)       |
| **Routing**       | TanStack Router 1.103 (type-safe, file-based)                                       |
| **State**         | Zustand 5.0.10 (persisted), XState 5.28 (state machines for fiscal flows)           |
| **Data Fetching** | TanStack Query 5.90 (server cache, optimistic updates)                              |
| **API Client**    | Eden Treaty (`@elysiajs/eden`) — type-safe Elysia consumption                       |
| **Styling**       | Tailwind CSS 4.1.18 + `@tailwindcss/vite`, Container Queries, `tailwindcss-animate` |
| **Design Tokens** | Custom `lib/design-tokens/` system — DTCG JSON → generated CSS                      |
| **UI Primitives** | shadcn/ui + Radix UI (dialog, dropdown, popover, select, checkbox, etc.)            |
| **Animations**    | Framer Motion 12.27 + CSS view-transitions                                          |
| **Charts**        | Recharts 3.8                                                                        |
| **Forms**         | React Hook Form 7.71 + Zod 4.3 + `@hookform/resolvers`                              |
| **Icons**         | Lucide React                                                                        |
| **PDF**           | @react-pdf/renderer 4.3                                                             |
| **QR**            | qrcode 1.5                                                                          |
| **DnD**           | @dnd-kit (core, sortable, modifiers, utilities)                                     |
| **Toast**         | sonner 2.0                                                                          |
| **Notifications** | cmdk (command palette)                                                              |

## Architecture layers

```
src/client.tsx                       ← Entry point (React root, QueryClient, RouterProvider)
    |
    +-- src/router.tsx               ← TanStack Router factory
    +-- src/routeTree.gen.ts         ← Auto-generated by TanStack Router Vite plugin
    |
    +-- src/routes/                  ← 47 flat route files
    |   +-- __root.tsx               ← Root layout: auth guard, MainLayout, providers
    |   +-- index.tsx                ← Redirects to /dashboard
    |   +-- login.tsx, signup.tsx, forgot-password.tsx, ...
    |   +-- dashboard.tsx, reports.tsx, financials.tsx, ...
    |   +-- settings/                ← 7 settings sub-routes
    |   +-- workspace/               ← 4 workspace sub-routes
    |
    +-- src/features/                ← 40 vertical-slice feature modules
    |   +-- auth/                    ← Login, signup, session, auth guards
    |   +-- dashboard/               ← Home dashboard with KPIs, charts, widgets
    |   +-- invoices/                ← Kanban board, create/edit/delete, PDF, filters
    |   +-- banking/                 ← Accounts, reconciliation, transactions, CBDC
    |   +-- cashflow/                ← Cashflow board, projections
    |   +-- compliance/              ← SIRE, CPE validator, fiscal health map
    |   +-- cognitive-hub/           ← AI workspace, event system, anomaly detection
    |   +-- drenyra-command-center/  ← Drenyra AI command center UI
    |   +-- drenyra-workspace/       ← Drenyra workspace pages
    |   +-- settings/                ← Org, billing, notifications, integrations
    |   +-- ledger/                  ← General ledger view
    |   +-- reconciliations/         ← Bank reconciliation
    |   +-- products/                ← Product catalog + surfaces
    |   +-- ... (28 more)
    |
    +-- src/components/              ← Shared UI component tree
    |   +-- atoms/                   ← icon, button, text, spinner, badge, dot
    |   +-- molecules/               ← OmniAgent, stat-card, metric-card
    |   +-- ui/                      ← shadcn + custom: glass-card, table, dialog
    |   +-- layout/                  ← MainLayout, Sidebar, TopBar, BottomNav
    |   +-- agentic/                 ← AgentPulse, ConfidenceBadge, ConflictDiffView
    |
    +-- src/lib/                     ← Core shared library
    |   +-- router/                  ← Route definitions, public routes, fallbacks
    |   +-- navigation/              ← Nav item definitions (compact + full)
    |   +-- design-tokens/           ← DTCG token system → generated CSS
    |   +-- schemas/                 ← Zod schemas (customer, vendor, product, invoice)
    |   +-- api-client.ts            ← HTTP/API/Eden Treaty clients
    |   +-- auth-client.ts           ← Better Auth client
    |   +-- query-client.ts          ← TanStack Query client factory
    |
    +-- src/hooks/                   ← useFiscalAction, useUndoRedo, ...
    +-- src/store/ + src/stores/     ← Zustand stores
    +-- src/context/                 ← Sidebar, Simulation, ArtifactEvent, Settings
    +-- src/services/                ← pdf.service.ts
    +-- src/styles/                  ← view-transitions.css, scroll-animations.css
```

## Route structure

All routes are flat under `src/routes/` except `settings/` and `workspace/` which have sub-routes. Auto-registered by TanStack Router Vite plugin to `src/routeTree.gen.ts`.

| Route file             | Path                | Purpose                                              |
| ---------------------- | ------------------- | ---------------------------------------------------- |
| `__root.tsx`           | `/` (layout)        | Auth guard, MainLayout, global providers, Toaster    |
| `index.tsx`            | `/`                 | Redirect to `/dashboard`                             |
| `login.tsx`            | `/login`            | Login page                                           |
| `signup.tsx`           | `/signup`           | Registration                                         |
| `auth.tsx`             | `/auth`             | Auth page (social OAuth callback)                    |
| `forgot-password.tsx`  | `/forgot-password`  | Password reset request                               |
| `reset-password.tsx`   | `/reset-password`   | Password reset form                                  |
| `verify-email.tsx`     | `/verify-email`     | Email verification                                   |
| `onboarding.tsx`       | `/onboarding`       | First-time user onboarding flow                      |
| `onboarding.demos.tsx` | `/onboarding/demos` | Interactive demos during onboarding                  |
| `dashboard.tsx`        | `/dashboard`        | Main operational dashboard (KPIs, charts, liquidity) |
| `financials.tsx`       | `/financials`       | Financial overview, drill-down                       |
| `cashflow.tsx`         | `/cashflow`         | Cashflow board, projections                          |
| `banking.tsx`          | `/banking`          | Bank accounts, reconciliation, transactions          |
| `reconciliations.tsx`  | `/reconciliations`  | Reconciliation management                            |
| `ledger.tsx`           | `/ledger`           | General ledger                                       |
| `cierre-mensual.tsx`   | `/cierre-mensual`   | Monthly close process                                |
| `invoices.tsx`         | `/invoices`         | Invoice Kanban, create/edit, PDF preview             |
| `bills.tsx`            | `/bills`            | Bills/Payables management                            |
| `payroll.tsx`          | `/payroll`          | Payroll processing                                   |
| `products.tsx`         | `/products`         | Product catalog                                      |
| `product-surfaces.tsx` | `/product-surfaces` | Product surface registry                             |
| `inventory.tsx`        | `/inventory`        | Inventory management                                 |
| `assets.tsx`           | `/assets`           | Fixed assets                                         |
| `vendors.tsx`          | `/vendors`          | Vendor management                                    |
| `customers.tsx`        | `/customers`        | Customer management                                  |
| `entities.tsx`         | `/entities`         | Entity registry                                      |
| `economic-groups..tsx` | `/economic-groups/` | Economic group detail                                |
| `taxation.tsx`         | `/taxation`         | Tax dashboard (IGV, renta, detracciones)             |
| `compliance.tsx`       | `/compliance`       | SUNAT compliance, SIRE, CPE validator                |
| `audit.tsx`            | `/audit`            | Audit trail                                          |
| `reports.tsx`          | `/reports`          | Custom reports                                       |
| `compare.tsx`          | `/compare`          | Period comparison                                    |
| `review.tsx`           | `/review`           | Document review                                      |
| `review-queue.tsx`     | `/review-queue`     | Review queue                                         |
| `approvals.tsx`        | `/approvals`        | Approval hub                                         |
| `inbox.tsx`            | `/inbox`            | Notification/action inbox                            |
| `chat.tsx`             | `/chat`             | AI chat (cognitive hub)                              |
| `drenyra.tsx`          | `/drenyra`          | Drenyra AI assistant                                 |
| `neural-grid.tsx`      | `/neural-grid`      | Neural grid visualization                            |
| `documents.tsx`        | `/documents`        | Document management                                  |
| `connections.tsx`      | `/connections`      | Third-party connections                              |
| `plugins.tsx`          | `/plugins`          | Plugin management                                    |
| `automations.tsx`      | `/automations`      | Automation rules                                     |
| `scanner.tsx`          | `/scanner`          | Document scanner                                     |
| `mobile-summary.tsx`   | `/mobile-summary`   | Mobile-optimized summary                             |
| `profile.tsx`          | `/profile`          | User profile                                         |
| `settings.tsx`         | `/settings`         | Settings layout (redirect to index)                  |

### Settings sub-routes (`src/routes/settings/`)

| File                | Path                      | Purpose                    |
| ------------------- | ------------------------- | -------------------------- |
| `index.tsx`         | `/settings`               | Settings home              |
| `organization.tsx`  | `/settings/organization`  | Org profile, RUC, settings |
| `security.tsx`      | `/settings/security`      | Security, 2FA, sessions    |
| `notifications.tsx` | `/settings/notifications` | Notification preferences   |
| `appearance.tsx`    | `/settings/appearance`    | Theme, complexity level    |
| `integrations.tsx`  | `/settings/integrations`  | API integrations           |
| `billing.tsx`       | `/settings/billing`       | Billing and subscriptions  |

### Workspace sub-routes (`src/routes/workspace/`)

| File               | Path                      | Purpose                |
| ------------------ | ------------------------- | ---------------------- |
| `operations.tsx`   | `/workspace/operations`   | Operations workspace   |
| `finance.tsx`      | `/workspace/finance`      | Finance workspace      |
| `compliance.tsx`   | `/workspace/compliance`   | Compliance workspace   |
| `system-admin.tsx` | `/workspace/system-admin` | System admin workspace |

## Features (by directory)

| Feature                | Path                                 | Purpose                                                                    |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| auth                   | src/features/auth/                   | Auth: login, signup, session Mgmt, guards, OAuth                           |
| dashboard              | src/features/dashboard/              | Home: KPIs, income/expense tabs, liquidity widget, mobile summary          |
| invoices               | src/features/invoices/               | Invoice Kanban, create/edit, PDF, filters, mobile scanner, XState machines |
| banking                | src/features/banking/                | Bank accounts, reconciliation, transactions, CBDC module                   |
| cashflow               | src/features/cashflow/               | Cashflow board, projections                                                |
| compliance             | src/features/compliance/             | SIRE management, CPE validator, fiscal health map, hitl decisions          |
| cognitive-hub          | src/features/cognitive-hub/          | AI workspace: events, anomalies, cost dashboard, message views             |
| drenyra-command-center | src/features/drenyra-command-center/ | Drenyra AI command center UI                                               |
| drenyra-workspace      | src/features/drenyra-workspace/      | Drenyra workspace pages                                                    |
| central-board          | src/features/central-board/          | Área Central: ledger editable, pending journal review, document upload     |
| drenyra [hooks]        | src/features/drenyra/hooks/          | Journal entries TanStack Query hooks (useJournalEntriesApi)                |
| settings               | src/features/settings/               | Settings UI views (appearance, shell)                                      |
| ledger                 | src/features/ledger/                 | General ledger view                                                        |
| reconciliations        | src/features/reconciliations/        | Reconciliation data, types, utils                                          |
| products               | src/features/products/               | Product catalog, product form, SKU management                              |
| product-surfaces       | src/features/product-surfaces/       | Product surface registry components                                        |
| vendors                | src/features/vendors/                | Vendor management, tabs, widgets                                           |
| customers              | src/features/customers/              | Customer management, tabs, widgets                                         |
| entities               | src/features/entities/               | Entity registry, details, table                                            |
| bills                  | src/features/bills/                  | Bills/payables, tabs, sections, widgets                                    |
| payroll                | src/features/payroll/                | Payroll processing                                                         |
| assets                 | src/features/assets/                 | Fixed asset management                                                     |
| inventory              | src/features/inventory/              | Inventory management                                                       |
| taxation               | src/features/taxation/               | Tax dashboard, widgets                                                     |
| expedientes            | src/features/expedientes/            | Docket/file management                                                     |
| economic-groups        | src/features/economic-groups/        | Economic group dashboard                                                   |
| financials             | src/features/financials/             | Financial drill-down, widgets                                              |
| onboarding             | src/features/onboarding/             | First-time user onboarding, interactive demos                              |
| audit                  | src/features/audit/                  | Audit trail components                                                     |
| artifacts              | src/features/artifacts/              | Artifact system: registry, factories, patches, policy                      |
| agent-swarm            | src/features/agent-swarm/            | Agent swarms: types, hooks, components                                     |
| approval-hub           | src/features/approval-hub/           | Approval hub page                                                          |
| inbox                  | src/features/inbox/                  | Action inbox, config, schema, types                                        |
| intelligence           | src/features/intelligence/           | Business intelligence, stores, hooks                                       |
| review                 | src/features/review/                 | Document review, API, data                                                 |
| review-queue           | src/features/review-queue/           | Review queue data                                                          |
| compare                | src/features/compare/                | Period comparison components                                               |
| reports                | src/features/reports/                | Custom reporting, components                                               |
| documents              | src/features/documents/              | Document management                                                        |
| connections            | src/features/connections/            | Third-party connections                                                    |
| profile                | src/features/profile/                | User profile components                                                    |
| plugins                | src/features/plugins/                | Plugin management components                                               |
| automations            | src/features/automations/            | Automation rules components                                                |
| cierre-mensual         | src/features/cierre-mensual/         | Monthly close page                                                         |

## Common tasks

| Task                                    | Location                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Add a ledger tab entry in CentralBoard  | `src/features/central-board/components/CentralBoard.tsx`                                               |
| Wire inline edit save to PATCH mutation | `src/features/central-board/components/LedgerEditableTable.tsx` (EditableCell → useUpdateJournalEntry) |
| Upload a document via drag-and-drop     | `src/features/central-board/components/DocumentsList.tsx` → POST `/api/documents/upload`               |
| Preview a document                      | `src/features/central-board/components/DocumentsList.tsx` (click to open DocumentPreviewModal)         |
| Review pending agent proposals          | `src/features/central-board/components/JournalPendingList.tsx`                                         |
| Add a journal-entries API query filter  | `src/features/drenyra/hooks/useJournalEntriesApi.ts`                                                   |
| Export general ledger to PDF/XLSX       | `src/features/central-board/components/LedgerEditableTable.tsx` → POST `/api/ledger/export`            |

## Component tree

### Atoms (`src/components/atoms/`)

| File              | Purpose                |
| ----------------- | ---------------------- |
| button.tsx        | Button stories (Ladle) |
| spinner.tsx       | Loading spinner        |
| icon.tsx          | Icon wrapper           |
| text.tsx          | Typography primitive   |
| badge.stories.tsx | Badge stories          |
| dot.tsx           | Status dot             |
| ai-indicator.tsx  | AI activity indicator  |
| index.ts          | Barrel exports         |

### Molecules (`src/components/molecules/`)

| File                      | Purpose                        |
| ------------------------- | ------------------------------ |
| OmniAgent.tsx             | OmniAgent status component     |
| omni-agent/               | OmniAgent sub-components       |
| status-card.tsx           | Status display card            |
| ai-confidence-display.tsx | AI confidence visual indicator |
| stat-card.tsx             | Statistic display card         |
| metric-card.tsx           | Metric display card            |

### UI (`src/components/ui/`) — shadcn + custom

| File                        | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| button.tsx                  | shadcn button (cva variants)              |
| badge.tsx                   | Badge (default + secondary + outline)     |
| card.tsx                    | Card, CardHeader, CardContent, CardFooter |
| dialog.tsx                  | Dialog modal                              |
| alert-dialog.tsx            | Alert/confirm dialog                      |
| dropdown-menu.tsx           | Dropdown menu                             |
| popover.tsx                 | Popover                                   |
| select.tsx                  | Select dropdown                           |
| checkbox.tsx                | Checkbox                                  |
| input.tsx                   | Text input                                |
| textarea.tsx                | Textarea                                  |
| label.tsx                   | Label                                     |
| form.tsx                    | Form wrapper (RHF)                        |
| table.tsx                   | Table, Thead, Tbody, Tr, Th, Td           |
| tabs.tsx                    | Tabs                                      |
| tooltip.tsx                 | Tooltip                                   |
| command.tsx                 | Command palette                           |
| calendar.tsx                | Date picker calendar                      |
| skeleton.tsx                | Loading skeleton                          |
| panel.tsx                   | Panel container                           |
| typography.tsx              | Typography components                     |
| glass-card.tsx              | Glassmorphism card                        |
| liquid-glass.tsx            | Liquid glass effect                       |
| PageShell.tsx               | Page shell wrapper                        |
| PageHeader.tsx              | Page header                               |
| RightRail.tsx               | Right side panel                          |
| StatusBadge.tsx             | Status badge (with color maps)            |
| NavSection.tsx              | Nav section group                         |
| NavItem.tsx                 | Nav item                                  |
| SearchField.tsx             | Search input field                        |
| page-transition.tsx         | Page transition wrapper                   |
| motion-primitives.tsx       | Motion primitive components               |
| floating-action-button.tsx  | FAB component                             |
| keyboard-shortcuts-help.tsx | Keyboard shortcuts dialog                 |
| ComplexityModeToggle.tsx    | Complexity level toggle                   |
| UXModeToggle.tsx            | UX mode toggle                            |
| agent-status.tsx            | Agent status indicator                    |
| SurfaceCard.tsx             | Surface card                              |

### Layout (`src/components/layout/`)

| File                      | Purpose                                                 |
| ------------------------- | ------------------------------------------------------- |
| MainLayout.tsx            | Main app shell: sidebar + topbar + content + right rail |
| Sidebar.tsx               | Sidebar navigation                                      |
| sidebar/                  | Sidebar theme, expanded state, navigation click         |
| TopBar.tsx                | Top bar                                                 |
| BottomNavigationBar.tsx   | Mobile bottom nav                                       |
| MobileTabNavigation.tsx   | Mobile tab navigation                                   |
| UserProfileDropdown.tsx   | User profile dropdown                                   |
| SidebarAccountMenu.tsx    | Sidebar account menu                                    |
| ActiveCompanySwitcher.tsx | Company/RUC switcher                                    |
| FiscalInspector.tsx       | Fiscal inspector panel                                  |
| HeaderSupportMenu.tsx     | Header support menu                                     |
| HeaderActivityCluster.tsx | Activity cluster in header                              |
| notifications/            | Notification sidebar                                    |
| hooks/                    | Layout-specific hooks                                   |
| utils/                    | Layout utilities (policy-context)                       |

### Agentic (`src/components/agentic/`)

| File                 | Purpose                         |
| -------------------- | ------------------------------- |
| AgentPulse.tsx       | Agent pulse animation           |
| AgentHeartbeat.tsx   | Agent heartbeat indicator       |
| ConfidenceBadge.tsx  | AI confidence badge             |
| ConfidenceBadge/     | Confidence badge sub-components |
| ConflictDiffView.tsx | Conflict diff visualizer        |
| conflict-diff/       | Conflict diff sub-components    |
| agent-pulse/         | Agent pulse sub-components      |
| command-bar/         | Command bar (with hooks)        |

## State management

### Zustand stores

| Store                 | File                               | Purpose                                                                            |
| --------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| useUIStore            | src/store/ui-store.ts              | Theme preference, complexity level, sidebar/rail state. Persisted to localStorage. |
| useSidebarLayoutStore | src/stores/sidebar-layout.store.ts | Sidebar collapsed/mobile/focus/notifications state                                 |

### XState machines (within features)

| Feature    | Use                                  |
| ---------- | ------------------------------------ |
| invoices   | Invoice creation/editing workflows   |
| compliance | SIRE compliance flow, CPE validation |

### TanStack Query

- Global client config: `src/lib/query-client.ts`
- Feature-level query keys/options: each feature has `api/`, `*.query.ts`, `*.query-keys.ts`, `*.query-options.ts`

## React Context providers

| Provider                | File                                    | Purpose                    |
| ----------------------- | --------------------------------------- | -------------------------- |
| SidebarProvider         | src/context/SidebarContext.tsx          | Sidebar open/close state   |
| SidebarLayoutContext    | src/context/SidebarLayoutContext.tsx    | Sidebar layout config      |
| SidebarWorkspaceContext | src/context/SidebarWorkspaceContext.tsx | Workspace-specific sidebar |
| SettingsProvider        | src/context/SettingsContext.tsx         | App settings               |
| SimulationProvider      | src/context/SimulationContext.tsx       | Simulation mode            |
| ArtifactEventContext    | src/context/ArtifactEventContext.tsx    | Artifact event bus         |
| FiscalInspectorProvider | src/context/FiscalInspectorContext.tsx  | Fiscal inspector state     |
| AgentAwareProvider      | src/context/AgentAwareContext.tsx       | Agent awareness context    |
| MotionProvider          | src/components/ui/motion-primitives     | Framer Motion config       |

## Key entrypoints

| File                    | Role                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| src/client.tsx          | React root mount, QueryClient init, RouterProvider, theme bootstrap, monitoring init |
| src/router.tsx          | TanStack Router factory (context, preload, defaults, error components)               |
| src/routeTree.gen.ts    | Auto-generated route tree (do NOT edit)                                              |
| src/routes/__root.tsx   | Root layout: auth guard, MainLayout (lazy), global providers                         |
| src/lib/query-client.ts | TanStack Query client (retry, stale time, cache config)                              |
| src/lib/auth-client.ts  | Better Auth client (Eden Treaty)                                                     |
| src/index.css           | Tailwind 4 entry + custom @theme variables                                           |
| vite.config.ts          | Vite config: React Compiler, TanStack Router, Tailwind, dev proxy, chunk splitting   |
| vitest.config.ts        | Test config: jsdom, coverage thresholds, setup                                       |

## Fast search recipes

```bash
# Find all route files
fd \.tsx$ src/routes/ -tf | sort

# Find all feature modules
ls src/features/ | sort

# Find store files
fd store src/ -tf -e ts

# Find test files by feature
fd _test\. src/features/invoices/ -tf
fd _test\. src/features/banking/ -tf

# Find context providers
rg createContext src/context/

# Find API query options (TanStack Query)
rg queryOptions src/features/ -l

# Find XState machines
fd machine src/features/ -tf

# Find Eden Treaty route calls
rg treaty src/ -l

# Find all hooks
fd use[A-Z] src/hooks/ -tf

# Find all Zustand stores
rg create\( src/ -g *.ts --type ts

# Find design token references
fd token src/lib/design-tokens/ -tf
```

## Common tasks to exact paths

| Task                   | Start path                                                          |
| ---------------------- | ------------------------------------------------------------------- |
| Add new route          | src/routes/<name>.tsx then add feature in src/features/<name>/      |
| Create new feature     | src/features/<name>/ (components/, hooks/, api/, types/, index.ts)  |
| Add Zod schema         | src/lib/schemas/<entity>.schema.ts                                  |
| Change design tokens   | src/lib/design-tokens/tokens.dtcg.json then run bun tokens:generate |
| Edit sidebar nav items | src/lib/navigation/items/types.ts or src/lib/navigation/            |
| Change auth guard      | src/routes/__root.tsx (beforeLoad)                                  |
| Add UI component       | src/components/ui/<name>.tsx                                        |
| Add layout component   | src/components/layout/<name>.tsx                                    |
| Add global hook        | src/hooks/use<hook>.ts                                              |
| Change Zustand store   | src/store/ui-store.ts or src/stores/<name>.store.ts                 |
| Change API client      | src/lib/api-client.ts or src/lib/treaty-route-client.ts             |
| Add PDF generation     | src/services/pdf.service.ts                                         |
| Add test               | src/**tests**/ (setup), feature-level **tests**/ dirs               |
| Change ESLint          | eslint.config.js                                                    |
| Change Docker/nginx    | Dockerfile, nginx.conf                                              |
| Change dev proxy       | vite.config.ts (server.proxy) + vite.dev-api-proxy.ts               |
| Change chunk splitting | vite.config.ts (resolveManualChunk)                                 |
| Change test config     | vitest.config.ts                                                    |
| Change TS config       | tsconfig.json, tsconfig.check.json                                  |
| Add dependency         | bun add <pkg> (check if already in workspace)                       |

## Dependencies (core)

| Package                | Version  | Purpose                  |
| ---------------------- | -------- | ------------------------ |
| react                  | ^19.2.5  | UI framework             |
| @tanstack/react-router | ^1.103.3 | Type-safe routing        |
| @tanstack/react-query  | ^5.90.19 | Server state             |
| zustand                | ^5.0.10  | Client state             |
| xstate                 | ^5.28.0  | State machines           |
| @elysiajs/eden         | ^1.4.6   | Type-safe API client     |
| better-auth            | ^1.4.15  | Authentication           |
| zod                    | ^4.3.5   | Schema validation        |
| react-hook-form        | ^7.71.1  | Forms                    |
| tailwindcss            | ^4.1.18  | CSS utility framework    |
| framer-motion          | ^12.27.3 | Animations               |
| recharts               | ^3.8.1   | Charts                   |
| @react-pdf/renderer    | ^4.3.2   | PDF generation           |
| @dnd-kit/core          | ^6.3.1   | Drag and drop            |
| @radix-ui/*            | --       | Accessible UI primitives |
| lucide-react           | 0.562.0  | Icons                    |
| sonner                 | ^2.0.7   | Toast notifications      |

## CI gates

```bash
bun install --frozen-lockfile           # Install deps
bun run typecheck                        # TypeScript strict check (tsc -p tsconfig.check.json)
bun run lint                             # ESLint on src/
bun run test:run                         # Vitest (coverage: lines 60%, functions 60%, branches 55%)
bun run build                            # Vite production build
bun run check:bundle                     # Bundle budget check
bun run check:classnames                 # Classname template literal check
```
