# SDD Design: drenyra-treasury-core — Treasury & Banking Core

| Field              | Value                       |
| ------------------ | --------------------------- |
| **Change ID**      | `drenyra-treasury-core`     |
| **SDD Phase**      | Design                      |
| **Status**         | Complete                    |
| **Author**         | SDD Designer (el Gentleman) |
| **Created**        | 2026-07-25                  |
| **Inputs**         | proposal, spec              |
| **Artifact Store** | openspec + engram           |

---

## Executive Summary

El diseño de Treasury Core abarca cuatro fases progresivas que formalizan, activan, promueven y validan el módulo bancario existente (~80+ archivos entre API y WEB). La arquitectura actual ya tiene los componentes correctos — el diseño se enfoca en **estabilizar contratos, activar integración Prometeo en producción, migrar shadow reconciliation a modo principal, y validar datos de cashflow contra ledger real**. No se propone reescribir; se propone formalizar y completar.

---

## Architecture Overview

### Current State (As-Is)

```
┌──────────────────────────────────────────────────────────────────┐
│                      apps/web (React)                            │
│              banking components (44 files)                       │
│              cashflow components (19 files)                       │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTP/JSON
┌──────────────────────────▼───────────────────────────────────────┐
│                      apps/api (Elysia)                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /api/banking          (banking.routes.ts)               │    │
│  │  • accounts CRUD       handlers → BankingApplicationSvc  │    │
│  │  • transactions CRUD   handlers → TransactionService     │    │
│  │  • import (CSV)        handlers → BankingApplicationSvc  │    │
│  │  • auto-reconcile      handlers → ReconciliationService  │    │
│  │  • summary             handlers → SummaryService         │    │
│  │  • reconciliation-shadow metrics/cutover                 │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  /api/banking-providers (banking-providers/routes.ts)    │    │
│  │  • connect/disconnect   → PrometeoService                │    │
│  │  • accounts/movements   → PrometeoService                │    │
│  │  ⚠ NO persistence — session key only (5min TTL)          │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  /api/reconciliations  (reconciliations module)          │    │
│  │  • pending/reconciled/stats → ReconciliationService      │    │
│  │  • reconcile/unreconcile    → DB direct via repository   │    │
│  │  • external/reconcile       → Go reconciliation worker   │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  /api/cashflow         (cashflow/routes.ts)              │    │
│  │  • projection/actual/forecast/variance → queries         │    │
│  │  ⚠ Data source: AR/AP + bank transactions               │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                  packages/domain (DDD)                           │
│  entities:  BankAccount, BankTransaction (aggregate roots)      │
│  value-objects: Money, Currency, TransactionType                │
│  repositories: BankAccountRepo, BankTransactionRepo,            │
│                BankReconciliationRepo (interfaces)               │
│  fiscal: ComplianceEngine, DetractionCalculator, ITFCalculator  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│               packages/persistence (Drizzle ORM)                 │
│  banking.schema.ts:                                              │
│    bankAccounts, bankTransactions, bankReconciliations           │
│  banking-reconciliation-matches.schema.ts:                       │
│    transactionReconciliationMatches, partialPayments,            │
│    partialPaymentTransactions, reconciliationShadowRuns          │
│  banking-core.schema.ts: accounts, categories                   │
└──────────────────────────────────────────────────────────────────┘

External:
  ┌──────────────────┐    ┌──────────────────────────────────────┐
  │ Prometeo API     │    │ Go reconciliation-worker (external)   │
  │ (sandbox/prod)   │    │ • /health                            │
  │ • /login         │    │ • /reconcile (sourceA, sourceB, tol) │
  │ • /account       │    └──────────────────────────────────────┘
  │ • /movements     │
  │ • /logout        │
  └──────────────────┘
```

### Key Architectural Observations

1. **Dual reconciliation path**: Local TS matching engine (5 strategies) AND Go reconciliation worker for shadow comparison. Both run, results compared, discrepancies logged.
2. **Prometeo is stateless**: No `BankProvider` table exists. Session keys live in-memory only (5min TTL). No credential persistence.
3. **Cashflow reads AR/AP**: `getCashflowProjection` pulls from `invoices` (unpaid) and `bills` (unpaid), but also synthesizes from bank transaction history. No explicit data-source validation exists.
4. **Reconciliation not batch-oriented**: The spec describes `ReconciliationBatch` as a first-class entity with period scoping and status lifecycle. The current implementation reconciles transaction-by-transaction without batching.

---

## Phase 0: Formalize Existing (Documentation, Tests, Contracts)

### Goal

Crear SDD formales, tests de cobertura, y contratos documentados para el código existente sin cambiar comportamiento.

### Architecture Decisions

#### AD-01: Reconciliation Batch Entity Introduction

**Decision**: Introducir `ReconciliationBatch` como aggregate root que agrupa operaciones de matching para una cuenta bancaria dentro de un período. Esto formaliza lo que ya existe como concepto implícito.

**Rationale**: El spec define batches con estados (`OPEN → IN_PROGRESS → PARTIALLY_MATCHED → CLOSED/CLOSED_WITH_DISCREPANCY`). La implementación actual concilia transacción por transacción sin agrupación temporal. El batch es necesario para:

- Cierre mensual (SUNAT PLE)
- Métricas de conciliación por período
- Shadow mode comparison batches

**Trade-off**: Agregar el batch sin romper el reconciliado individual existente. Las transacciones reconciliadas antes del batch seguirán teniendo `isReconciled: true` sin `batchId`.

#### AD-02: Banking API Contract Standardization

**Decision**: Unificar los schemas de validación entre `banking.schemas.ts` (Zod en el feature banking) y los tipos de `banking-providers` (Elysia `t.*`). Estandarizar en Zod para validación de dominio y derivar schemas Elysia desde Zod.

**Rationale**: Actualmente hay dos sistemas de validación paralelos sin contrato compartido. Zod → Elysia permite DRY y contratos testeables unitariamente.

#### AD-03: Test Pyramid

| Layer                        | Target Coverage | Existing | Gap   |
| ---------------------------- | --------------- | -------- | ----- |
| Domain entities (unit)       | ≥95%            | ~60%     | +35%  |
| Application services (unit)  | ≥90%            | ~40%     | +50%  |
| API routes (integration)     | ≥80%            | ~30%     | +50%  |
| Provider adapters (contract) | 100%            | 0%       | +100% |
| E2E (critical paths)         | ≥70%            | ~10%     | +60%  |

### Phase 0 Data Model Changes

```
bank_reconciliations (existing table — add columns):
  + batch_reference: varchar(50)     -- e.g., "BATCH-2026-07-BA-001"
  + mode: varchar(10) DEFAULT 'MANUAL' -- MANUAL | AUTO
  + matched_count: integer DEFAULT 0
  + unmatched_count: integer DEFAULT 0
  + discrepancy_amount: decimal(19,4)
  + closed_at: timestamp
  + closed_by: uuid

bank_transactions (existing — add column):
  + reconciliation_batch_id: uuid REFERENCES bank_reconciliations(id)
  + external_id: varchar(100)       -- provider's transaction ID (for idempotency)
  + source: varchar(20) DEFAULT 'MANUAL' -- MANUAL | CSV_IMPORT | API_FEED

NEW: reconciliation_rules
  id, company_id, name, rule_type, conditions (jsonb),
  priority (int), is_active (bool), created_at

NEW: bank_providers
  id, company_id, bank_account_id, provider_code (PROMETEO|MOCK),
  api_credentials (encrypted jsonb), connection_status,
  feature_flags (jsonb), last_sync_at, sync_error, created_at
```

### Phase 0 Deliverables

```
packages/domain/src/entities/
  ├── ReconciliationBatch.ts          (NEW — aggregate root)
  ├── ReconciliationRule.ts           (NEW — entity)
  ├── BankAccount.ts                  (UPDATE — add providerId, lastSyncAt)
  └── BankTransaction.ts              (UPDATE — add source, externalId)

packages/domain/src/repositories/
  ├── reconciliation-batch.repository.ts   (NEW)
  └── reconciliation-rule.repository.ts    (NEW)

packages/persistence/src/schema/
  ├── banking.schema.ts               (UPDATE — new columns)
  ├── reconciliation-rules.schema.ts  (NEW)
  └── bank-providers.schema.ts        (NEW)

apps/api/src/features/banking/
  ├── domain/entities/                (UPDATE — formalize entities)
  ├── domain/services/                (DOCS — JSDoc completos para matching strategies)
  └── __tests__/                      (ADD — 50+ new tests)

apps/api/src/features/banking-providers/
  └── __tests__/                      (ADD — contract tests for PrometeoService)

docs/
  └── api/banking-openapi.yaml        (NEW — generated from Zod schemas)
```

---

## Phase 1: Activate Prometeo Integration (Bank Provider Live)

### Goal

Migrar Prometeo de "código existente no productivo" a integración bancaria en vivo con persistencia de credenciales, sincronización programada, e ingesta idempotente de transacciones.

### Architecture Decisions

#### AD-04: Provider Abstraction Layer

**Decision**: Formalizar la interfaz `BankProviderAdapter` con implementaciones `PrometeoAdapter` y `MockBankAdapter`. No acoplar el core banking al provider específico.

```
                    ┌──────────────────────┐
                    │  BankProviderService │  (application service)
                    │  - connect()         │
                    │  - sync()            │
                    │  - disconnect()      │
                    └──────────┬───────────┘
                               │ uses
                    ┌──────────▼───────────┐
                    │ BankProviderAdapter  │  (domain interface)
                    │ + login(creds): key  │
                    │ + getAccounts(key)   │
                    │ + getMovements(key)  │
                    │ + logout(key)        │
                    │ + getBalances(key)   │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼──────┐ ┌──────▼──────┐ ┌───────▼────────┐
     │PrometeoAdapter│ │MockBankAdapter│ │ (Future:        │
     │ (HTTP client) │ │ (deterministic│ │  Belo, etc.)    │
     │               │ │  synthetic)  │ │                 │
     └───────────────┘ └──────────────┘ └────────────────┘
```

**Rationale**: NFR-06 exige abstracción de provider. El código actual ya tiene `PrometeoService` como clase concreta; hay que extraer la interfaz.

#### AD-05: Credential Storage Strategy

**Decision**: Almacenar credenciales encriptadas en `bank_providers.api_credentials` usando AES-256-GCM con clave derivada de `process.env.ENCRYPTION_KEY`. El `PrometeoAdapter` desencripta on-demand, nunca en logs/responses.

**Rationale**: NFR-02 exige encryption at rest. Nunca almacenar credenciales en sesión. El session key de Prometeo (5min TTL) se almacena en Redis/memoria, no en DB.

#### AD-06: Sync Scheduling & Idempotency

**Decision**: Sync programado vía `node-cron` (o BullMQ si ya existe en el stack) — diario por defecto. Idempotencia basada en `external_id` + `bank_account_id` unique constraint.

```
Sync Flow:
  1. Cron trigger (daily 02:00 UTC) o POST /api/banking/accounts/{id}/sync
  2. BankProviderService.resolve(account.providerId)
  3. adapter.getMovements(sessionKey, since=account.lastSyncAt)
  4. For each movement:
     a. Check external_id uniqueness (INSERT ... ON CONFLICT DO NOTHING)
     b. Map to BankTransaction (source: API_FEED)
  5. Update account.lastSyncAt, account.currentBalance, account.availableBalance
  6. Log sync summary (imported, duplicates, errors)
  7. If new transactions found → trigger auto-reconciliation (Phase 2, still shadow)
```

#### AD-07: Feature Flag Architecture

**Decision**: Usar `bank_providers.feature_flags` (JSONB) para control granular por cuenta:

```json
{
  "liveFeed": true, // si false → no sync automático
  "shadowReconciliation": true, // si true → shadow mode para esta cuenta
  "syncFrequency": "daily", // daily | hourly | manual
  "syncWindowDays": 30, // cuántos días atrás sincronizar
  "maxRetries": 3
}
```

### Phase 1 Data Flow

```
┌──────────┐   ┌─────────────────┐   ┌──────────────┐   ┌────────────┐
│  Cron /  │──▶│ BankProvider    │──▶│ Prometeo     │──▶│ Prometeo   │
│  Manual  │   │ Service         │   │ Adapter      │   │ API        │
│  Trigger │   │ .sync(acctId)   │   │ .getMovements│   │ /movements │
└──────────┘   └────────┬────────┘   └──────┬───────┘   └────────────┘
                        │                    │
                        │ ◀── movements[] ───┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Idempotency Gate    │
              │ external_id UNIQUE  │
              │ ON CONFLICT: skip   │
              └─────────┬───────────┘
                        │ (new records only)
                        ▼
              ┌─────────────────────┐
              │ BankTransaction[]   │
              │ source: API_FEED    │
              │ isReconciled: false │
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Update BankAccount  │
              │ lastSyncAt, balances│
              └─────────┬───────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Auto-Reconcile      │
              │ (Phase 2 — shadow   │
              │  or primary mode)   │
              └─────────────────────┘
```

### Phase 1 Deliverables

```
packages/domain/src/
  └── providers/
      ├── bank-provider-adapter.interface.ts  (NEW — interface)
      └── provider-credentials.value-object.ts (NEW)

apps/api/src/features/banking-providers/
  ├── infrastructure/
  │   ├── prometeo.adapter.ts                 (REFACTOR from prometeo.service.ts)
  │   └── mock-bank.adapter.ts                (NEW)
  ├── application/
  │   ├── services/
  │   │   └── bank-provider.service.ts        (NEW — connect/sync/disconnect)
  │   ├── commands/
  │   │   ├── connect-provider.command.ts     (NEW)
  │   │   ├── sync-provider.command.ts        (NEW)
  │   │   └── disconnect-provider.command.ts  (NEW)
  │   └── scheduler/
  │       └── bank-sync.scheduler.ts          (NEW — cron job)
  ├── api/
  │   └── routes.ts                           (UPDATE — add /sync, persistence)
  └── __tests__/
      ├── unit/prometeo-adapter.test.ts       (NEW)
      ├── unit/bank-provider.service.test.ts  (NEW)
      ├── contract/provider-adapter.contract.ts (NEW — shared contract tests)
      └── integration/sync-flow.test.ts       (NEW)

packages/persistence/src/schema/
  └── bank-providers.schema.ts                (NEW — bank_providers table)

# Migration
packages/persistence/drizzle/
  └── 000X_add_bank_providers.sql
```

---

## Phase 2: Shadow Reconciliation → Primary Promotion

### Goal

Promover el motor de auto-reconciliación de modo shadow a modo principal, eliminando el shadow gate cuando se cumplan los criterios de cutover.

### Current Shadow Architecture

```
┌──────────────────────────────────────────────────────────┐
│  POST /api/banking/auto-reconcile                        │
│  { companyId, accountId }                                │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│  ReconciliationService.autoReconcile()                   │
│                                                          │
│  1. Fetch unreconciled bank transactions                 │
│  2. For each tx → MatchingEngine.findBestMatch()         │
│     ┌──────────────────────────────────────────┐        │
│     │ 5 strategies in priority order:          │        │
│     │  1. ReferenceMatchingStrategy            │        │
│     │  2. AmountDateMatchingStrategy           │        │
│     │  3. AmountEntityMatchingStrategy         │        │
│     │  4. FuzzyEntityMatchingStrategy          │        │
│     │  5. PartialPaymentMatchingStrategy       │        │
│     └──────────────────────────────────────────┘        │
│  3. If match.score ≥ 60 → reconcileAndLink()            │
│     (updates bank_transactions: isReconciled=true,      │
│      invoiceId/billId, reconciledAt)                    │
│                                                          │
│  4. IF SHADOW_MODE_ENABLED:                              │
│     ┌──────────────────────────────────────────┐        │
│     │ runGoShadowComparison()                  │        │
│     │ • Send sourceA + sourceB → Go worker     │        │
│     │ • Compare local vs Go results            │        │
│     │ • Persist to reconciliation_shadow_runs  │        │
│     │ • Log discrepancies                      │        │
│     │ • Update in-memory ShadowTotals          │        │
│     └──────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘

Shadow Gate (ARKELYTHEX_RECONCILIATION_SHADOW_MODE=1):
  If enabled → local engine ALWAYS runs on production data,
               Go worker runs comparison on shadow data.
               Discrepancies are logged but never block.
```

### AD-08: Cutover Decision Engine

**Decision**: El cutover NO es un flag binario manual. Es un proceso con gates cuantitativos:

```
Cutover Gates:
  ✓ SHADOW_MODE_ENABLED = true
  ✓ successfulRuns ≥ MIN_SUCCESSFUL_RUNS (default: 20)
  ✓ failureRate ≤ MAX_FAILURE_RATE (default: 10%)
  ✓ discrepancyRate ≤ MAX_DISCREPANCY_RATE (default: 5%)

Decision Matrix:
  GO                  → todos los gates pasan
  NO_GO               → SHADOW_MODE deshabilitado, O failureRate/discrepancyRate excedido
  INSUFFICIENT_DATA   → successfulRuns insuficiente
```

**Migration Strategy (Progressive)**:

```
Step 1: SHADOW_MODE_ENABLED=1 → Local engine writes PRODUCTION data
        Go worker runs COMPARISON only
        Cutover evaluation: INSUFFICIENT_DATA

Step 2: Después de ≥20 successful shadow runs con discrepancyRate ≤5%:
        Cutover evaluation: GO
        Operator review → approval

Step 3: SHADOW_MODE → dual (ARKELYTHEX_RECONCILIATION_MODE=dual)
        Local engine writes PRODUCTION
        Go worker ALSO writes PRODUCTION (promoted)
        Comparison still logged but not blocking
        Duration: 5-10 cycles to verify Go and Local converge

Step 4: ARKELYTHEX_RECONCILIATION_MODE=primary
        Go worker becomes primary reconciliation engine
        Local TS engine decommissioned (or kept as fallback)
        Shadow metrics archived
```

### AD-09: Reconciliation Mode State Machine

```
                    ┌──────────┐
                    │  SHADOW  │  (actual — comparison only)
                    └────┬─────┘
                         │ cutover evaluation → GO
                         ▼
                    ┌──────────┐
                    │   DUAL   │  (both write production, compare)
                    └────┬─────┘
                         │ N cycles without critical discrepancies
                         ▼
                    ┌──────────┐
                    │ PRIMARY  │  (Go worker is the reconciler)
                    └──────────┘
```

**Rollback**: Si en modo DUAL o PRIMARY surgen discrepancies críticas (>10%), revertir a SHADOW automáticamente vía circuit breaker.

### AD-10: Reconciliation Batch Lifecycle

**Decision**: Integrar el `ReconciliationBatch` (introducido en Phase 0) con el motor de auto-reconciliación:

```
Auto-Reconciliation Batch Lifecycle:
  1. Cron/Sync trigger → create batch (mode: AUTO, status: OPEN)
  2. Fetch unreconciled transactions within batch period
  3. Matching engine runs (5 strategies)
  4. For each match above threshold → create ReconciliationMatch (CONFIRMED)
  5. If transactions remain unmatched → batch → PARTIALLY_MATCHED
  6. Batch close:
     - All matched → CLOSED
     - Some unmatched → CLOSED_WITH_DISCREPANCY
     - discrepancy_amount = closingBalance - openingBalance - netMovement
```

### Phase 2 Deliverables

```
apps/api/src/features/banking/
  ├── application/services/
  │   ├── reconciliation.service.ts          (REFACTOR — batch-aware)
  │   ├── reconciliation-shadow.service.ts   (UPDATE — add dual mode)
  │   └── reconciliation-cutover.service.ts  (NEW — cutover decision)
  ├── domain/
  │   ├── entities/
  │   │   └── reconciliation-batch.ts        (NEW — aggregate)
  │   └── services/
  │       └── matching-strategy.ts            (DOCS — add strategy docs)
  ├── api/
  │   ├── banking.routes.ts                  (UPDATE — batch endpoints)
  │   └── banking.handlers.ts                (UPDATE — batch handlers)
  └── __tests__/
      ├── unit/reconciliation-batch.test.ts   (NEW)
      ├── unit/cutover-decision.test.ts       (NEW)
      ├── integration/dual-mode.test.ts       (NEW)
      └── integration/shadow-to-primary.cutover.test.ts (NEW)

# Go Worker (services/go/reconciliation-worker/)
  └── No changes required. Worker already supports /reconcile with
      sourceA/sourceB/toleranceCents — same contract used in all modes.
```

---

## Phase 3: Cashflow Data Source Validation (Real Ledger vs Simulated)

### Goal

Validar que las proyecciones de cashflow usen datos reales del ledger (bank transactions, AR, AP), no datos simulados. Cumplir NFR-05.

### Current State Analysis

```
getCashflowProjection (existing):
  ✓ Reads invoices  (unpaid) → projectedInflow
  ✓ Reads bills     (unpaid) → projectedOutflow
  ✓ Reads bankTransactions (historical) → trend analysis via getCashflowForecast
  ⚠ NO validation that bank transactions come from real providers
  ⚠ NO distinction between simulated data (MOCK provider) and real data (PROMETEO)
  ⚠ getActualCashflow reads bank_transactions directly, not validated
```

### AD-11: Data Source Provenance

**Decision**: Cada `BankTransaction` tiene `source: MANUAL | CSV_IMPORT | API_FEED`. Cashflow queries deben filtrar por fuente y exponer la procedencia en los resultados.

```
Cashflow Data Source Rules:
  API_FEED + provider.connectionStatus=CONNECTED   → PRODUCTION data
  API_FEED + provider.providerCode=MOCK            → SIMULATED data
  MANUAL / CSV_IMPORT                               → USER_PROVIDED data
```

**Validation Pipeline**:

```
┌───────────────────────────────────────────────────────────┐
│  CashflowDataSourceValidator                              │
│                                                           │
│  validate(accountId): DataSourceValidation {              │
│    provider ← account.provider                            │
│                                                           │
│    if provider.code == "MOCK":                            │
│      → confidence: LOW, source: SIMULATED                 │
│      → projections flagged with warning                  │
│                                                           │
│    if provider.code == "PROMETEO":                        │
│      → check connectionStatus == CONNECTED               │
│      → check lastSyncAt within expected window            │
│      → if stale (>48h): confidence MEDIUM, flag stale     │
│      → if fresh (≤48h): confidence HIGH, source REAL      │
│                                                           │
│    if no provider:                                        │
│      → transactions have source MANUAL/CSV_IMPORT        │
│      → confidence: USER_PROVIDED                         │
│      → no automatic validation possible                  │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
```

### AD-12: Cashflow Confidence Model

**Decision**: Cada proyección de cashflow incluye metadatos de confianza:

```json
{
  "accountId": "ba-abc123",
  "generatedAt": "2026-07-25T12:00:00Z",
  "dataSource": {
    "type": "REAL",
    "provider": "PROMETEO",
    "lastSyncAt": "2026-07-25T10:00:00Z",
    "freshness": "FRESH"
  },
  "confidence": {
    "historicalData": "HIGH",       // 90+ days of real transactions
    "projectedInflows": "MEDIUM",   // AR data present but 30% overdue
    "projectedOutflows": "HIGH",    // AP data complete
    "overall": "MEDIUM"
  },
  "projections": [...]
}
```

**Confidence Levels**:

| Level     | Criteria                                                             |
| --------- | -------------------------------------------------------------------- |
| `HIGH`    | Real provider, fresh sync (<48h), 90+ days history, AR/AP complete   |
| `MEDIUM`  | Real provider but stale sync (48h-7d), or 30-90 days history         |
| `LOW`     | MOCK provider, no provider, <30 days history, or only manual entries |
| `UNKNOWN` | No data available at all                                             |

### Phase 3 Deliverables

```
apps/api/src/features/cashflow/
  ├── application/
  │   ├── services/
  │   │   └── cashflow-data-source.service.ts   (NEW — validation)
  │   └── queries/
  │       ├── get-cashflow-projection.query.ts  (UPDATE — add confidence)
  │       ├── get-actual-cashflow.query.ts      (UPDATE — add source metadata)
  │       ├── get-cashflow-forecast.query.ts    (UPDATE — add confidence)
  │       └── get-cashflow-variance.query.ts    (UPDATE — add source comparison)
  ├── domain/
  │   ├── cashflow-projection.ts                (UPDATE — add DataSourceMeta)
  │   └── data-source-validation.ts             (NEW — value object)
  └── __tests__/
      ├── unit/data-source-validator.test.ts    (NEW)
      ├── unit/cashflow-confidence.test.ts      (NEW)
      └── integration/projection-real-data.test.ts (NEW)
```

---

## Fiscal Compliance Architecture (Cross-Cutting)

### Detracciones SPOT

```
BankAccount(type=DETRACCIONES) → Payment → DetractionCalculator
                                              │
                              ┌───────────────▼────────────────┐
                              │ calculateDetraction(           │
                              │   amount: Money,               │
                              │   serviceType: string,         │
                              │   rate?: number                │
                              │ ): { detractionAmount,         │
                              │      netAmount,                │
                              │      applicableRate }          │
                              └───────────────┬────────────────┘
                                              │
                              ┌───────────────▼────────────────┐
                              │ DetractionTransaction created: │
                              │ • Debit from main account      │
                              │ • Credit to detraction account │
                              │ • Reference: operation number  │
                              └────────────────────────────────┘
```

Rates stored in `detraction_rates` table (configurable per service type, effective-dated):

```sql
CREATE TABLE detraction_rates (
  id UUID PRIMARY KEY,
  service_type VARCHAR(50) NOT NULL,  -- e.g., 'SERVICIOS_GENERALES'
  rate_percent DECIMAL(5,2) NOT NULL, -- e.g., 12.00
  effective_from DATE NOT NULL,
  effective_to DATE,
  sunat_code VARCHAR(10),             -- SUNAT operation code
  created_at TIMESTAMP DEFAULT NOW()
);
```

### ITF (Impuesto a las Transacciones Financieras)

```
BankTransaction (type=DEBIT, currency=PEN, amount≥1000)
  → ITFCalculator.calculate(amount, rate?)
  → append itf_amount to transaction metadata

GET /api/banking/reports/itf?year=2026&month=07
  → aggregate all itf_amount for PEN transactions in period
  → return per-transaction and monthly totals
```

ITF rate stored as configurable parameter: `ITF_RATE_BPS` (basis points). Default: 5 bps = 0.005%.

### SUNAT PLE Reports

```
GET /api/banking/reports/ple?period=2026-07
  → Query bank_transactions WHERE date IN period
  → Transform to PLE format (fixed-width or CSV per SUNAT schema)
  → Return as CSV with proper Content-Disposition header
```

PLE format specification maintained in `packages/infrastructure/src/sunat/ple-formats/`.

---

## API Contract Evolution Summary

### New Endpoints (Phase 0-3)

| Method  | Path                                               | Phase | Purpose                       |
| ------- | -------------------------------------------------- | ----- | ----------------------------- |
| `POST`  | `/api/banking/reconciliation/batches`              | 0     | Create reconciliation batch   |
| `GET`   | `/api/banking/reconciliation/batches/{id}`         | 0     | Get batch details             |
| `POST`  | `/api/banking/reconciliation/batches/{id}/close`   | 0     | Close a batch                 |
| `POST`  | `/api/banking/reconciliation/batches/{id}/matches` | 0     | Create manual match           |
| `POST`  | `/api/banking/reconciliation/batches/{id}/suggest` | 0     | Get auto-match suggestions    |
| `POST`  | `/api/banking/reconciliation/rules`                | 0     | Create reconciliation rule    |
| `GET`   | `/api/banking/reconciliation/rules`                | 0     | List reconciliation rules     |
| `PATCH` | `/api/banking/reconciliation/rules/{id}`           | 0     | Update reconciliation rule    |
| `POST`  | `/api/banking/providers`                           | 1     | Register provider connection  |
| `POST`  | `/api/banking/providers/{id}/connect`              | 1     | Establish provider connection |
| `POST`  | `/api/banking/providers/{id}/disconnect`           | 1     | Disconnect provider           |
| `GET`   | `/api/banking/providers`                           | 1     | List provider connections     |
| `POST`  | `/api/banking/reconciliation/cutover`              | 2     | Execute cutover evaluation    |
| `POST`  | `/api/banking/reconciliation/cutover/apply`        | 2     | Apply cutover decision        |
| `GET`   | `/api/banking/reports/itf`                         | 0-3   | ITF monthly report            |
| `GET`   | `/api/banking/reports/ple`                         | 0-3   | PLE format export             |
| `GET`   | `/api/banking/reports/reconciliation`              | 0-3   | Monthly reconciliation report |

### Modified Endpoints

| Method | Path                                         | Phase | Change                                                 |
| ------ | -------------------------------------------- | ----- | ------------------------------------------------------ |
| `POST` | `/api/banking/auto-reconcile`                | 2     | Now creates batch; respects shadow/dual/primary mode   |
| `GET`  | `/api/cashflow/projection`                   | 3     | Response includes `dataSource` + `confidence` metadata |
| `GET`  | `/api/cashflow/actual`                       | 3     | Response includes source provenance per transaction    |
| `GET`  | `/api/banking/accounts/{id}/sync`            | 1     | Now triggers provider sync + auto-reconcile chain      |
| `GET`  | `/api/banking/reconciliation-shadow/metrics` | 2     | Extended with mode info, cutover readiness             |
| `GET`  | `/api/banking/reconciliation-shadow/cutover` | 2     | Extended with batch-level metrics                      |

### Deprecated Endpoints (post-Phase 2)

| Method | Path                                      | Replacement                                 |
| ------ | ----------------------------------------- | ------------------------------------------- |
| `POST` | `/api/reconciliations/external/reconcile` | Internal only (Go worker called by engine)  |
| `GET`  | `/api/banking-providers/accounts`         | `GET /api/banking/providers/{id}/accounts`  |
| `GET`  | `/api/banking-providers/movements`        | `GET /api/banking/providers/{id}/movements` |

---

## Database Migration Strategy

### Phase 0 (Non-breaking)

```
Migration 000X:
  ALTER TABLE bank_reconciliations
    ADD COLUMN batch_reference VARCHAR(50),
    ADD COLUMN mode VARCHAR(10) DEFAULT 'MANUAL',
    ADD COLUMN matched_count INTEGER DEFAULT 0,
    ADD COLUMN unmatched_count INTEGER DEFAULT 0,
    ADD COLUMN discrepancy_amount DECIMAL(19,4),
    ADD COLUMN closed_at TIMESTAMP,
    ADD COLUMN closed_by UUID;

  ALTER TABLE bank_transactions
    ADD COLUMN reconciliation_batch_id UUID REFERENCES bank_reconciliations(id),
    ADD COLUMN external_id VARCHAR(100),
    ADD COLUMN source VARCHAR(20) DEFAULT 'MANUAL';

  CREATE UNIQUE INDEX idx_bt_external_id
    ON bank_transactions(bank_account_id, external_id)
    WHERE external_id IS NOT NULL;

  CREATE TABLE reconciliation_rules (...);
  CREATE TABLE bank_providers (...);
```

### Phase 1 (Non-breaking)

```
Migration 000Y:
  -- bank_providers was created in Phase 0
  -- Add provider_id FK to bank_accounts if not already present
  ALTER TABLE bank_accounts
    ADD COLUMN provider_id UUID REFERENCES bank_providers(id),
    ADD COLUMN last_sync_at TIMESTAMP;
```

### Phase 2 (Breaking — feature flag gated)

```
No schema migration required. Mode transition managed via
environment variables and feature flags in bank_providers.feature_flags.
```

### Phase 3 (Non-breaking)

```
Migration 000Z:
  CREATE TABLE detraction_rates (...);

  ALTER TABLE bank_transactions
    ADD COLUMN itf_amount DECIMAL(19,4);
```

### Rollback Strategy

- **Phase 0**: Additive only. Rollback by dropping new columns/tables. No data loss risk.
- **Phase 1**: Additive only. Rollback by dropping provider_id from bank_accounts. Existing transactions unaffected.
- **Phase 2**: Fully gated. `ARKELYTHEX_RECONCILIATION_MODE=shadow` instantly reverts. No data migration.
- **Phase 3**: Additive only. Rollback by dropping `itf_amount` column.

---

## Risk Mitigation Matrix

| Risk                                         | Probability | Impact   | Mitigation                                                                             | Phase |
| -------------------------------------------- | ----------- | -------- | -------------------------------------------------------------------------------------- | ----- |
| Prometeo production auth failure             | Medium      | High     | Mock adapter for testing; gradual rollout with feature flag per company                | 1     |
| Data loss during shadow→primary              | Low         | Critical | Progressive: shadow→dual→primary, with metrics gate at each step                       | 2     |
| Reconciliation engine produces wrong matches | Medium      | High     | Go worker cross-validation; discrepancy threshold triggers alert                       | 2     |
| Cashflow using simulated data in production  | Low         | Medium   | DataSourceValidator rejects MOCK provider in production mode                           | 3     |
| Detracciones rate change by SUNAT            | Medium      | Medium   | Rates are DB-configurable with effective dates, not hardcoded                          | 0     |
| ITF rate change by government                | Low         | Low      | Stored as config parameter (`ITF_RATE_BPS`), updated via env/DB                        | 0     |
| Batch immutability violation                 | Low         | High     | DB-level constraint: closed batches reject modifications via application logic + CHECK | 0     |

---

## Component Dependency Map

```
Phase 0 (Formalize):
  domain entities ──► repository interfaces ──► persistence schema
  domain entities ──► application services ──► API routes
  No cross-phase dependencies. All additive.

Phase 1 (Prometeo Activation):
  bank_providers table (Phase 0) ──► PrometeoAdapter
  PrometeoAdapter ──► BankProviderService
  BankProviderService ──► API routes + Scheduler
  bank_accounts.provider_id (Phase 0) ──► BankProviderService
  Depends on: Phase 0 bank_providers table

Phase 2 (Shadow → Primary):
  reconciliation_shadow_runs (existing) ──► CutoverEvaluator
  ReconciliationBatch (Phase 0) ──► ReconciliationService (refactored)
  BankProviderService (Phase 1) ──► trigger auto-reconcile after sync
  Depends on: Phase 0 batches, Phase 1 providers

Phase 3 (Cashflow Validation):
  bank_transactions.source (Phase 0) ──► DataSourceValidator
  bank_providers (Phase 1) ──► DataSourceValidator
  Cashflow queries ──► DataSourceValidator ──► confidence metadata
  Depends on: Phase 0 source column, Phase 1 providers
```

---

## Testing Strategy

### Contract Tests (Phase 0)

```typescript
// provider-adapter.contract.ts
// Shared test suite that any BankProviderAdapter implementation must pass
export function testBankProviderAdapter(
  createAdapter: () => BankProviderAdapter
) {
  describe('BankProviderAdapter contract', () => {
    it('login returns a non-empty session key on valid credentials')
    it('login throws on invalid credentials')
    it('getAccounts returns normalized account list')
    it('getMovements returns normalized movements')
    it('getMovements with date range filters correctly')
    it('logout does not throw even with invalid session')
  })
}
```

### Integration Tests (Phase 1-2)

```
Scenarios:
  ✓ Full sync flow: connect → get accounts → get movements → persist → auto-reconcile
  ✓ Idempotency: same external_id twice → second import skipped
  ✓ Provider failure: network error → connectionStatus: ERROR, syncError set
  ✓ Shadow run: local engine produces matches → Go worker comparison → metrics persisted
  ✓ Cutover evaluation: 20+ successful runs → GO; <20 → INSUFFICIENT_DATA
  ✓ Dual mode: both engines write, comparison non-blocking
  ✓ Discrepancy alert: discrepancyRate > 5% → NO_GO
```

### E2E Tests (Critical Paths)

```
  1. Bank account creation → provider connection → sync → verify transactions exist
  2. Manual reconciliation batch → suggest matches → confirm → close → verify report
  3. Cashflow projection for connected account → verify confidence = HIGH
  4. Cashflow projection for MOCK account → verify confidence = LOW + warning
```

---

## Rollout Sequence

```
Week 1-2:   Phase 0 — Formalization
            • Schema migrations (additive)
            • Entity/repository formalization
            • Test coverage to target levels
            • Non-breaking. No feature flags needed.

Week 3-4:   Phase 1 — Prometeo Activation
            • Provider abstraction layer
            • PrometeoAdapter with credential encryption
            • Sync scheduler (disabled by default)
            • Feature flag: PROMETEO_ENABLED per company
            • Gradual activation: MOCK → sandbox → production

Week 5-6:   Phase 2 — Shadow → Primary
            • Batch-aware reconciliation engine
            • Cutover evaluator
            • Progressive: SHADOW → DUAL (5-10 cycles) → PRIMARY
            • Feature flag: ARKELYTHEX_RECONCILIATION_MODE

Week 7-8:   Phase 3 — Cashflow Validation
            • DataSourceValidator implementation
            • Confidence model integration
            • Cashflow query enrichment
            • Detracciones SPOT integration
            • SUNAT PLE reports
            • ITF calculation + reports
```

---

## Open Questions & Future Considerations

1. **Go Worker deployment**: Is the Go reconciliation worker deployed as a sidecar or separate service? This affects health check timeout strategy in Phase 2.

2. **Redis availability**: For session key storage (Prometeo 5min TTL). If Redis is available, use it; otherwise, in-memory Map with TTL cleanup.

3. **Multi-bank aggregation**: Post-Phase 1, when a company has Prometeo + future providers (Belo, etc.) — the `BankProviderAdapter` interface already supports this. The `BankAccount.providerId` is the routing key.

4. **Real-time transaction feed**: Prometeo currently supports polling (REST). A future webhook-based real-time feed would require a webhook receiver endpoint + signature verification.

5. **CBDC / Digital Wallet**: CAP-TREAS-09 (P3) — the `CBDCWallet` UI components exist (3 files in WEB). Domain modeling deferred to a future SDD.

6. **Treasury Agent**: CAP-TREAS-10 (P2) — infrastructure `agents/treasury` exists. Autonomous reconciliation + alerts deferred to a future SDD.

---

## Design Decisions Summary

| ID    | Decision                                                                     | Rationale                                                                          |
| ----- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| AD-01 | Introduce ReconciliationBatch as aggregate root                              | Formalizes implicit period-scoped reconciliation; needed for SUNAT monthly closing |
| AD-02 | Standardize validation on Zod → derive Elysia schemas                        | DRY, testable contracts, single source of truth                                    |
| AD-03 | Test pyramid: 95% domain, 90% services, 80% API, 100% provider contracts     | Progressive coverage matching risk profile                                         |
| AD-04 | BankProviderAdapter interface with Prometeo + Mock implementations           | NFR-06: provider abstraction; enables future providers without core changes        |
| AD-05 | AES-256-GCM encrypted credentials in JSONB column                            | NFR-02: encryption at rest; never in logs/responses                                |
| AD-06 | Idempotency via external_id unique constraint per account                    | NFR-03: prevents duplicate transaction ingestion                                   |
| AD-07 | Feature flags per bank account in JSONB column                               | Granular control: sync frequency, shadow mode, live feed per account               |
| AD-08 | Progressive cutover: SHADOW → DUAL → PRIMARY with quantitative gates         | Minimizes risk; rollback any time via env var                                      |
| AD-09 | Reconciliation mode state machine with circuit breaker                       | Automated safety; discrepancy threshold triggers revert                            |
| AD-10 | Batch lifecycle: OPEN → (PARTIALLY_MATCHED) → CLOSED/CLOSED_WITH_DISCREPANCY | NFR-04: closed batch immutability enforced at application + DB level               |
| AD-11 | Data source provenance via BankTransaction.source + BankProvider             | NFR-05: production accounts must use real data; MOCK flagged as simulated          |
| AD-12 | Cashflow confidence model: HIGH/MEDIUM/LOW/UNKNOWN                           | Transparent to users; decisions based on data quality                              |
