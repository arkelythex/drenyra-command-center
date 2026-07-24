# Web App — AI Agent Index

**Last updated:** 2026-06-20

**Last updated:** 2026-06-20 · **Package:** `@drenyra/web` — Drenyra fiscal intelligence command center SPA.

## 1. Overview

React SPA for the Drenyra Financial Engineering Environment: fiscal dashboards, invoice Kanban, bank reconciliation, cashflow projections, SUNAT compliance, AI agent swarm, and audit trails. ~1,089 source files, 40 feature modules, 47 routes.

## 2. Stack

| Layer         | Choice                                        |
| ------------- | --------------------------------------------- |
| UI            | React 19.2 + React Compiler (prod only)       |
| Build         | Vite 8 + TanStack Router Vite plugin          |
| Routing       | TanStack Router 1.103 (type-safe, file-based) |
| Server state  | TanStack Query 5.90                           |
| Client state  | Zustand 5 + XState 5 (fiscal flows)           |
| API client    | Eden Treaty (`@elysiajs/eden`)                |
| Styling       | Tailwind CSS 4.1                              |
| Design tokens | DTCG JSON → generated CSS                     |
| Primitives    | shadcn/ui + Radix UI                          |
| Forms         | React Hook Form 7.71 + Zod 4                  |
| Auth          | better-auth 1.4 + Eden Treaty client          |

## 3. Architecture

Container-Presentational pattern + collaborative agents + vertical slices.

```
src/
  client.tsx          — React root mount, QueryClient, RouterProvider
  router.tsx          — TanStack Router factory
  routeTree.gen.ts    — Auto-generated (do NOT edit)
  routes/             — 47 flat route files (settings/ and workspace/ have sub-routes)
  features/           — 40 vertical-slice feature modules
  components/         — Shared components (atoms/, molecules/, ui/, layout/, agentic/)
  lib/                — Core lib (router, navigation, design-tokens, schemas, clients)
  hooks/              — Global hooks
  store/ + stores/    — Zustand stores
  context/            — React context providers
  services/           — PDF, etc.
  styles/             — view-transitions.css, scroll-animations.css
```

Feature slice anatomy: `features/<name>/` has `components/`, `hooks/`, `api/`, `types/`, `index.ts`.

## 4. Directory Structure

```
apps/web/src/
  routes/                47 flat route files
    __root.tsx           Root layout: auth guard, MainLayout, providers
    index.tsx            Redirects to /dashboard
    login.tsx, dashboard.tsx, invoices.tsx, banking.tsx, ...
    settings/            Organization, security, notifications, appearance, billing, integrations
    workspace/           Operations, finance, compliance, system-admin

  features/              40 vertical-slice modules
    auth/, dashboard/, invoices/, banking/, cashflow/, compliance/
    cognitive-hub/, drenyra-command-center/, taxation/, ledger/
    reconciliations/, products/, settings/, payroll/, assets/
    inventory/, bills/, audit/, reports/, agent-swarm/, approval-hub/
    inbox/, artifacts/, cierre-mensual/, + 17 more

  components/
    atoms/               button, spinner, icon, text, badge, dot, ai-indicator
    molecules/           OmniAgent, stat-card, metric-card, status-card
    ui/                  shadcn + custom (glass-card, table, dialog, panel, PageShell, etc.)
    layout/              MainLayout, Sidebar, TopBar, BottomNav, FiscalInspector
    agentic/             AgentPulse, ConfidenceBadge, ConflictDiffView

  lib/
    api-client.ts, http-client.ts, treaty-route-client.ts
    auth-client.ts, query-client.ts
    design-tokens/       DTCG JSON → CSS pipeline
    schemas/             Zod schemas (customer, vendor, product, invoice)
    router/              Route definitions, public routes, fallbacks
    navigation/          Nav items (compact + full), types

  hooks/                 useFiscalAction, useUndoRedo, useKeyboardShortcuts, usePerformance
  store/                 ui-store.ts (theme, complexity, sidebar state)
  stores/                sidebar-layout.store.ts
  context/               Sidebar, Settings, Simulation, ArtifactEvent, FiscalInspector, AgentAware
  services/              pdf.service.ts
  styles/                view-transitions.css, scroll-animations.css
```

## 5. Coding Conventions

- **TypeScript strict mode** — no `any`. Use `unknown` + type guards or branded types.
- **React 19** — no `useMemo`/`useCallback` wrapper spam (React Compiler handles it in prod).
- **Component pattern** — `export function ComponentName({...}: Props)` (no default exports, no `React.FC`).
- **Tailwind class ordering** — shadcn convention: layout → sizing → spacing → typography → colors → effects → states.
- **Money** — never use raw numbers/floats. Use `n()` from design system or domain `Money` value object.
- **Imports** — barrel files at feature/component index. Path aliases via `@/` → `src/`.

## 6. Design System (FEE Design)

Command-center theme aligned with the Financial Engineering Environment. Tokens at `src/lib/design-tokens/tokens.dtcg.json` v3.0.0.

- `--color-voltage-*` / `--accent` — primary CTA accent `#f54e00` (≤5% pixels)
- `--color-fiscal-*` — SUNAT/compliance secondary `#c45c2a`
- `--surface-*`, `--text-*` — flat editorial surfaces (no decorative glass)
- `SurfacePanel` — canonical card surface
- `FiscalEditorialShell` — unified shell (`operational` | `command-center`)
- Complexity modes: `basic` / `advanced` / `expert` via UXModeToggle

See `apps/web/DESIGN.md` and `docs/design/design-influences-2026.md`.

## 7. Routing

TanStack Router 1.103 with file-based code splitting via Vite plugin.

- Routes auto-registered to `routeTree.gen.ts` from `src/routes/`.
- Root layout (`__root.tsx`): auth guard via `beforeLoad`, MainLayout, global providers, Toaster.
- All routes are lazy-loaded by default.
- Search params for filters (invoice status, date ranges, etc.).
- Preload route data with TanStack Router loaders + Query client prefetch.

## 8. State Management

- **Server state** → TanStack Query. Global config in `src/lib/query-client.ts`. Feature-level: `*.query-options.ts`, `*.query-keys.ts`.
- **Client state** → Zustand 5 (`src/store/ui-store.ts` persisted to localStorage; `src/stores/` for rest). XState 5 for complex fiscal workflows (invoices, compliance).
- **Context** → React Context for layout-level state (sidebar, settings, simulation mode).

## 9. Testing

| Type      | Tool                            | Scope                                          |
| --------- | ------------------------------- | ---------------------------------------------- |
| Unit      | Vitest + jsdom                  | Domain logic, helpers, hooks, feature services |
| Component | Vitest + @testing-library/react | Component rendering, interactions              |
| E2E       | Playwright                      | Critical user paths, auth, fiscal flows        |

**80/100/0 rule:** 80% unit, 100% integration for fiscal/audit paths, 0% flaky E2E.

Coverage thresholds: lines 60%, functions 60%, branches 55%, statements 60%.

Test files co-located in `__tests__/` dirs at feature level or `src/__tests__/` for global setup.

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
# Build & dev
bun run dev              # Vite dev server
bun run build            # Production build
bun run typecheck        # tsc --noEmit (strict mode)
bun run lint             # ESLint src/
bun run test:run         # Vitest with coverage

# Navigation
bun run codebase:index   # Regenerate CODEX-MAP.md
bun run docs:verify      # Check docs freshness & links

# Find routes
ls src/routes/ | grep .tsx

# Find feature modules
ls src/features/ | sort

# Find stores
rg create\( src/ -g *.ts

# Find Zo d schemas
fd schema src/lib/schemas/

# Find query options
rg queryOptions src/features/ -l
```
