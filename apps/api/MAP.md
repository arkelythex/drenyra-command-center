# API-MAP — Drenyra API Navigation

**Última actualización**: 2026-06-20

> Manual navigation map for the DRENYRA API (Bun + ElysiaJS). See `CODEX-MAP.md` for monorepo root, `apps/cli/MAP.md` for CLI companion.

---

## Si solo tenés tres minutos

Este mapa es tu brújula para navegar `apps/api/`. Tenés 42 features, 10 servicios, 3 middlewares clave, y cientos de archivos — acá está todo indexado para que encuentres lo que necesitás sin perder tiempo.

| Si querés...                          | Leé esta sección                                         |
| ------------------------------------- | -------------------------------------------------------- |
| Entender la estructura de carpetas    | [Architecture layers](#architecture-layers)              |
| Ver los 42 features y sus prefijos    | [Features directory](#features-directory)                |
| Saber qué servicios transversales hay | [Services](#services)                                    |
| Encontrar rutas y entrypoints clave   | [Key entrypoints](#key-entrypoints)                      |
| Buscar algo rápido con comandos       | [Fast search recipes](#fast-search-recipes)              |
| Resolver una tarea específica         | [Common tasks → exact paths](#common-tasks--exact-paths) |

---

## Start here

- **Location:** `apps/api/`
- **Package:** `@drenyra/api` (v0.1.0)
- **Stack:** Bun 1.x + ElysiaJS 1.4.28 + Drizzle ORM 0.45 + PostgreSQL 15
- **Runtime:** TypeScript ESM — `bun run dev` (watch), `bun src/index.ts` (start)
- **Build:** `bun run build:binary` → single binary; `Dockerfile.production` → distroless image
- **Tests:** Vitest 4.1.5 — `bun test` (unit + integration, no DB), `bun run test:run` (all)
- **Type checking:** `bun run typecheck` (tsc -p ../../tsconfig.check.json)
- **Source files:** 630 `.ts` source files + 293 test/spec files = 933 total
- **Entry point:** `src/index.ts` → `src/app-core.ts` (App composition) → `src/app-listen.ts` (server listen + OTEL)

---

## Architecture layers

```
apps/api/src/
│
├── index.ts                 ← Entry: load env, export App type, import app-listen
├── contract.ts              ← Re-exports App type for Eden Treaty clients
├── app-core.ts              ← Elysia App composition — mount ALL feature modules
├── app-listen.ts            ← Server listen on PORT, OTEL attach, bootstrap event subscriptions
├── api-module-surface.ts    ← Splits modules into apiRootModules (bare) + apiCanonicalModules (/api prefix)
├── api-root-metadata.ts     ← Root GET / metadata (version, service name, swagger path)
├── swagger-docs-routes.ts   ← Swagger path config + legacy redirects
│
├── features/                ← 42 vertical slices (see table below)
├── services/                ← 10 cross-cutting services
├── middleware/               ← 3 middleware modules
├── validators/               ← 6 domain-specific schemas
├── config/                   ← CORS configuration
├── env/                      ← Environment variable loader
├── lib/                      ← Shared utilities (logger, db, LLM client, Inngest)
├── observability/            ← OpenTelemetry setup
├── shared/                   ← Cross-feature shared code (clients, api-response utils)
├── types/                    ← Shared domain type definitions (9 files)
└── __tests__/                ← Top-level integration tests
```

### Vertical slice patterns

Cada feature sigue uno de dos patrones según su complejidad. Elegí el que corresponda — no forces hexagonal donde alcanza con un service simple, y no te quedes corto donde el dominio lo justifica.

**Full hexagonal (banking, billing, customers, vendors, documents, etc.):**

```
features/<name>/
├── index.ts              ← Feature barrel export + Elysia module
├── application/          ← Use cases, services (Commands/Queries)
│   └── services/
├── domain/               ← Domain entities, value objects, types
├── infrastructure/       ← Repository implementations, external adapters
└── api/                  ← Route handlers, schemas
```

**Lightweight (simpler/older features):**

```
features/<name>/
├── index.ts              ← Elysia module with routes inline
├── <name>.service.ts     ← Business logic
└── <name>.schemas.ts     ← Request/response schemas
```

---

## Features directory

| #   | Feature                  | Path                             | Prefix                  | Purpose                                                                        |
| --- | ------------------------ | -------------------------------- | ----------------------- | ------------------------------------------------------------------------------ |
| 1   | **agent-audit-trail**    | `features/agent-audit-trail/`    | —                       | Agent autonomy audit, plugins, exporters, zero-trust                           |
| 2   | **agentic-ledger**       | `features/agentic-ledger/`       | —                       | Peru bank CSV ingestion with WASM bank skill                                   |
| 3   | **ai-rag**               | `features/ai-rag/`               | —                       | RAG: hybrid search + LLM for SUNAT knowledge                                   |
| 4   | **ai-swarm**             | `features/ai-swarm/`             | —                       | Multi-agent orchestration, workflows, consensus, control-plane                 |
| 5   | **analytics**            | `features/analytics/`            | —                       | Financial/tax/customer/operational KPIs                                        |
| 6   | **drenyra-harness**      | `features/drenyra-harness/`      | —                       | Harness API for Drenyra CLI agent delegation                                   |
| 7   | **auth**                 | `features/auth/`                 | `/api/auth`             | BetterAuth: signup/login/session/email-verification/password-reset             |
| 8   | **banking**              | `features/banking/`              | —                       | Accounts, transactions, reconciliation, reports                                |
| 9   | **banking-providers**    | `features/banking-providers/`    | —                       | Prometeo API bank connections                                                  |
| 10  | **billing**              | `features/billing/`              | —                       | Invoice (CxC) + Bill (CxP) under one module                                    |
| 11  | **cashflow**             | `features/cashflow/`             | —                       | Cashflow projection and queries                                                |
| 12  | **company**              | `features/company/`              | —                       | Company settings, multi-RUC                                                    |
| 13  | **compliance**           | `features/compliance/`           | `/compliance`           | Dashboard, accounting jobs, SIRE repro, country packs, roadmap                 |
| 14  | **context**              | `features/context/`              | —                       | Context management                                                             |
| 15  | **cpe-validator**        | `features/cpe-validator/`        | —                       | SUNAT CPE validation, rules catalog, fallback                                  |
| 16  | **customers**            | `features/customers/`            | —                       | Customer catalog (hexagonal)                                                   |
| 17  | **dashboard**            | `features/dashboard/`            | —                       | Dashboard widgets + fiscal indicators                                          |
| 18  | **documents**            | `features/documents/`            | —                       | OCR intake, upload/review/query lifecycle                                      |
| 19  | **drenyra**              | `features/drenyra/`              | —                       | Fiscal command center: cases, approval gates, Brain API                        |
| 20  | **electronic-invoicing** | `features/electronic-invoicing/` | `/electronic-invoicing` | SUNAT/OSE: send, compliance, lifecycle, CDR webhooks                           |
| 21  | **fiscal**               | `features/fiscal/`               | —                       | Fiscal truth engine + command center                                           |
| 22  | **frontend-telemetry**   | `features/frontend-telemetry/`   | —                       | Frontend error capture                                                         |
| 23  | **governance-audit**     | `features/governance-audit/`     | —                       | Autonomy audit trail, artifact events                                          |
| 24  | **health**               | `features/health/`               | `/health`               | Probes: `/live`, `/ready`, `/doctor`, `/startup`                               |
| 25  | **inbox**                | `features/inbox/`                | —                       | Inbox orchestrator with SSE                                                    |
| 26  | **inter-company**        | `features/inter-company/`        | —                       | Multi-company transactions                                                     |
| 27  | **inventory**            | `features/inventory/`            | —                       | Warehouses, stock, movements, kardex                                           |
| 28  | **ledger**               | `features/ledger/`               | —                       | General ledger queries                                                         |
| 29  | **ledger-mvp**           | `features/ledger-mvp/`           | —                       | SIRE Autopilot, NPIF, Fiscal Monitor (feature-flagged)                         |
| 30  | **journal-entries**      | `features/journal-entries/`      | `/api/journal-entries`  | Journal entries CRUD, mayorizar/declarar, wraps @drenyra/application use-cases |
| 31  | **llm-gateway**          | `features/llm-gateway/`          | —                       | Multi-provider AI gateway with failover                                        |
| 31  | **platform**             | `features/platform/`             | —                       | MCP routes + audit + handlers                                                  |
| 32  | **products**             | `features/products/`             | —                       | Product/service catalog                                                        |
| 33  | **pse-compliance**       | `features/pse-compliance/`       | —                       | PLE/PDT validation before PSE submission                                       |
| 34  | **reconciliations**      | `features/reconciliations/`      | —                       | Account reconciliation                                                         |
| 35  | **reports**              | `features/reports/`              | —                       | P&L, balance sheet, cash flow statements                                       |
| 36  | **security**             | `features/security/`             | —                       | Session, RBAC, RLS, AES-256, guards                                            |
| 37  | **shared**               | `features/shared/`               | —                       | Governance policy, api-response, company-scope                                 |
| 38  | **sire**                 | `features/sire/`                 | `/sire`                 | SUNAT electronic books: submit/analyze/reporting                               |
| 39  | **sunat**                | `features/sunat/`                | `/api/sunat`            | SUNAT: XML/UBL 2.1, digital signature, certs, QR                               |
| 40  | **taxation**             | `features/taxation/`             | —                       | PDT 621, IGV, retenciones, fiscal calendar                                     |
| 41  | **transactions**         | `features/transactions/`         | —                       | General transaction routes                                                     |
| 42  | **vendors**              | `features/vendors/`              | —                       | Supplier catalog (hexagonal)                                                   |

## Services

| Service              | Path                                       | Purpose                                                 |
| -------------------- | ------------------------------------------ | ------------------------------------------------------- |
| SUNAT (service)      | `services/sunat.service.ts`                | Legacy SUNAT service facade                             |
| SUNAT (lib)          | `services/sunat/`                          | RUC validation, XML/QR generation, types, external APIs |
| OSE                  | `services/ose/`                            | OSE provider abstraction                                |
| Email                | `services/email/`                          | Nodemailer transporter, React Email templates           |
| Compliance           | `services/compliance.service.ts`           | Roadmaps, decisions, timeline, execution, snapshots     |
| Electronic Invoicing | `services/electronic-invoicing.service.ts` | Cross-feature invoicing helpers                         |
| Storage              | `services/storage.service.ts`              | AWS S3 presigned URLs                                   |
| Frontend Telemetry   | `services/frontend-telemetry.service.ts`   | Error/event ingestion                                   |
| Accounting Job Runs  | `services/accounting-job-runs.service.ts`  | Job runs for compliance                                 |
| Inbox                | `services/inbox.service.ts`                | Message orchestration                                   |

## Key middleware

| Middleware   | Path                                  | Purpose                          |
| ------------ | ------------------------------------- | -------------------------------- |
| Metrics      | `middleware/metrics.middleware.ts`    | Prometheus metrics               |
| Rate Limiter | `middleware/rate-limit.middleware.ts` | Request rate limiting            |
| Tenant       | `middleware/tenant.middleware.ts`     | Multi-tenant company/RUC scoping |

## Key entrypoints

| File                        | Type                | Purpose                                                  |
| --------------------------- | ------------------- | -------------------------------------------------------- |
| `src/index.ts`              | **Entry**           | Load env, export `App` type, start server                |
| `src/app-core.ts`           | **App composition** | CORS + Swagger + metrics + ALL 42 feature modules        |
| `src/app-listen.ts`         | **Server listen**   | PORT, OTEL, taxation event bootstrap                     |
| `src/contract.ts`           | **Contract**        | Re-export `App` for Eden Treaty frontend                 |
| `src/api-module-surface.ts` | **Registry**        | `apiRootModules` + `apiCanonicalModules` (`/api` prefix) |

## Lib directory

| File                           | Purpose                    |
| ------------------------------ | -------------------------- |
| `lib/logger.ts`                | Pino logger with redaction |
| `lib/db.ts`                    | Shared database client     |
| `lib/llm/openrouter-client.ts` | OpenRouter AI client       |
| `lib/accounting-jobs.ts`       | Accounting job definitions |
| `lib/compliance-runbooks.ts`   | Compliance/SIRE runbooks   |
| `lib/latam-country-packs.ts`   | LATAM country packages     |
| `lib/inngest.client.ts`        | Inngest background jobs    |

## Types directory

| File                         | Contents              |
| ---------------------------- | --------------------- |
| `types/taxation.types.ts`    | Taxation domain types |
| `types/banking.types.ts`     | Banking domain types  |
| `types/dashboard.types.ts`   | Dashboard types       |
| `types/chat.types.ts`        | Chat types            |
| `types/invoice.types.ts`     | Invoice types         |
| `types/sire.types.ts`        | SIRE types            |
| `types/compliance.types.ts`  | Compliance types      |
| `types/inventory.types.ts`   | Inventory types       |
| `types/transaction.types.ts` | Transaction types     |

## Shared directory

| Path                        | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `shared/clients/`           | Data Engine + Reconciliation Worker HTTP clients |
| `shared/api-response.ts`    | Standardized `ok()`/`fail()` helpers             |
| `shared/company-scope.ts`   | Company-scope from headers                       |
| `shared/governance.ts`      | Governance policy evaluation                     |
| `shared/autonomy-policy.ts` | Autonomy policy engine                           |
| `shared/request-access.ts`  | Request access control                           |

## Fast search recipes

```bash
# Find a feature entry point
fd -g 'features/*/index.ts' src/features/

# Find all routes files in a feature
fd -g '*routes*.ts' src/features/<feature>/

# Find route prefix declarations
rg "prefix:" src/features/ -g '*.ts'

# Find all Elysia .use() registrations
rg '\.use\(' src/app-core.ts

# Find a specific handler by name
rg 'export async function' src/features/ -g '*.ts'

# Find test files in a feature
fd '_test\.ts' src/features/<feature>/

# Find all barrels (re-exports)
rg 'export \* from' src/features/ --include 'index.ts'

# Find Zod/TypeBox validation objects
rg 't\.Object\(' src/ -g '*.ts' -l | head -20

# Find feature-flagged code
rg 'isLedgerMvpEnabled|LEDGER_MVP_ENABLED' src/ -g '*.ts'

# Count routes per feature
rg '^\.(get|post|put|patch|delete)\(' src/features/ -g '*.ts' | cut -d/ -f3 | sort | uniq -c | sort -rn
```

## Common tasks → exact paths

| Task                      | Start path                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Add new feature           | `src/api-module-surface.ts` (register) + `src/app-core.ts` (`.use`) + `src/features/<name>/index.ts` |
| Register routes           | `src/app-core.ts` — add `.use(yourModule)`                                                           |
| Add CORS origin           | `src/config/cors.ts`                                                                                 |
| Add health check          | `src/features/health/index.ts` — `buildHealthModule()`                                               |
| Change Swagger            | `src/app-core.ts` (tags/info) + `src/swagger-docs-routes.ts` (paths)                                 |
| Add SUNAT endpoint        | `src/features/sunat/api.module.ts`                                                                   |
| Add SIRE route            | `src/features/sire/routes/` + register in `src/features/sire/index.ts`                               |
| Change auth flow          | `src/features/auth/auth.routes.ts` + `src/features/auth/auth.config.ts`                              |
| Add Drenyra Brain route   | `src/features/drenyra/brain/`                                                                        |
| Change middleware         | `src/middleware/` (metrics, rate-limit, tenant)                                                      |
| Change DB schema          | `packages/infrastructure/src/schema/` (outside apps/api)                                             |
| Change taxation           | `src/features/taxation/`                                                                             |
| Change compliance         | `src/features/compliance/` or `src/services/compliance.service.ts`                                   |
| Add banking provider      | `src/features/banking-providers/`                                                                    |
| Change governance         | `src/features/shared/governance.ts` or `src/features/shared/autonomy-policy.ts`                      |
| Fix AI swarm agent        | `src/features/ai-swarm/agents/` or `src/features/ai-swarm/workflows/`                                |
| Change documents pipeline | `src/features/documents/`                                                                            |
| Change security/authz     | `src/features/security/` (RBAC, RLS, session, guards)                                                |

## Key types/contracts to know

| Type                    | Path                                                  | Purpose                              |
| ----------------------- | ----------------------------------------------------- | ------------------------------------ |
| `App`                   | `src/contract.ts`                                     | Eden Treaty frontend API client type |
| `ApiRootMetadata`       | `src/api-root-metadata.ts`                            | GET / metadata shape                 |
| `GovernanceInput`       | `src/features/shared/governance.ts`                   | Governance policy input              |
| `AutonomyDecisionTrace` | `src/features/shared/autonomy-policy.ts`              | Autonomy decision trace              |
| `Certificate`           | `src/features/sunat/signature/certificate.handler.ts` | SUNAT X.509 cert                     |
| `InvoiceData`           | `src/features/sunat/types/ubl.types.ts`               | UBL 2.1 invoice data                 |
| `HealthModuleDeps`      | `src/features/health/index.ts`                        | Health check DI interface            |

## Dependencies (main packages)

| Package                         | Version   | Purpose               |
| ------------------------------- | --------- | --------------------- |
| `elysia`                        | 1.4.28    | Web framework         |
| `better-auth`                   | ^1.4.15   | Authentication        |
| `drizzle-orm`                   | ^0.45.1   | ORM                   |
| `zod`                           | ^4.3.5    | Schema validation     |
| `@elysiajs/cors`                | ^1.4.1    | CORS                  |
| `@elysiajs/swagger`             | ^1.3.1    | Swagger docs          |
| `@elysiajs/opentelemetry`       | ^1.4.0    | OpenTelemetry         |
| `pino`                          | ^10.3.1   | Logging               |
| `postgres`                      | ^3.4.5    | PostgreSQL driver     |
| `ai` + `@ai-sdk/google`         | ^6.0.39+  | AI SDK                |
| `@openrouter/ai-sdk-provider`   | ^2.1.1    | OpenRouter            |
| `@mastra/core`                  | ^1.4.0    | AI agent framework    |
| `prom-client`                   | ^15.0.0   | Prometheus metrics    |
| `node-forge` + `xml-crypto`     | —         | XML digital signature |
| `canvas` + `qrcode`             | —         | QR generation         |
| `@aws-sdk/client-s3`            | ^3.1048.0 | S3 storage            |
| `nodemailer` + `@react-email/*` | —         | Email                 |
| `exceljs` + `pdfkit`            | —         | Excel/PDF generation  |
| `tesseract.js`                  | ^7.0.0    | OCR                   |

## CI gates

```bash
bun install --frozen-lockfile
bun run typecheck           # tsc — strict mode, no any
bun run lint                # ESLint
bun run test                # Vitest unit + integration (no DB)
bun run test:run            # All tests
bun run test:db:compliance  # SUNAT compliance integration
bun run test:db:taxation    # Taxation (retenciones) integration
bun run build:binary        # Single binary build
```
