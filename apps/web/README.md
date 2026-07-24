---
last-verified: 2026-06-20
source-of-truth: apps/web/package.json
auto-generated: false
---

# Drenyra Web — Financial Intelligence SPA

**Última actualización**: 2026-06-20
**Versión**: 0.1.0 | **Stack**: React 19 + Vite + TanStack Router

---

> 📖 **Referencias**: [Gentleman Philosophy](../../docs/meta/gentleman-philosophy.md) · [Documentation Standards 2026](../../docs/meta/documentation-standards-2026.md)

---

## ⏱ Si solo tenés tres minutos

Drenyra Web es el agentic fiscal command center de Drenyra — the verifiable financial operating system. Esto es lo que necesitás saber:

| Si venís por...            | Respuesta corta                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| **¿Qué es?**               | SPA en React 19 para dashboards financieros, facturación, conciliación bancaria e inteligencia fiscal   |
| **Stack clave**            | React 19 + Vite 8 + TanStack Router + TanStack Query + Tailwind CSS v4 + shadcn/ui                      |
| **¿Dónde está el código?** | `apps/web/src/` — features en `src/features/`, rutas en `src/routes/`, componentes en `src/components/` |
| **¿Cómo lo ejecuto?**      | `cd apps/web && bun run dev`                                                                            |
| **¿Cómo se prueba?**       | `bun run test:run` (Vitest + Testing Library)                                                           |
| **API**                    | Eden Treaty — tipado extremo a extremo con `@drenyra/api`                                               |
| **Auth**                   | Better Auth — login en `/login`, session-based con refresh automático                                   |
| **Diseño**                 | Glass & Steel — dark mode, tokens DTCG en `src/lib/design-tokens/`                                      |

Profundizá abajo según tu interés. Cada sección es independiente.

---

## 🎯 Purpose

The **Drenyra Web** app is the browser-based SPA for Drenyra, Peru's National Tax Intelligence Infrastructure. It provides financial dashboards, tax compliance tools, invoice management, banking reconciliation, and AI-powered fiscal insights — all in a responsive dark-mode interface built with the **Glass & Steel** design system.

> **Warm take**: Think of this as the cockpit for Peru's tax intelligence infrastructure. Every pixel exists to help fiscal professionals make better decisions — faster, with more context, and less friction.

---

## 🏗️ Architecture

```text
apps/web/src/
├── features/          # Vertical feature slices (41 features)
├── routes/            # TanStack Router route definitions
├── components/        # UI components (atomic design)
│   ├── atoms/         #   Basic building blocks
│   ├── molecules/     #   Composed units
│   ├── ui/            #   shadcn/ui primitives
│   └── layout/        #   Layout shells
├── hooks/             # Custom React hooks
├── stores/            # Zustand stores
├── services/          # Service modules (PDF, etc.)
├── lib/               # Utilities, clients, design tokens
├── styles/            # Global CSS (scroll-animations, view-transitions)
├── context/           # React context providers
└── types/             # TypeScript type definitions
```

### Routing (TanStack Router)

All routes live in `src/routes/` — type-safe, file-based lazy loading with built-in search params and loaders.

| Route                       | Description                     |
| --------------------------- | ------------------------------- |
| `/`                         | Dashboard                       |
| `/login`                    | Authentication                  |
| `/forgot-password`          | Password recovery               |
| `/invoices`                 | Invoice management              |
| `/banking`                  | Banking & reconciliation        |
| `/cashflow`                 | Cash flow management            |
| `/customers`                | Customer management             |
| `/bills`                    | Bills payable                   |
| `/inventory`                | Inventory / kardex              |
| `/taxation`                 | Tax compliance                  |
| `/compliance`               | Regulatory compliance           |
| `/audit`                    | Audit trail                     |
| `/settings`                 | User & company settings         |
| `/reports`                  | Financial reports               |
| `/ledger`                   | General ledger                  |
| `/cierre-mensual`           | Monthly close                   |
| `/documents`                | Document management             |
| `/expedientes`              | File/record management          |
| `/intelligence`             | AI insights                     |
| `/onboarding`               | User onboarding                 |
| `/payroll`                  | Payroll management              |
| `/entities`                 | Entity management               |
| `/products`                 | Product catalog                 |
| `/assets`                   | Asset management                |
| `/approvals`                | Approval hub                    |
| `/automations`              | Automation workflows            |
| `/connections`              | Third-party connections         |
| `/drenyra`                  | Drenyra command center          |
| `/chat`                     | AI chat assistant               |
| `/neural-grid`              | Neural analytics grid           |
| `/economic-groups/:groupId` | Economic group detail           |
| `/compare`                  | Multi-period comparison         |
| `/inbox`                    | Notification inbox              |
| `/reconciliations`          | Bank reconciliation             |
| `/review`                   | Document review                 |
| `/profile`                  | User profile                    |
| `/mobile-summary`           | Mobile-optimized summary        |
| `/cognitive-hub`            | AI cognitive dashboard          |
| `/financials`               | Financial overview              |
| + more                      | See `src/routes/` for full list |

### Feature Catalog (src/features/)

41 features organized as vertical slices:

**Core Financial:** `invoices`, `bills`, `banking`, `cashflow`, `ledger`, `financials`, `reconciliations`, `cierre-mensual`, `payroll`

**Tax & Compliance:** `taxation`, `compliance`, `audit`, `entities`, `economic-groups`, `expedientes`

**Intelligence & AI:** `intelligence`, `cognitive-hub`, `drenyra-command-center`, `agents`, `agent-swarm`

**Operations:** `inventory`, `products`, `documents`, `assets`, `vendors`, `customers`, `bills`, `orders`, `onboarding`

**Platform:** `auth`, `settings`, `profile`, `approval-hub`, `automations`, `connections`, `inbox`, `review`

**Cross-cutting:** `dashboard`, `artifacts`, `compare`, `plugins`, `product-surfaces`

---

## 📦 Tech Stack

| Layer             | Technology                              |
| ----------------- | --------------------------------------- |
| **Framework**     | React 19 with React Compiler            |
| **Build**         | Vite 8 + @vitejs/plugin-react           |
| **Routing**       | TanStack Router (type-safe routes)      |
| **Data Fetching** | TanStack Query                          |
| **HTTP Client**   | Eden Treaty (type-safe API consumption) |
| **State**         | Zustand 5 + XState (complex workflows)  |
| **Forms**         | React Hook Form + Zod 4                 |
| **Styling**       | Tailwind CSS v4 + shadcn/ui             |
| **Animation**     | Framer Motion                           |
| **PDF**           | @react-pdf/renderer                     |
| **Charts**        | Recharts                                |
| **Auth**          | Better Auth (client)                    |
| **DnD**           | dnd-kit                                 |
| **Testing**       | Vitest + Testing Library                |
| **Package**       | @drenyra/* (workspace deps)             |

### Design System

The **Glass & Steel** design system powers the UI:

- Dark mode by default with `--text-*` CSS custom property tokens
- Design tokens in `src/lib/design-tokens/` (DTCG format as source of truth)
- Generated from `tokens.dtcg.json` via `bun tokens:generate`
- Atomic design: `atoms/` → `molecules/` → `organisms/` → layouts
- Custom scroll animations and view transitions in `src/styles/`

### API Integration

All API requests flow through Eden Treaty for end-to-end type safety:

```typescript
import { eden } from '@/lib/api-client'
// Fully typed — matches @drenyra/api routes exactly
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

# Quality
bun run lint            # ESLint
bun run lint:fix        # Auto-fix
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
- Route guards via TanStack Router loaders
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
```

---

## 📁 Related Packages

| Package                | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| `@drenyra/api`         | Backend API (Elysia) — consumed via Eden Treaty |
| `@drenyra/application` | Use cases & business logic                      |
| `@drenyra/domain`      | Domain entities & value objects                 |
| `@drenyra/shared`      | Shared utilities & validation                   |
| `@drenyra/ui`          | Shared UI components                            |

---

**Stack**: React 19 + Vite 8 + TanStack Router + TanStack Query + Tailwind CSS v4 + shadcn/ui  
**Auth**: Better Auth | **API**: Eden Treaty | **State**: Zustand 5 + XState  
**Design System**: Glass & Steel | **Última actualización**: 2026-06-20
