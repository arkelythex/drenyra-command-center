# Web App — AI Agent Index

**Last updated:** 2026-08-14

**Last updated:** 2026-08-14 · **Package:** `@drenyra/web` — Drenyra fiscal command center SPA.

## 1. Overview

React SPA for the Drenyra Financial Engineering Environment command center: a mission workspace for the supervised monthly-close flow, an evidence vault, firm/client 360 surfaces, fiscal chat, and SUNAT compliance modules. **568 source files** (`.ts`/`.tsx` in `src/`), **14 feature slices**, **11 route modules** (12 route files, 10 registered paths).

## 2. Stack

| Layer         | Choice                                        |
| ------------- | --------------------------------------------- |
| UI            | React 19.2 (^19.2.7) + React Compiler (prod only) |
| Build         | Vite 8 + TanStack Router Vite plugin          |
| Routing       | TanStack Router 1.103 (type-safe, file-based) |
| Server state  | TanStack Query 5.90                           |
| Client state  | Zustand 5 + XState 5 (process-machine, fiscal flows) |
| API client    | Eden Treaty (`@elysiajs/eden`)                |
| Styling       | Tailwind CSS 4.1                              |
| Design tokens | DTCG → checked-in generated CSS               |
| Primitives    | shadcn/ui + Radix UI                          |
| Forms         | React Hook Form 7.71 + Zod 4                  |
| Auth          | better-auth ^1.6.16 + Eden Treaty client      |

## 3. Architecture

Command-center shell (agentic layout) + vertical slices + workbench surfaces.

```
src/
  client.tsx          — React root mount, QueryClient, RouterProvider
  router.tsx          — TanStack Router factory
  remote-entry.tsx    — Module Federation entry (exposes createRouter)
  routeTree.gen.ts    — Auto-generated (do NOT edit)
  routes/             — 11 route modules + 1 test (10 registered paths)
  features/           — 14 vertical-slice feature modules
  components/         — agentic-shell/, workbench/, fiscal/, agentic/, layout/, ui/, atoms/
  lib/                — api-factory, crud-api, http-client, commands, process-machine, design-tokens
  stores/             — Zustand stores (ui, workspace, agentic-shell)
  context/ + contexts/— React context providers
  styles/             — index.css (Tailwind 4 entry)
  types/              — Shared type definitions
```

Feature slice anatomy: `features/<name>/` keeps `components/`, `hooks/`, `services/`, and tests co-located (see `workspace/`, `evidence/`, `cierre-mensual/` for the current pattern).

## 4. Directory Structure

```
apps/web/src/
  routes/                11 route modules + 1 test
    __root.tsx           Root layout: public-route guard, AgenticLayout, Toaster
    index.tsx            Redirects to /workspace/1/2026/3/close
    login.tsx, signup.tsx, forgot-password.tsx, reset-password.tsx, verify-email.tsx, auth.tsx (→ /login)
    onboarding.tsx       OnboardingWizard
    settings.tsx         Settings stub ("Coming soon")
    workspace.$companyId.$year.$month.$intent.tsx   Mission workspace (command center)

  features/              14 vertical-slice modules
    workspace/           Mission workspace: components/mission/, hooks/, services/ (http, SSE, mock transports)
    evidence/            Evidence vault: EvidenceVaultPage, EvidenceBrowserPage, EvidenceDetailPage
    firm/                FirmDashboard, ClientList, ClientDetail, AlertsPanel
    cierre-mensual/      CierreMensualPage, AgentTimeline, MissionBlockers
    fiscal-chat/         FiscalChat + parser
    chat-agent/          Chat agent UI
    invoices/            Invoice board, create-invoice form, OSE lifecycle, PDF
    compliance/          SIRE, CPE validator, detracciones
    ledger/              Ledger API + view models
    reconciliations/     Bank reconciliation data
    approval-hub/        Approval components
    auth/                Login/signup/verify forms, session hooks
    onboarding/          Wizard + interactive demos
    settings/            Settings view

  components/
    agentic-shell/       AgenticLayout, AgenticSidebar (nav data), AgenticCommandBar, WorkspaceSelector
    workbench/           PaneContainer/Pane, ApprovalGate, EvidenceInspector, WorkspaceTopBar, ...
    fiscal/              AgentMissionTimeline, FiscalRiskLayer
    agentic/             CommandPalette, RightPanel
    layout/              FiscalEditorialShell
    notifications/       NotificationSidebar
    atoms/ + ui/         text (atom) + shadcn/custom (SurfaceCard, SurfacePanel, PageShell, ...)

  lib/
    api-factory*.ts      safeApiCall, queryApi, mutateApi, createCrudApi
    crud-api.ts          createCrudHooks
    http-client.ts, auth-client.ts, query-client.ts
    commands/            command-registry.ts, default-commands.ts
    process-machine/     XState process/analyze/resolve machines
    design-tokens/       generated/tokens.css (checked-in)
    money.ts, date-utils.ts, fiscal-period.ts, legibility.ts, ...

  stores/                ui.store.ts, workspace.store.ts, agentic-shell.store.ts
  context/               FiscalInspectorContext.tsx, InspectorContext.tsx
  contexts/              density-context.tsx, workspace-context.tsx
  styles/                index.css (Tailwind 4 entry + custom theme)
```

## 5. Coding Conventions

- **TypeScript strict mode** — no `any`. Use `unknown` + type guards or branded types.
- **React 19** — no `useMemo`/`useCallback` wrapper spam (React Compiler handles it in prod).
- **Component pattern** — `export function ComponentName({...}: Props)` (no default exports, no `React.FC`).
- **Tailwind class ordering** — shadcn convention: layout → sizing → spacing → typography → colors → effects → states.
- **Money** — never use raw numbers/floats. Use `n()` from design system or domain `Money` value object.
- **Imports** — barrel files at feature/component index. Path aliases via `@/` → `src/`.

## 6. Design System (FEE Command Center)

Command-center theme aligned with the Financial Engineering Environment. Generated tokens at `src/lib/design-tokens/generated/tokens.css` (source DTCG JSON + root `bun run tokens:generate`).

- `--color-voltage-*` / `--accent` — primary CTA accent `#f54e00` (≤5% pixels)
- `--color-fiscal-*` — SUNAT/compliance secondary `#c45c2a`
- `--surface-*`, `--text-*` — flat editorial surfaces (no decorative glass)
- `SurfacePanel` / `SurfaceCard` — canonical card surfaces
- `FiscalEditorialShell` — unified shell (`operational` | `command-center`)
- Complexity modes: `basic` / `advanced` / `expert` via UXModeToggle

See `apps/web/DESIGN.md` and `docs/design/design-influences-2026.md`.

## 7. Routing

TanStack Router 1.103 with file-based code splitting via Vite plugin.

- Routes auto-registered to `routeTree.gen.ts` from `src/routes/`.
- Root layout (`__root.tsx`): public-route guard (`PUBLIC_ROUTES` set), `AgenticLayout` for authed surfaces, Toaster.
- The live command-center surface is `/workspace/$companyId/$year/$month/$intent` (MissionWorkspace).
- Sidebar nav data (`AgenticSidebar.data.ts`) defines the outcome-first model — many destinations are planned, not yet routed.

## 8. State Management

- **Server state** → TanStack Query. Global config in `src/lib/query-client.ts`. Feature-level: `*.query-options.ts`, `*.query-keys.ts`.
- **Client state** → Zustand 5 (`src/stores/ui.store.ts`, `workspace.store.ts`, `agentic-shell.store.ts`). XState 5 for `process-machine` flows and `useSireReconciliation`.
- **Mission flow** → reducer + hooks in `src/features/workspace/hooks/` (`missionReducer.ts`, `useMissionExecution`, `useMissionSnapshot`, `useMissionDecision`, `useMissionRecovery`, ...).
- **Context** → React Context for fiscal inspector and workspace-level state.

## 9. Testing

| Type      | Tool                            | Scope                                          |
| --------- | ------------------------------- | ---------------------------------------------- |
| Unit      | Vitest + jsdom                  | Domain logic, helpers, hooks, feature services |
| Component | Vitest + @testing-library/react | Component rendering, interactions              |
| E2E       | Playwright                      | Critical user paths, auth, mission flows       |

**80/100/0 rule:** 80% unit, 100% integration for fiscal/audit paths, 0% flaky E2E.

Coverage thresholds: lines 70%, functions 65%, branches 60%, statements 70%.

Test files co-located in `__tests__/` dirs at feature level or `src/__tests__/` for global setup. E2E specs in `e2e/` (incl. `e2e/missions/`).

## 10. SDD Workflow

Changes follow an SDD pipeline through dedicated Git worktrees:

```
init → explore → propose → spec → design → tasks → apply → verify → archive
```

- `init` — scope the change, register in Engram.
- `explore` — investigate codebase, gather context.
- `propose` — intent, scope, approach.
- `spec` — requirements + scenarios (delta specs).
- `design` — technical architecture approach.
- `tasks` — implementation checklist.
- `apply` — write code, tests, docs.
- `verify` — validate against specs.
- `archive` — sync delta → main specs, close.

Worktrees at `~/Documents/PROYECTOS/Drenyra/worktrees/<task-name>`, branch `feat/<task-name>`.

### Delegation Triggers

When working on web features, delegate to sub-agents when:

- **4-file rule**: change touches 4+ files across features, routes, or components → use `frontend` or `frontend-builder`
- **Design system change**: modifying tokens, shadcn components, or layout → pair with `frontend-designer`
- **Route addition**: new route with loader, search params, and query options → `frontend-builder` with TanStack Router skill
- **SDD change**: full SDD cycle for fiscal/audit features → `sdd-*` agents
- **E2E test addition**: new Playwright test for critical fiscal path → `tester` with Playwright skill

> Full reference: [Gentleman Philosophy — Delegation Triggers](../../docs/meta/gentleman-philosophy.md#delegation-triggers-para-agentes)

## Quick Reference

```bash
# Build & dev (from apps/web)
bun run dev              # Vite dev server
bun run build            # Production build
bun run typecheck        # tsc --noEmit (strict mode)
bun run lint             # ESLint src/
bun run test:run         # Vitest with coverage
bun run test:e2e         # Playwright e2e

# Repo-wide docs/nav commands (run from monorepo root)
bun run codebase:index   # Regenerate CODEX-MAP.md
bun run docs:verify      # Check docs links & product surfaces

# Find routes
ls src/routes/ | grep .tsx

# Find feature modules
ls src/features/ | sort

# Find stores
ls src/stores/

# Find query options
rg queryOptions src/features/ -l
```
