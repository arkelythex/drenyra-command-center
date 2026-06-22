# API — ARKELYTHEX Backend (Bun + ElysiaJS)

> **Last updated:** 2026-06-20 · **Package:** `@arkelythex/api` · **Entry:** `src/index.ts`
> For detailed navigation (42 features, services, middleware, recipes) read [`MAP.md`](MAP.md) first.

---

## 1. Project Overview

Backend for **Drenyra**, the Infraestructura Nacional de Inteligencia Fiscal. Single backend serving the web app (`apps/web`), Drenyra CLI (`apps/drenyra-cli`), and external integrations (SUNAT, OSE, banking providers). Covers: Peruvian electronic invoicing (UBL 2.1), SIRE electronic books, multi-RUC fiscal compliance, AI document processing, banking reconciliation, and agent swarms. ~630 `.ts` + 290 test files.

## 2. Stack

| Layer | Tech | Ver |
|-------|------|-----|
| Runtime | Bun | 1.3.11 |
| Framework | ElysiaJS | 1.4.28 |
| ORM | Drizzle ORM | 0.45+ |
| DB | PostgreSQL (Neon) | 16 |
| Validation | Zod | 4.x |
| Auth | Better Auth | 1.4+ |
| Logging | Pino | 10.x |
| Observability | OpenTelemetry | — |
| Messaging | NATS JetStream | — |
| AI | Vercel AI SDK + OpenRouter + Gemini | — |

## 3. Architecture — Vertical Slice + CQRS

Each feature is a self-contained vertical slice. Two patterns:

**Full hexagonal** (banking, billing, customers, vendors, taxation, documents):
```
features/<name>/
├── index.ts              ← Barrel + Elysia module
├── application/services/ ← Use cases, Commands/Queries
├── domain/               ← Entities, value objects, invariants
├── infrastructure/       ← Repository implementations
└── api/                  ← Route handlers, schemas
```

**Lightweight** (simpler features):
```
features/<name>/
├── index.ts              ← Module with routes inline
├── <name>.service.ts     ← Business logic
└── <name>.schemas.ts     ← Schemas
```

App flow: `src/index.ts → src/app-core.ts (App type, .use all modules) → src/app-listen.ts (PORT, OTEL)`. The `App` type is re-exported via `src/contract.ts` for Eden Treaty frontend clients. **Never break the Eden contract.**

## 4. Directory Structure

```
apps/api/
├── src/
│   ├── index.ts                ← Entry: load env, export App, import app-listen
│   ├── app-core.ts             ← App composition — CORS + Swagger + 42 modules
│   ├── app-listen.ts           ← Server listen, OTEL, bootstrap
│   ├── contract.ts             ← Re-export App for Eden Treaty
│   ├── api-module-surface.ts   ← Module registry (root vs /api prefix)
│   ├── api-root-metadata.ts    ← GET / metadata
│   ├── swagger-docs-routes.ts  ← Swagger config + redirects
│   ├── config/cors.ts
│   ├── env/load-api-env.ts
│   ├── features/               ← 42 vertical slices
│   ├── middleware/             ← metrics, rate-limit, tenant
│   ├── services/              ← SUNAT, OSE, Email, Storage, Compliance, Invoicing
│   ├── validators/
│   ├── lib/                   ← logger, db, LLM client, Inngest, jobs
│   ├── observability/         ← OpenTelemetry
│   ├── shared/                ← api-response, company-scope, governance
│   ├── types/                 ← taxation, banking, SIRE, compliance types
│   └── __tests__/             ← Integration tests
```

## 5. API Conventions

- **RESTful** — nouns + HTTP verbs. Modules mount on `/api/<resource>` or root.
- **Swagger** — auto-generated via `@elysiajs/swagger` at `/swagger`.
- **Eden Treaty** — the `App` type is the single source of truth. Any route change must preserve Eden compatibility (`src/contract.ts`).
- **Structured responses** — use `ok(data)` / `fail(error)` from `shared/api-response.ts`.
- **Typed errors** — via `@elysiajs/error`. No silent swallowing.
- **Health** — `GET /live`, `/ready`, `/doctor`, `/startup` (feature `health/`).

## 6. Coding Conventions

- **TypeScript strict** — no `any`. Prefer `unknown` + narrowing or branded types.
- **Zod at boundaries** — every external input (body, query, params, headers) validated with Zod.
- **Explicit return types** — all exported/public functions must have explicit return types.
- **No `console.log`** — use Pino logger from `lib/logger.ts` or `SecureLogger` for PII-sensitive context.
- **Money** — never use `number`. Use the `Money` value object from `@arkelythex/domain`.
- **Fiscal correctness** — IGV, RUC validation (Módulo 11), UBL 2.1, CDR must match SUNAT specs.
- **No raw SQL without justification** — use Drizzle builders. Comment if raw SQL is required.
- **No N+1** — eager load with Drizzle `with()` or batch queries.

## 7. Testing

| Tier | Command | Scope |
|------|---------|-------|
| Unit + Integration | `bun test` / `bun test:run` | Feature tests, no real DB |
| DB integration | `bun run test:db` | Real PostgreSQL |
| DB compliance | `bun run test:db:compliance` | SUNAT reproducibility |
| DB taxation | `bun run test:db:taxation` | Retenciones/detracciones |

**Framework:** Vitest 4.x + Elysia integration testing (`@elysiajs/testing`).  
**Setup:** `src/__tests__/setup.ts` mocks AI SDK, S3, BullMQ, SUNAT API, Prometeo.  
**Pattern:** Unit tests live next to source (`__tests__/*.test.ts`). DB tests use real Neon branches.  
**Coverage:** 80% overall, 95% for fiscal/SUNAT modules.

## 8. Security

- **TLS** — terminated at edge (Fly.io/Render).
- **Auth** — Better Auth (`features/auth/`): email/password, OAuth, sessions, email verification.
- **RBAC** — `features/security/` enforces roles and permissions at route level.
- **Tenant isolation** — `middleware/tenant.middleware.ts` extracts company/RUC scope. **Every RUC-scoped query, mutation, job, and export must enforce this.** Non-negotiable.
- **Audit** — `features/governance-audit/` + `features/agent-audit-trail/` for zero-trust agent logging.
- **API keys** — CLI and external integrations authenticate via API keys tied to company context.
- **Secrets** — never log, commit, or expose credentials, tokens, PII, or full fiscal documents.

## 9. SDD Workflow

Feature changes flow: `init → explore → propose → spec → design → tasks → apply → verify → archive`

Artifacts in `.sdd/` at repo root. Full cycle is **mandatory** for any change touching SUNAT, DB schema, tenant isolation, or money calculations. Small single-file fixes may use apply→verify shortcut.

## 10. Database

- **ORM:** Drizzle ORM 0.45+ — schema in `packages/infrastructure/src/schema/`.
- **Driver:** `postgres` (Bun-compatible) via `lib/db.ts`.
- **Provider:** Neon serverless PostgreSQL 16.
- **Migrations:**
  ```bash
  bun run db:generate   # From schema changes
  bun run db:push       # Push to dev
  bun run db:studio     # Drizzle Studio
  ```
- SUNAT schema changes require a compliance verification step before deploy.
- Connection pooling via Neon's serverless pooler.

## 11. Delegation Triggers

When working on API features, delegate to sub-agents when:
- **4-file rule**: change touches 4+ files across features, services, or middleware → use `backend-builder` or `arkelythex`
- **SUNAT/fiscal change**: any change to tax logic, UBL, CDR, SIRE → `sunat-compliance` skill + `tester`
- **DB schema change**: migration, new table, index → `database` + `arkelythex-database-migrations` skill
- **Full SDD cycle**: fiscal/DB/tenant/money changes → `sdd-*` agents
- **PR pre-review**: change generates +200 line PR → `reviewer` or `code-reviewer`

> Full reference: [Gentleman Philosophy — Delegation Triggers](../../docs/meta/gentleman-philosophy.md#delegation-triggers-para-agentes)

---

## Quick Start

```bash
cd apps/api
cp .env.example .env
bun run dev             # Watch mode
bun run test            # Fast tests, no DB
bun run typecheck       # TypeScript strict
```

## Rules for AI Agents

- **Read `MAP.md` first** — saves tokens, gives architecture at a glance.
- **Never break Eden Treaty** — route/schema changes break the frontend client.
- **Never skip tenant scope** — every RUC-scoped operation must enforce org context.
- **Never use `any`** — use `unknown` or branded types.
- **SUNAT = safety** — fiscal routes need compliance tests.
- **Money needs Money** — never use `number` for currency.
- **SDD for fiscal/DB/arch** — small fixes can skip, but SUNAT/DB/tenant/money changes need the full cycle.
- **Prefer targeted checks** — `bun run --filter @arkelythex/api test:run | typecheck` before broad root runs.
