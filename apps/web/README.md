---
last-verified: 2026-08-14
source-of-truth: apps/web/package.json
auto-generated: false
---

# Drenyra Web — Financial Command Center SPA

**Última actualización**: 2026-08-14
**Versión**: 0.1.0 | **Stack**: React 19 + Vite + TanStack Router

---

> 📖 **Referencias**: [Drenyra Product Philosophy](../../docs/products/drenyra-product-philosophy.md) · [Drenyra Documentation Standards](../../AGENTS.md#documentation-standards-2026-best-practices)

---

## ⏱ Si solo tenés tres minutos

Drenyra Web es el agentic fiscal command center de Drenyra — the verifiable financial operating system. Esto es lo que necesitás saber:

| Si venís por...            | Respuesta corta                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **¿Qué es?**               | SPA en React 19 — workspace de misiones contables, evidencia fiscal, firmas/clientes y cumplimiento SUNAT       |
| **Stack clave**            | React 19 + Vite 8 + TanStack Router + TanStack Query + Tailwind CSS v4 + shadcn/ui                              |
| **¿Dónde está el código?** | `apps/web/src/` — features en `src/features/` (14 slices), rutas en `src/routes/`, componentes en `src/components/` |
| **¿Cómo lo ejecuto?**      | `cd apps/web && bun run dev`                                                                                    |
| **¿Cómo se prueba?**       | `bun run test:run` (Vitest + Testing Library), `bun run test:e2e` (Playwright)                                  |
| **API**                    | Eden Treaty — tipado extremo a extremo; misiones montadas en `/api/v1/missions`                                 |
| **Auth**                   | Better Auth — login en `/login`, session-based con refresh automático                                           |
| **Diseño**                 | Command-center editorial — dark mode, tokens DTCG en `src/lib/design-tokens/generated/tokens.css`              |

Profundizá abajo según tu interés. Cada sección es independiente.

---

## 🎯 Purpose

The **Drenyra Web** app is the browser-based command center for Drenyra, Peru's National Tax Intelligence Infrastructure. Its current surface is the **mission workspace** — a supervised monthly-close flow where the agent prepares, evidences, and routes fiscal work through explicit human approval — surrounded by auth, onboarding, and the fiscal product model (evidence vault, firm/client 360, fiscal chat, compliance) that defines the roadmap.

> **Warm take**: Think of this as the cockpit for Peru's tax intelligence infrastructure. Every pixel exists to help fiscal professionals make better decisions — faster, with more context, and less friction.

**Fiscal guardrails:** tenant/RUC scope, source evidence, approval state, and reversal path must stay visible next to every high-risk agentic recommendation. No unsupervised fiscal mutations; no magical AI claims.

---

## 🏗️ Architecture

```text
apps/web/src/
├── features/          # Vertical feature slices (14)
│   ├── workspace/     #   Mission workspace — command-center projection
│   ├── evidence/      #   Evidence vault (vault/browser/detail pages)
│   ├── firm/          #   Firm dashboard + client 360
│   ├── cierre-mensual/#   Monthly close page + mission components
│   ├── invoices/      #   Invoice board, OSE lifecycle, PDF
│   ├── compliance/    #   SIRE, CPE validator, detracciones
│   └── ...            #   auth, onboarding, settings, ledger, reconciliations, fiscal-chat, chat-agent, approval-hub
├── routes/            # TanStack Router route files (11 modules + 1 test, 10 paths)
├── components/        # UI components (agentic-shell, workbench, fiscal, ui, atoms)
├── stores/            # Zustand stores
├── lib/               # Utilities, api-factory, crud-api, clients, design tokens
├── styles/            # Global CSS (index.css, Tailwind 4 entry)
├── context/ + contexts/  # React context providers (FiscalInspector, Inspector, density, workspace)
└── types/             # TypeScript type definitions
```

### Routing (TanStack Router)

All routes live in `src/routes/` — type-safe, file-based lazy loading. The router is intentionally narrow: auth flows, onboarding, a settings stub, and the mission workspace.

| Route                       | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| `/`                         | Redirect → `/workspace/1/2026/3/close`                   |
| `/login`                    | Authentication                                          |
| `/signup`                   | Registration                                            |
| `/forgot-password`          | Password recovery                                       |
| `/reset-password`           | Password reset                                          |
| `/verify-email`             | Email verification                                      |
| `/auth`                     | Legacy auth shell (redirects to `/login`)               |
| `/onboarding`               | User onboarding wizard                                  |
| `/settings`                 | Settings stub ("Coming soon")                           |
| `/workspace/$companyId/$year/$month/$intent` | **Mission workspace** — the command-center surface (monthly-close intent) |

> The sidebar (`AgenticSidebar.data.ts`) defines the outcome-first nav model (Bandeja, Misiones, Empresas, Evidencia, Cola de revisión, Bancos, Conciliaciones, Comprobantes, Libro Mayor, Impuestos, SIRE/SUNAT, Cumplimiento). Only the workspace and auth paths are wired in the router today; the rest are planned surfaces backed by feature modules.

### Feature Catalog (src/features/)

14 feature slices:

**Command center:** `workspace` (missions), `evidence` (vault), `firm` (client 360), `approval-hub`, `cierre-mensual`

**Fiscal & AI:** `fiscal-chat`, `chat-agent`, `compliance` (SIRE / CPE / detracciones)

**Accounting:** `invoices`, `ledger`, `reconciliations`

**Platform:** `auth`, `onboarding`, `settings`

### API posture

| Posture | Path / location | Status |
| ------- | --------------- | ------ |
| **(a) Mounted production mission flow** | `apps/api/src/features/missions` → `/api/v1/missions` | Mounted in `app-core.ts`; web consumes via `http-mission-transport.ts` + `sse-mission-stream.ts` |
| **(b) Planned/unmounted contracts** | `apps/api/src/features/drenyra-runtime` | Contract-only ("Drenyra Runtime / Brain Service") — NOT mounted; planned `/runtime/*` endpoints |
| **(c) Mock/demo transports** | `mock-mission-transport.ts` | Enabled only by `VITE_DRENYRA_MISSION_TRANSPORT=mock`; default is production HTTP transport |

---

## 📦 Tech Stack

| Layer             | Technology                              |
| ----------------- | --------------------------------------- |
| **Framework**     | React 19 (^19.2.7) with React Compiler  |
| **Build**         | Vite 8 + @vitejs/plugin-react           |
| **Routing**       | TanStack Router 1.103 (type-safe routes)|
| **Data Fetching** | TanStack Query 5.90                     |
| **HTTP Client**   | Eden Treaty (type-safe API consumption) |
| **State**         | Zustand 5 + XState 5 (process-machine, fiscal flows) |
| **Forms**         | React Hook Form 7.71 + Zod 4.3          |
| **Styling**       | Tailwind CSS v4 + shadcn/ui             |
| **Animation**     | Framer Motion 12.27                     |
| **PDF**           | @react-pdf/renderer (invoices)          |
| **Charts**        | Recharts 3.8                            |
| **Auth**          | Better Auth ^1.6.16 (client)            |
| **DnD**           | dnd-kit                                 |
| **Testing**       | Vitest 4.1.10 + Testing Library + Playwright |
| **Package**       | @drenyra/* (workspace deps, incl. @drenyra/mission-domain) |

### Design System

The command-center editorial design system powers the UI:

- Dark mode by default with `--text-*` CSS custom property tokens
- Design tokens: checked-in generated CSS at `src/lib/design-tokens/generated/tokens.css` (DTCG source + generator via root `bun run tokens:generate`)
- `SurfacePanel` / `SurfaceCard` as canonical card surfaces, `FiscalEditorialShell` for the unified shell
- Atomic primitives: `atoms/` (text) + `ui/` (shadcn + custom)
- Custom scroll animations and view transitions in `src/styles/`

### API Integration

All API requests flow through Eden Treaty for end-to-end type safety, with the mission flow calling the mounted `/api/v1/missions` endpoints directly:

```typescript
import { eden } from '@/lib/api-client'
// Fully typed — matches @drenyra/api routes exactly
```

```typescript
// Mission workspace transport (production path)
import { createMission, getMission, approveMission } from '@/features/workspace/services/http-mission-transport'
```

---

## 🚀 Commands

```bash
# Development
cd apps/web
bun run dev         # Start Vite dev server
bun run start       # Preview production build

# Build
bun run build       # Production build

# Testing
bun run test            # Watch mode
bun run test:run        # Single run
bun run test:coverage   # With coverage
bun run test:ui         # Vitest UI
bun run test:e2e        # Playwright (incl. missions specs)

# Quality
bun run lint            # ESLint
bun run typecheck       # TypeScript check
bun run check:bundle    # Bundle size budget
bun run quality         # test + build + bundle check
bun run quality:strict  # lint + classnames + quality
bun run check:classnames # Template literal detection
```

---

## 🔐 Authentication

- Better Auth client configured in `src/lib/auth-client.ts`
- Login route at `/login` with email/password
- Session-based auth with automatic token refresh
- Route guard via public-route set in `src/routes/__root.tsx`
- Company context switching for multi-RUC operations

---

## 🧪 Testing

```bash
# All tests
bun run test:run

# Component tests (Vitest + Testing Library)
bun run test:run src/components/

# Feature tests
bun run test:run src/features/

# E2E (Playwright)
bun run test:e2e
```

Coverage thresholds: lines 70%, functions 65%, branches 60%, statements 70%.

---

## 📁 Related Packages

| Package                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `@drenyra/api`         | Backend API (Elysia) — consumed via Eden Treaty |
| `@drenyra/application` | Use cases & business logic                      |
| `@drenyra/domain`      | Domain entities & value objects                 |
| `@drenyra/mission-domain` | Mission domain contract (shared with API)    |
| `@drenyra/shared`      | Shared utilities & validation                   |
| `@drenyra/ui`          | Shared UI components                            |

---

**Stack**: React 19 + Vite 8 + TanStack Router + TanStack Query + Tailwind CSS v4 + shadcn/ui  
**Auth**: Better Auth | **API**: Eden Treaty | **State**: Zustand 5 + XState  
**Design System**: Command-center editorial | **Última actualización**: 2026-08-14
