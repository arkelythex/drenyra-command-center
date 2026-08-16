<!-- Manual navigation map for Drenyra Web (React SPA). See CODEX-MAP.md for monorepo root. -->

# WEB-MAP — Drenyra Web App Navigation

**Última actualización**: 2026-08-14

> 🗺️ Este mapa es tu guía de navegación del web app de Drenyra. No necesitás leerlo completo — usalo como referencia cuando necesités encontrar algo. Cada sección es independiente: saltá directo a lo que te interese.

## Start here

- **Location:** `apps/web/`
- **Product philosophy:** Drenyra Financial Engineering Environment. See [`docs/products/drenyra-product-philosophy.md`](../../docs/products/drenyra-product-philosophy.md).
- **Package:** `@drenyra/web` — React 19 SPA
- **Language:** TypeScript 6 + React 19 (JSX)
- **Framework:** React 19 + Vite 8 + TanStack Router 1.103
- **Source files:** 568 `.ts`/`.tsx` files (verified count, `apps/web/src`)
- **Test files:** 75 `.test.*`/`.spec.*` files (69 in `src/`, 5 Playwright e2e in `e2e/`, 1 root-level Vite proxy test)
- **Route files:** 12 files in `src/routes/` — 11 route modules + 1 test (10 registered paths)
- **Feature slices:** 14 directories under `src/features/`
- **Test runner:** Vitest 4.1.10 (jsdom, coverage v8, thresholds: lines 70%, functions 65%, branches 60%, statements 70%)
- **Entry point:** `src/client.tsx`
- **Build:** `bun run build` (Vite), `bun run typecheck` (tsc), `bun run lint` (eslint)
- **Auth:** better-auth ^1.6.16 with Eden Treaty client

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

## Current command-center projection (verified 2026-08-14)

The live web surface is intentionally narrow: one routed command-center
workspace plus auth flows. The rest of the product model is carried by
unrouted feature modules and by planned contracts — do not assume a route
exists because a feature folder or sidebar entry exists.

### Routed surfaces

| Route | Surface | Notes |
| ----- | ------- | ----- |
| `/` | Redirect | → `/workspace/1/2026/3/close` |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auth` | Auth flows | `/auth` is a legacy shell that redirects to `/login` |
| `/onboarding` | OnboardingWizard | First-time user flow + demos |
| `/settings` | Placeholder | Stub ("Coming soon") — not a real surface |
| `/workspace/$companyId/$year/$month/$intent` | **Mission workspace** | The command-center projection: mission header, state view, actions, approval gate, evidence bundle, progress, receipt, blockers; renders `CierreMensualPage` for the `close` intent |

Sidebar navigation (`src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`)
defines the outcome-first model (Bandeja, Misiones, Empresas, Evidencia, Cola de
revisión, Bancos, Conciliaciones, Comprobantes, Libro Mayor, Impuestos,
SIRE/SUNAT, Cumplimiento, Reportes, Settings). Only `/settings` and the
workspace route are currently wired in the router; the other destinations are
planned surfaces backed by feature modules (`evidence`, `firm`, `inbox`,
`review-queue`, `cierre-mensual`) or not yet implemented.

### API posture — mounted vs contract-only vs mock

| Posture | Where | Status |
| ------- | ----- | ------ |
| **(a) Mounted production mission flow** | `apps/api/src/features/missions`, mounted in `apps/api/src/app-core.ts` at prefix `/api/v1/missions` | Production-ready module: `POST /api/v1/missions`, `GET /api/v1/missions/:id`, `POST .../approve`, `POST .../reject`, `POST .../reconcile`, capabilities routes, SSE event stream. Web consumes it via `src/features/workspace/services/http-mission-transport.ts` + `sse-mission-stream.ts` (base `VITE_DRENYRA_API_URL` or `http://localhost:3000`). Approvals return `receiptId`/`receiptHash`. |
| **(b) Planned/unmounted contracts** | `apps/api/src/features/drenyra-runtime` | **Contract-only, NOT mounted in `app-core.ts`.** "Drenyra Runtime / Brain Service" owns schemas for threads, turns, items, runs, approvals, web-search audit. Planned endpoints `/runtime/threads`, `/runtime/threads/:id/turns`, `/runtime/approvals`, `/runtime/runs` do not exist at runtime. Do not route production traffic here. |
| **(c) Mock/demo transports** | `apps/web/src/features/workspace/services/mock-mission-transport.ts` | Demo transport (`mockExecuteRunIntent`) activated by `VITE_DRENYRA_MISSION_TRANSPORT=mock`. `VITE_FRONTEND_MOCK_MODE=false` is the default in `.env.example`; `src/lib/api-mock.ts` + `simulated-latency.ts` back the frontend mock mode. Mock mode must never be the default for fiscal work. |

Domain contract for missions is shared via the `@drenyra/mission-domain` workspace
package (`packages/mission-domain`); the web re-exports its types through
`src/features/workspace/services/mission-contracts.ts`.

### Unrouted feature modules (not yet mounted in the router)

These feature folders exist with components/pages but have **no route file**:

- `evidence/` — `EvidenceVaultPage`, `EvidenceBrowserPage`, `EvidenceDetailPage` (evidence vault 2.0 projection)
- `firm/` — `FirmDashboard`, `ClientList`, `ClientDetail`, `AlertsPanel` (client 360 / RUC scope)
- `fiscal-chat/` — `FiscalChat` + chat parser/types
- `chat-agent/` — chat agent UI
- `approval-hub/` — approval components
- `cierre-mensual/` — `CierreMensualPage` (currently lazy-loaded from the mission workspace, not a standalone route)

## Tech stack

| Layer             | Technology                                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| **UI Framework**  | React 19.2.x (^19.2.7) + React Compiler (production only)                           |
| **Build**         | Vite 8.0.10 + TanStack Router Vite plugin (auto-generates `routeTree.gen.ts`)       |
| **Routing**       | TanStack Router 1.103 (type-safe, file-based)                                       |
| **State**         | Zustand 5.0.10 (persisted), XState 5.28 (process-machine + fiscal flows)            |
| **Data Fetching** | TanStack Query 5.90 (server cache, optimistic updates)                              |
| **API Client**    | Eden Treaty (`@elysiajs/eden` ^1.4.6) — type-safe Elysia consumption                |
| **Styling**       | Tailwind CSS 4.1.18 + `@tailwindcss/vite`, Container Queries, `tailwindcss-animate` |
| **Design Tokens** | Checked-in generated CSS at `src/lib/design-tokens/generated/tokens.css` (DTCG → CSS via root `bun run tokens:generate`) |
| **UI Primitives** | shadcn/ui + Radix UI (dialog, dropdown, popover, select, checkbox, tooltip, etc.)   |
| **Animations**    | Framer Motion 12.27 + CSS view-transitions                                          |
| **Charts**        | Recharts 3.8                                                                        |
| **Forms**         | React Hook Form 7.71 + Zod 4.3 + `@hookform/resolvers` ^5.2                        |
| **Icons**         | Lucide React 1.25.0                                                                 |
| **PDF**           | @react-pdf/renderer 4.3 (invoices feature)                                          |
| **QR**            | qrcode 1.5.4                                                                        |
| **DnD**           | @dnd-kit (core, sortable, modifiers, utilities)                                     |
| **Toast**         | sonner 2.0                                                                          |
| **Command UI**    | cmdk 1.1 + `AgenticCommandBar`                                                      |
| **XState React**  | @xstate/react 6.1                                                                   |

## Architecture layers

```
src/client.tsx                       ← Entry point (React root, QueryClient, RouterProvider)
    |
    +-- src/router.tsx               ← TanStack Router factory (context, preload, view transitions)
    +-- src/remote-entry.tsx         ← Module Federation entry (exposes createRouter for Drenyra OS shell)
    +-- src/routeTree.gen.ts         ← Auto-generated by TanStack Router Vite plugin
    |
    +-- src/routes/                  ← 12 files (11 route modules + 1 test)
    |   +-- __root.tsx               ← Root: public-route guard (PUBLIC_ROUTES), AgenticLayout, Toaster
    |   +-- index.tsx                ← Redirects to /workspace/1/2026/3/close
    |   +-- login.tsx, signup.tsx, forgot-password.tsx, reset-password.tsx,
    |   |   verify-email.tsx, auth.tsx (→ /login), onboarding.tsx, settings.tsx (stub)
    |   +-- workspace.$companyId.$year.$month.$intent.tsx ← MissionWorkspace (command center)
    |
    +-- src/features/                ← 14 vertical-slice feature modules
    |   +-- workspace/               ← Mission workspace: mission components, hooks, transports
    |   +-- evidence/                ← Evidence vault: vault/browser/detail pages
    |   +-- firm/                    ← Firm dashboard, client 360
    |   +-- cierre-mensual/          ← Monthly close page + mission components
    |   +-- fiscal-chat/             ← Fiscal chat UI + parser
    |   +-- chat-agent/              ← Chat agent UI
    |   +-- invoices/                ← Invoice board, create/edit, OSE lifecycle, PDF
    |   +-- compliance/              ← SIRE, CPE validator, detracciones, fiscal health
    |   +-- ledger/                  ← General ledger API + view models
    |   +-- reconciliations/         ← Bank reconciliation data/types
    |   +-- approval-hub/            ← Approval components
    |   +-- auth/                    ← Login/signup/verify forms, session hooks, OAuth
    |   +-- onboarding/              ← Onboarding wizard + interactive demos
    |   +-- settings/                ← Settings view
    |
    +-- src/components/              ← Shared UI component tree
    |   +-- agentic-shell/           ← AgenticLayout, AgenticSidebar, AgenticCommandBar, WorkspaceSelector
    |   +-- workbench/               ← Pane system, ApprovalGate, EvidenceInspector, WorkspaceTopBar
    |   +-- fiscal/                  ← AgentMissionTimeline, FiscalRiskLayer
    |   +-- agentic/                 ← CommandPalette, RightPanel
    |   +-- layout/                  ← FiscalEditorialShell
    |   +-- notifications/           ← NotificationSidebar
    |   +-- atoms/ + ui/             ← primitives (text) + shadcn/custom (SurfaceCard, PageShell, ...)
    |
    +-- src/lib/                     ← Core shared library
    |   +-- api-factory*             ← safeApiCall, queryApi, mutateApi, createCrudApi
    |   +-- crud-api.ts              ← createCrudHooks (TanStack Query CRUD)
    |   +-- http-client.ts, api-helpers.ts, auth-client.ts, query-client.ts
    |   +-- commands/                ← command-registry.ts, default-commands.ts
    |   +-- process-machine/         ← XState process/analyze/resolve machines
    |   +-- export-service.ts        ← CSV/TSV/JSON/PDF/XLSX export
    |   +-- design-tokens/           ← generated/tokens.css (checked-in)
    |   +-- money.ts, date-utils.ts, fiscal-period.ts, legibility.ts, ...
    |
    +-- src/stores/                  ← Zustand stores: ui.store.ts, workspace.store.ts, agentic-shell.store.ts
    +-- src/context/ + src/contexts/ ← FiscalInspectorContext, InspectorContext, density, workspace
    +-- src/types/                   ← agent-activity, approval-gate, change-set, financial-diff, ...
    +-- src/styles/                  ← index.css (Tailwind 4 entry) + theme
```

## Route structure

Routes are flat files under `src/routes/`. The only dynamic route is the
workspace mission route; `settings/` and `workspace/` sub-directory routes no
longer exist. Auto-registered by the TanStack Router Vite plugin to
`src/routeTree.gen.ts` (10 registered paths).

| Route file                          | Path                                  | Purpose                                              |
| ----------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| `__root.tsx`                        | — (layout)                            | Public-route guard, AgenticLayout, providers, Toaster |
| `index.tsx`                         | `/`                                   | Redirect → `/workspace/1/2026/3/close`               |
| `auth.tsx`                          | `/auth`                               | Legacy auth shell — redirects to `/login`            |
| `login.tsx`                         | `/login`                              | Login page (`LoginForm`)                             |
| `signup.tsx`                        | `/signup`                             | Registration (`SignupForm`)                          |
| `forgot-password.tsx`               | `/forgot-password`                    | Password reset request                               |
| `reset-password.tsx`                | `/reset-password`                     | Password reset form                                  |
| `verify-email.tsx`                  | `/verify-email`                       | Email verification                                   |
| `onboarding.tsx`                    | `/onboarding`                         | OnboardingWizard (+ Outlet)                          |
| `settings.tsx`                      | `/settings`                           | Placeholder stub ("Coming soon")                     |
| `workspace.$companyId.$year.$month.$intent.tsx` | `/workspace/$companyId/$year/$month/$intent` | **Mission workspace** (command-center projection) |
| `__tests__/root-fiscal-inspector-provider.test.tsx` | —                     | Route-layer test                                     |

## Features (by directory)

| Feature         | Path                                | Purpose                                                                  |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| workspace       | src/features/workspace/             | Mission workspace: `MissionWorkspace`, mission state/actions/approval/evidence/receipt components, reducer + 6 hooks, transports (http/SSE/mock), contracts |
| evidence        | src/features/evidence/              | Evidence vault: `EvidenceVaultPage`, `EvidenceBrowserPage`, `EvidenceDetailPage`, `useEvidence`, lineage/upload/table components |
| firm            | src/features/firm/                  | Firm dashboard, client list/detail (client 360, RUC scope), alerts panel  |
| cierre-mensual  | src/features/cierre-mensual/        | Monthly close page (`CierreMensualPage`), mission timeline, blockers, `useCierreMensual` |
| fiscal-chat     | src/features/fiscal-chat/           | Fiscal chat UI + chat parser/types                                       |
| chat-agent      | src/features/chat-agent/            | Chat agent UI                                                            |
| invoices        | src/features/invoices/              | Invoice board, create/edit form, OSE lifecycle + status tone, PDF preview, artifacts |
| compliance      | src/features/compliance/            | SIRE management, CPE validator, detracciones, roadmap MVP, `useSireReconciliation` |
| ledger          | src/features/ledger/                | General ledger API response + view models                                |
| reconciliations | src/features/reconciliations/       | Bank reconciliation data, types, utils                                   |
| approval-hub    | src/features/approval-hub/          | Approval hub components                                                  |
| auth            | src/features/auth/                  | Login/signup/verify forms, UserMenu, session hooks, corporate registration |
| onboarding      | src/features/onboarding/            | Onboarding wizard + interactive demos                                    |
| settings        | src/features/settings/              | Settings view + general settings hook                                    |

## Common tasks

| Task                                     | Location                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| Work on the mission workspace (command center) | `src/features/workspace/` — `MissionWorkspace.tsx`, `components/mission/`, `hooks/`, `services/` |
| Add a mission transport or API call      | `src/features/workspace/services/http-mission-transport.ts`, `sse-mission-stream.ts`, `mission-client.ts` |
| Switch to the mock mission transport     | Set `VITE_DRENYRA_MISSION_TRANSPORT=mock` (uses `mock-mission-transport.ts`)     |
| Monthly close page and timeline           | `src/features/cierre-mensual/` (`CierreMensualPage`, `AgentTimeline`, `MissionBlockers`) |
| Evidence vault surfaces                   | `src/features/evidence/` (`EvidenceVaultPage`, `EvidenceBrowserPage`, `EvidenceDetailPage`) |
| Client 360 / firm surfaces                | `src/features/firm/` (`FirmDashboard`, `ClientList`, `ClientDetail`)             |
| Invoice board / OSE lifecycle             | `src/features/invoices/` (board, create-invoice form, OSE widgets/hooks)         |
| SIRE / CPE / detracciones                 | `src/features/compliance/` (tabs + hooks)                                        |
| Navigation model (sidebar sections/items) | `src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts`             |
| Command palette / command bar             | `src/components/agentic-shell/AgenticCommandBar/`, `src/lib/commands/command-registry.ts` |
| Approval gate UI                          | `src/components/workbench/ApprovalGate.tsx`                                      |

## Component tree

### Agentic shell (`src/components/agentic-shell/`)

| Component           | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| AgenticLayout       | App shell: sidebar + workspace + context rail   |
| AgenticSidebar      | Outcome-first navigation (17 items, 5 sections) |
| AgenticCommandBar   | Command entry                                   |
| WorkspaceSelector   | Company/workspace switching                     |

### Workbench (`src/components/workbench/`)

| File                       | Purpose                            |
| -------------------------- | ---------------------------------- |
| PaneContainer / Pane       | Resizable command-center panes     |
| ResizeHandle               | Pane resize                        |
| WorkspaceTopBar            | Workspace top bar                  |
| WorkspaceIntentSwitcher    | Intent switching (close, etc.)     |
| PeriodSwitcher             | Fiscal period switching            |
| CompanySwitcher            | Company/RUC switching              |
| ApprovalGate               | Explicit human approval gate       |
| EvidenceInspector          | Evidence inspection panel          |
| AttentionInbox             | Action/attention inbox             |
| AgentActivityFeed/View     | Agent activity stream              |
| AgentStateBadge            | Agent state badge                  |
| ChangeSetCard              | Change-set display                 |
| FinancialDiffCard          | Financial diff display             |
| SkillsBrowserPane          | Skills browser                     |
| ScreenReaderAnnouncer      | Accessibility announcer            |

### Fiscal (`src/components/fiscal/`)

| File                  | Purpose                          |
| --------------------- | -------------------------------- |
| AgentMissionTimeline  | Mission step timeline           |
| FiscalRiskLayer       | Fiscal risk overlay             |

### Layout (`src/components/layout/`)

| File                 | Purpose              |
| -------------------- | -------------------- |
| FiscalEditorialShell | Unified editorial shell (`operational` \| `command-center`) |

### Agentic (`src/components/agentic/`)

| File            | Purpose              |
| --------------- | -------------------- |
| CommandPalette  | Command palette      |
| RightPanel      | Right context rail   |

### UI (`src/components/ui/`) — shadcn + custom

Atoms: `text.tsx` (only atom left).

Primitives: `alert-dialog`, `badge`, `button`, `calendar`, `card`, `checkbox`, `command`, `data-state-wrapper`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `popover`, `scroll-area`, `select`, `skeleton`, `switch`, `tabs`, `textarea`, `tooltip`, `typography`.

Surfaces & shell: `SurfaceCard`, `SurfacePanel`, `glass-card`, `liquid-glass`, `panel`, `PageShell`, `PageHeader`, `StatusBadge`, `NavItem`, `NavSection`, `metric-card`, `empty-state`, `error-state`, `loading-state`, `page-transition`, `motion-primitives`, `floating-action-button/`, `keyboard-shortcuts-help`, `UXModeToggle`.

### Notifications (`src/components/notifications/`)

| File                 | Purpose               |
| -------------------- | --------------------- |
| NotificationSidebar  | Notification sidebar  |

## State management

### Zustand stores (`src/stores/`)

| Store                  | File                               | Purpose                                                                  |
| ---------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| useUIStore             | src/stores/ui.store.ts             | Theme preference, complexity level, sidebar/rail state. Persisted.        |
| useWorkspaceStore      | src/stores/workspace.store.ts      | Workspace state (company, period, intent)                                |
| useAgenticShellStore   | src/stores/agentic-shell.store.ts  | Agentic shell layout state                                               |

### XState machines

| Location                 | Use                                                     |
| ------------------------ | ------------------------------------------------------- |
| `src/lib/process-machine/` | Generic process → analyze → resolve machines           |
| `src/features/compliance/hooks/useSireReconciliation.ts` | SIRE reconciliation flow   |

### TanStack Query

- Global client config: `src/lib/query-client.ts`
- Feature-level query keys/options: `*.query.ts`, `*.query-keys.ts`, `*.query-options.ts` within features

## React Context providers

| Provider                | File                                    | Purpose                       |
| ----------------------- | --------------------------------------- | ----------------------------- |
| FiscalInspectorProvider | src/context/FiscalInspectorContext.tsx  | Fiscal inspector state       |
| InspectorProvider       | src/context/InspectorContext.tsx        | Inspector state              |
| DensityProvider         | src/contexts/density-context.tsx        | UI density mode              |
| WorkspaceProvider       | src/contexts/workspace-context.tsx      | Workspace context            |

## Key entrypoints

| File                    | Role                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------ |
| src/client.tsx          | React root mount, QueryClient init, RouterProvider, theme bootstrap, monitoring init |
| src/router.tsx          | TanStack Router factory (context, preload, error components)                         |
| src/remote-entry.tsx    | Module Federation entry — exposes `createRouter` for the Drenyra OS shell            |
| src/routeTree.gen.ts    | Auto-generated route tree (do NOT edit)                                              |
| src/routes/__root.tsx   | Root layout: public-route guard, AgenticLayout, global providers, Toaster            |
| src/lib/query-client.ts | TanStack Query client (retry, stale time, cache config)                              |
| src/lib/auth-client.ts  | Better Auth client (Eden Treaty)                                                     |
| src/index.css           | Tailwind 4 entry + custom @theme variables                                           |
| vite.config.ts          | Vite config: React Compiler, TanStack Router, Tailwind, dev proxy, chunk splitting   |
| vitest.config.ts        | Test config: jsdom, coverage thresholds (70/65/60/70), setup                         |

## Fast search recipes

```bash
# Find all route files
fd \.tsx$ src/routes/ -tf | sort

# Find all feature modules
ls src/features/ | sort

# Find store files
fd store src/ -tf -e ts

# Find test files by feature
fd __tests__ src/features/invoices/ -tf

# Find context providers
rg createContext src/context/ src/contexts/

# Find API query options (TanStack Query)
rg queryOptions src/features/ -l

# Find XState machines
rg createProcessMachine src/lib/process-machine/

# Find Eden Treaty route calls
rg treaty src/ -l

# Find all Zustand stores
rg 'create\(' src/stores/ -g *.ts

# Find design token references
rg 'var\(--' src/ | head
```

## Common tasks to exact paths

| Task                          | Start path                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| Add new route                 | src/routes/<name>.tsx then add feature in src/features/<name>/        |
| Work on mission workspace     | src/features/workspace/components/MissionWorkspace.tsx                |
| Add mission UI component      | src/features/workspace/components/mission/                            |
| Add mission hook              | src/features/workspace/hooks/ (missionReducer + useMission* hooks)    |
| Change mission transport      | src/features/workspace/services/http-mission-transport.ts             |
| Change sidebar nav items      | src/components/agentic-shell/AgenticSidebar/AgenticSidebar.data.ts    |
| Add command to palette        | src/lib/commands/command-registry.ts + default-commands.ts            |
| Change auth guard             | src/routes/__root.tsx (PUBLIC_ROUTES)                                 |
| Add UI component              | src/components/ui/<name>.tsx                                          |
| Change Zustand store          | src/stores/<name>.store.ts                                            |
| Change API client             | src/lib/api-factory*.ts or src/lib/http-client.ts                     |
| Change design tokens          | `tokens.dtcg.json` (expected source) → `bun run tokens:generate` at repo root; checked-in output is `src/lib/design-tokens/generated/tokens.css` |
| Add test                      | src/**tests**/ (setup), feature-level **tests**/ dirs                 |
| Change ESLint                 | eslint.config.js                                                      |
| Change dev proxy              | vite.config.ts (server.proxy) + vite.dev-api-proxy.ts                 |
| Change chunk splitting        | vite.config.ts (resolveManualChunk)                                   |
| Change test config            | vitest.config.ts                                                      |
| Change TS config              | tsconfig.json, tsconfig.check.json                                    |
| Add dependency                | bun add <pkg> (check if already in workspace)                         |

## Dependencies (core)

| Package                | Version  | Purpose                  |
| ---------------------- | -------- | ------------------------ |
| react                  | ^19.2.7  | UI framework             |
| @tanstack/react-router | ^1.103.3 | Type-safe routing        |
| @tanstack/react-query  | ^5.90.19 | Server state             |
| zustand                | ^5.0.10  | Client state             |
| xstate                 | ^5.28.0  | State machines           |
| @xstate/react          | ^6.1.0   | XState React bindings    |
| @elysiajs/eden         | ^1.4.6   | Type-safe API client     |
| better-auth            | ^1.6.16  | Authentication           |
| zod                    | ^4.3.5   | Schema validation        |
| react-hook-form        | ^7.71.1  | Forms                    |
| tailwindcss            | ^4.1.18  | CSS utility framework    |
| framer-motion          | ^12.27.3 | Animations               |
| recharts               | ^3.8.1   | Charts                   |
| @react-pdf/renderer    | ^4.3.2   | PDF generation           |
| @dnd-kit/core          | ^6.3.1   | Drag and drop            |
| @radix-ui/*            | --       | Accessible UI primitives |
| lucide-react           | 1.25.0   | Icons                    |
| sonner                 | ^2.0.7   | Toast notifications      |
| cmdk                   | ^1.1.1   | Command palette          |
| @drenyra/mission-domain| workspace:* | Mission domain contract (shared types) |

## CI gates

```bash
bun install --frozen-lockfile           # Install deps
bun run typecheck                        # TypeScript strict check (tsc -p tsconfig.check.json)
bun run lint                             # ESLint on src/
bun run test:run                         # Vitest (coverage: lines 70%, functions 65%, branches 60%, statements 70%)
bun run build                            # Vite production build
bun run check:bundle                     # Bundle budget check
bun run check:classnames                 # Classname template literal check
bun run test:e2e                         # Playwright (e2e/ incl. missions specs)
```
