# Reporting & Financial Statements — Architecture Design

**Change ID:** `drenyra-reporting-financials`
**Domain:** `reports`
**Created:** 2026-07-25
**Status:** design

---

## 1. Executive Summary

This design elevates the Drenyra Reports module from a PEN-only baseline aggregator to a full financial statements platform across three phases. The architecture introduces: a canonical General Ledger query layer, SUNAT PLE formato 5.1 generation, API versioning via `/api/v1/reports/*`, multi-company consolidation with inter-company elimination, and a structured path to budget vs actual, cost centers, exports, custom report builder, and scheduling.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                                    │
│                                                                              │
│  /api/reports/* (legacy)           /api/v1/reports/* (canonical)             │
│  Deprecation: true                 X-API-Version: 1                          │
│  Sunset: 2027-01-01                                                          │
│       │                                    │                                  │
│       └────────────┬───────────────────────┘                                  │
│                    │                                                          │
│  ┌─────────────────▼──────────────────────────────────────────────────────┐  │
│  │                     FEATURE FLAG GATEWAY                                │  │
│  │  PLE_ENABLED | MULTI_COMPANY_CONSOLIDATION | BUDGET_ENABLED | ...       │  │
│  │  Returns 503 if off; forwards to router if on                           │  │
│  └─────────────────┬──────────────────────────────────────────────────────┘  │
│                    │                                                          │
│  ┌─────────────────▼──────────────────────────────────────────────────────┐  │
│  │                     REPORTS ROUTER (Elysia)                             │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────┐ │  │
│  │  │ Financial │ │   PLE     │ │Consolidated│ │  Export   │ │ Schedule │ │  │
│  │  │ Statements│ │ Generator │ │  Reports   │ │ PDF/XLSX  │ │  Cron    │ │  │
│  │  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └────┬─────┘ │  │
│  └────────┼─────────────┼─────────────┼─────────────┼────────────┼───────┘  │
│           │             │             │             │            │           │
├───────────┼─────────────┼─────────────┼─────────────┼────────────┼───────────┤
│           │             │             │             │            │           │
│  ┌────────▼─────────────▼─────────────▼─────────────▼────────────▼───────┐  │
│  │                    APPLICATION LAYER                                   │  │
│  │                                                                        │  │
│  │  ┌──────────────────────┐  ┌──────────────────────────────────┐       │  │
│  │  │  Report Generators    │  │  PLE Formatter (Formato 5.1)     │       │  │
│  │  │  • Profit & Loss      │  │  • Fixed-width text generator    │       │  │
│  │  │  • Balance Sheet      │  │  • CDR hash computation          │       │  │
│  │  │  • Cash Flow          │  │  • Structural validator          │       │  │
│  │  │  • Trial Balance      │  │  • PDF/XLSX Export               │       │  │
│  │  │  • General Ledger     │  └──────────────────────────────────┘       │  │
│  │  └──────────┬───────────┘                                              │  │
│  │             │                                                           │  │
│  │  ┌──────────▼──────────────────────────────────────────────────┐       │  │
│  │  │              Consolidation Engine                             │       │  │
│  │  │  • Inter-company AR/AP matching                               │       │  │
│  │  │  • Elimination journal entries (virtual)                      │       │  │
│  │  │  • Group ledger aggregation                                   │       │  │
│  │  └──────────┬──────────────────────────────────────────────────┘       │  │
│  └─────────────┼──────────────────────────────────────────────────────────┘  │
│                │                                                              │
├────────────────┼──────────────────────────────────────────────────────────────┤
│                │                                                              │
│  ┌─────────────▼──────────────────────────────────────────────────────────┐  │
│  │                     LEDGER QUERY FACADE                                 │  │
│  │                                                                         │  │
│  │  ILedgerQuery {                                                         │  │
│  │    getEntries(companyId, accountCode?, period) → LedgerEntry[]          │  │
│  │    getAccountBalances(companyId, asOfDate) → AccountBalance[]           │  │
│  │    getInterCompanyEntries(groupId, period) → InterCompanyEntry[]        │  │
│  │  }                                                                      │  │
│  │                                                                         │  │
│  │  ┌─────────────────┐    ┌──────────────────────┐                        │  │
│  │  │ LedgerApiClient  │    │ LedgerDbFallback     │                        │  │
│  │  │ (HTTP to /api/   │    │ (direct DB query     │                        │  │
│  │  │  ledger/general) │    │  to ledger_entries)  │                        │  │
│  │  └─────────────────┘    └──────────────────────┘                        │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                │                                                              │
├────────────────┼──────────────────────────────────────────────────────────────┤
│                │                                                              │
│  ┌─────────────▼──────────────────────────────────────────────────────────┐  │
│  │                     PERSISTENCE LAYER                                   │  │
│  │                                                                         │  │
│  │  Tables (new):                                                          │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐    │  │
│  │  │ ple_generations   │ │consolidation_    │ │ budgets              │    │  │
│  │  │                  │ │ groups            │ │                      │    │  │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────────┘    │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────┐    │  │
│  │  │ cost_centers     │ │ ledger_entries    │ │ report_templates     │    │  │
│  │  │                  │ │ (ledger module)   │ │                      │    │  │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────────┘    │  │
│  │  ┌──────────────────┐ ┌──────────────────┐                             │  │
│  │  │ report_schedules  │ │ feature_flags     │                             │  │
│  │  │                  │ │ (config table)    │                             │  │
│  │  └──────────────────┘ └──────────────────┘                             │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Module Structure

### 3.1 Phase 1 Deliverable Structure

```
apps/api/src/features/reports/
├── index.ts                              # Public barrel — exports reportsModule + types
├── routes.ts                             # Assembly: legacy + v1 modules, deprecation headers
│
├── v1/                                   # Versioned API surface (Phase 1)
│   ├── index.ts                          # v1 Module assembly
│   ├── routes/
│   │   ├── profit-loss.routes.ts         # GET /api/v1/reports/profit-loss
│   │   ├── balance-sheet.routes.ts       # GET /api/v1/reports/balance-sheet
│   │   ├── cash-flow.routes.ts           # GET /api/v1/reports/cash-flow
│   │   ├── trial-balance.routes.ts       # GET /api/v1/reports/trial-balance
│   │   ├── general-ledger.routes.ts      # GET /api/v1/reports/general-ledger
│   │   ├── sales-by-customer.routes.ts   # GET /api/v1/reports/sales-by-customer
│   │   ├── ple/
│   │   │   ├── index.ts                  # PLE sub-module (4 books)
│   │   │   ├── diario.routes.ts          # POST /api/v1/reports/ple/diario
│   │   │   ├── mayor.routes.ts           # POST /api/v1/reports/ple/mayor
│   │   │   ├── compras.routes.ts         # POST /api/v1/reports/ple/compras
│   │   │   └── ventas.routes.ts          # POST /api/v1/reports/ple/ventas
│   │   └── consolidated/
│   │       ├── index.ts                  # Consolidated sub-module
│   │       ├── profit-loss.routes.ts     # GET /api/v1/reports/consolidated/profit-loss
│   │       └── balance-sheet.routes.ts   # GET /api/v1/reports/consolidated/balance-sheet
│   │
│   ├── schemas/
│   │   ├── reports.schemas.ts            # Zod schemas (refactored from current)
│   │   ├── ple.schemas.ts                # PLE request/response schemas
│   │   └── consolidated.schemas.ts       # Consolidation schemas
│   │
│   └── __tests__/
│       ├── unit/
│       ├── integration/
│       └── contracts/
│
├── legacy/                               # Deprecated endpoints
│   ├── routes.ts                         # Mirrors v1 Financial routes at /api/reports/*
│   └── index.ts
│
├── application/                          # Use cases (migrated from current)
│   ├── queries/
│   │   ├── get-profit-loss.ts            # Migrated to LedgerQuery
│   │   ├── get-balance-sheet.ts          # Migrated to LedgerQuery
│   │   ├── get-cash-flow.ts              # Migrated to LedgerQuery
│   │   ├── get-trial-balance.ts          # NEW
│   │   ├── get-general-ledger.ts         # NEW
│   │   └── get-sales-by-customer.ts      # Migrated to LedgerQuery
│   │
│   ├── services/
│   │   ├── reporting.service.ts          # Refactored — delegates to LedgerQuery
│   │   ├── ple-generator.service.ts      # NEW — PLE format 5.1 generation
│   │   ├── ple-validator.service.ts      # NEW — structural validation
│   │   └── consolidation.service.ts      # NEW — inter-company elimination
│   │
│   └── generators/
│       ├── ple-diario.formatter.ts       # Libro Diario → fixed-width text
│       ├── ple-mayor.formatter.ts        # Libro Mayor → fixed-width text
│       ├── ple-compras.formatter.ts      # Registro de Compras → fixed-width text
│       └── ple-ventas.formatter.ts       # Registro de Ventas → fixed-width text
│
├── domain/
│   ├── ple.types.ts                      # PLE domain types
│   └── consolidation.types.ts            # Inter-company elimination types
│
├── infrastructure/
│   ├── ledger-query.facade.ts            # LedgerQuery implementation + fallback
│   ├── repositories/
│   │   ├── ple-generation.repo.ts        # CRUD for ple_generations
│   │   └── consolidation-group.repo.ts   # CRUD for consolidation_groups
│   └── feature-flags.ts                  # Feature flag evaluator
│
├── _internal/
│   ├── money-utils.ts                    # Existing — kept
│   ├── error-shapes.ts                   # Unified error response helpers
│   └── api-version-header.ts             # X-API-Version header injection
│
├── existing files (keep, refactor):      # Refactored to use LedgerQuery
│   ├── reports.schemas.ts → v1/schemas/reports.schemas.ts (enhanced)
│   ├── queries/ → application/queries/
│   └── routes.ts → legacy/routes.ts + routes.ts (assembly)
│
└── __tests__/                            # Keep existing + add Phase 1 tests
```

### 3.2 Phase 2 Extensions

```
apps/api/src/features/reports/
├── v1/routes/
│   ├── budgets.routes.ts                 # CRUD + budget-vs-actual
│   ├── cost-centers.routes.ts            # CRUD for cost centers
│   └── export.routes.ts                  # POST export/pdf, export/xlsx per reportType
│
├── application/
│   ├── queries/
│   │   └── get-budget-vs-actual.ts       # NEW
│   ├── services/
│   │   ├── export-pdf.service.ts         # Extends ledger-mvp export infra
│   │   └── export-xlsx.service.ts
│   └── generators/
│       └── budget-variance.generator.ts
│
├── domain/
│   ├── budget.types.ts
│   └── cost-center.types.ts
│
└── infrastructure/repositories/
    ├── budget.repo.ts
    └── cost-center.repo.ts
```

### 3.3 Phase 3 Extensions

```
apps/api/src/features/reports/
├── v1/routes/
│   ├── report-templates.routes.ts        # CRUD + execute + export
│   ├── report-templates.execute.routes.ts
│   └── report-schedules.routes.ts        # CRUD + history
│
├── application/
│   ├── services/
│   │   ├── template-engine.service.ts    # Constrained query builder
│   │   ├── template-executor.service.ts  # Execute template → report data
│   │   └── schedule-executor.service.ts  # Cron job: generate + distribute
│   │
│   └── generators/
│       └── custom-report.generator.ts
│
├── domain/
│   ├── report-template.types.ts
│   └── report-schedule.types.ts
│
└── infrastructure/
    ├── repositories/
    │   ├── report-template.repo.ts
    │   └── report-schedule.repo.ts
    ├── template-validation.constraints.ts # Complexity limits enforcement
    └── scheduler/
        ├── cron.trigger.ts               # Cron job registration
        ├── email-distributor.ts          # Email with PDF/XLSX attachments
        └── webhook-distributor.ts        # HTTP POST to webhookUrl
```

---

## 4. Data Models

### 4.1 New Tables — Phase 1

#### 4.1.1 `ple_generations`

```sql
CREATE TABLE ple_generations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    ruc             VARCHAR(11) NOT NULL,               -- RUC of the declaring entity
    book_type       VARCHAR(20) NOT NULL,                -- 'LE-DIARIO' | 'LE-MAYOR' | 'LE-COMPRAS' | 'LE-VENTAS'
    period          VARCHAR(7) NOT NULL,                 -- 'YYYY-MM'
    status          VARCHAR(30) NOT NULL DEFAULT 'generated',
                    -- 'generated' | 'validated' | 'validation_failed' | 'filed'
    cdr_hash        VARCHAR(64),                        -- SHA-256 of generated content
    file_content    TEXT,                                -- Full PLE txt content (validated only)
    file_size_bytes INTEGER,
    sunat_response  JSONB,                               -- SUNAT response (when filed)
    generation_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    validated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ple_generations_book_period_ruc_uniq
        UNIQUE (company_id, book_type, period, ruc)
);

CREATE INDEX idx_ple_generations_company_book_period
    ON ple_generations(company_id, book_type, period);
CREATE INDEX idx_ple_generations_status ON ple_generations(status);
```

#### 4.1.2 `consolidation_groups`

```sql
-- Reuses companies.economic_group_id for grouping.
-- This table defines consolidation parameters per group member.

CREATE TABLE consolidation_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name      VARCHAR(255) NOT NULL,
    parent_company_id UUID NOT NULL REFERENCES companies(id),
    tenant_id       UUID NOT NULL,                       -- Tenant isolation
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT consolidation_groups_tenant_uniq
        UNIQUE (group_name, tenant_id)
);

CREATE TABLE consolidation_group_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES consolidation_groups(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id),
    role            VARCHAR(20) NOT NULL DEFAULT 'member', -- 'parent' | 'member'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT cgm_group_company_uniq UNIQUE (group_id, company_id)
);

CREATE INDEX idx_cgm_group_id ON consolidation_group_members(group_id);
CREATE INDEX idx_cgm_company_id ON consolidation_group_members(company_id);
```

#### 4.1.3 `inter_company_eliminations` (audit log)

```sql
CREATE TABLE inter_company_eliminations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id        UUID NOT NULL REFERENCES consolidation_groups(id),
    source_company_id UUID NOT NULL REFERENCES companies(id),
    target_company_id UUID NOT NULL REFERENCES companies(id),
    account_code    VARCHAR(20) NOT NULL,                -- AR or AP account
    amount_cents    BIGINT NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'PEN',
    elimination_type VARCHAR(20) NOT NULL,                -- 'AR_AP' | 'REVENUE_EXPENSE' (Phase 2+)
    period          VARCHAR(7) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ice_group_period ON inter_company_eliminations(group_id, period);
```

#### 4.1.4 `report_generation_log` (audit trail for all report generations)

```sql
CREATE TABLE report_generation_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    report_type     VARCHAR(50) NOT NULL,
                    -- 'profit-loss' | 'balance-sheet' | 'cash-flow' |
                    -- 'trial-balance' | 'general-ledger' | 'sales-by-customer' |
                    -- 'ple-diario' | 'ple-mayor' | 'ple-compras' | 'ple-ventas' |
                    -- 'consolidated-profit-loss' | 'consolidated-balance-sheet'
    period_start    DATE,
    period_end      DATE,
    params          JSONB NOT NULL DEFAULT '{}',         -- Filter params snapshot
    status          VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message   TEXT,
    duration_ms     INTEGER,
    user_id         UUID REFERENCES users(id),
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rgl_company_type ON report_generation_log(company_id, report_type);
CREATE INDEX idx_rgl_generated_at ON report_generation_log(generated_at);
```

### 4.2 New Tables — Phase 2

#### 4.2.1 `budgets`

```sql
CREATE TABLE budgets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    account_code    VARCHAR(20) NOT NULL,                -- PCGE account code
    year            INTEGER NOT NULL,
    month           INTEGER,                              -- NULL = annual budget
    amount_cents    BIGINT NOT NULL,
    currency        VARCHAR(3) NOT NULL DEFAULT 'PEN',
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT budgets_company_account_period_uniq
        UNIQUE (company_id, account_code, year, month)
);

CREATE INDEX idx_budgets_company_year ON budgets(company_id, year, account_code);
```

#### 4.2.2 `cost_centers`

```sql
CREATE TABLE cost_centers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(10) NOT NULL DEFAULT 'cost', -- 'cost' | 'profit'
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT cc_company_code_uniq UNIQUE (company_id, code)
);

-- Foreign key relationship on ledger_entries (ledger module)
-- ledger_entries.cost_center_id → cost_centers.id (nullable)
```

### 4.3 New Tables — Phase 3

#### 4.3.1 `report_templates`

```sql
CREATE TABLE report_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    format          VARCHAR(20) NOT NULL,                -- 'tabular' | 'pnl-style' | 'comparative'
    config          JSONB NOT NULL,                       -- { accounts, costCenterIds, periodType, columns, groupBy }
    shared_with_firm BOOLEAN DEFAULT false,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rt_company ON report_templates(company_id);
```

#### 4.3.2 `report_schedules`

```sql
CREATE TABLE report_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    report_type     VARCHAR(50) NOT NULL,
                    -- 'profit-loss' | 'balance-sheet' | ... | 'template'
    template_id     UUID REFERENCES report_templates(id),
    report_params   JSONB NOT NULL DEFAULT '{}',
    frequency       VARCHAR(10) NOT NULL,                -- 'daily' | 'weekly' | 'monthly'
    day_of_week     INTEGER,                              -- 0=Sun, 6=Sat (weekly)
    day_of_month    INTEGER,                              -- 1-31 (monthly)
    time            TIME NOT NULL,
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
    formats         JSONB NOT NULL DEFAULT '["pdf"]',     -- ["pdf", "xlsx"]
    recipients      JSONB NOT NULL DEFAULT '[]',          -- [{ email, name }]
    webhook_url     TEXT,
    is_active       BOOLEAN DEFAULT true,
    last_run_at     TIMESTAMPTZ,
    next_run_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rs_company ON report_schedules(company_id);
CREATE INDEX idx_rs_next_run ON report_schedules(next_run_at) WHERE is_active = true;
```

#### 4.3.3 `report_schedule_executions`

```sql
CREATE TABLE report_schedule_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id     UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'failed'
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ,
    file_urls       JSONB,                                -- { pdf?, xlsx? }
    error_message   TEXT,
    email_sent_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rse_schedule ON report_schedule_executions(schedule_id);
```

---

## 5. PLE File Format — SUNAT Formato 5.1

### 5.1 General Structure

All four books follow SUNAT formato 5.1: **fixed-width text** (txt estructurado de ancho fijo), encoded in **Windows-1252** (or ASCII for standard). Each line is a record with fixed column positions delimited by `|`.

### 5.2 Libro Diario (LE-DIARIO)

**Record layout per journal entry line:**

| Position | Length | Field      | Description                                                    |
| -------- | ------ | ---------- | -------------------------------------------------------------- |
| 1-2      | 2      | `CAMPO 1`  | Period (MM)                                                    |
| 3-6      | 4      | `CAMPO 2`  | Fiscal year (YYYY)                                             |
| 7-20     | 14     | `CAMPO 3`  | RUC (11 chars, right-padded)                                   |
| 21-40    | 20     | `CAMPO 4`  | Voucher number (asiento contable)                              |
| 41-42    | 2      | `CAMPO 5`  | Operation code (01=Apertura, 02=Regular, 03=Ajuste, 04=Cierre) |
| 43-52    | 10     | `CAMPO 6`  | Voucher date (DD/MM/YYYY)                                      |
| 53-62    | 10     | `CAMPO 7`  | Operation date (DD/MM/YYYY)                                    |
| 63-72    | 10     | `CAMPO 8`  | GL account code (PCGE)                                         |
| 73-112   | 40     | `CAMPO 9`  | Account description                                            |
| 113-114  | 2      | `CAMPO 10` | Currency code (01=PEN, 02=USD)                                 |
| 115-126  | 12     | `CAMPO 11` | Debit amount in cents (right-aligned, zero-padded)             |
| 127-138  | 12     | `CAMPO 12` | Credit amount in cents                                         |
| 139-148  | 10     | `CAMPO 13` | Currency code for GL (01=PEN)                                  |
| 149-160  | 12     | `CAMPO 14` | Debit in GL currency                                           |
| 161-172  | 12     | `CAMPO 15` | Credit in GL currency                                          |
| 173-182  | 10     | `CAMPO 16` | Transaction type (future use)                                  |
| 183-222  | 40     | `CAMPO 17` | Gloss (description)                                            |
| 223-224  | 2      | `CAMPO 18` | Document type (future use)                                     |
| 225-244  | 20     | `CAMPO 19` | Document number                                                |
| 245-254  | 10     | `CAMPO 20` | Document date (DD/MM/YYYY)                                     |
| 255      | 1      | `CAMPO 21` | State (1=active, 0=anulado)                                    |

**Example record:**

```
06|2026|20123456789  |ASIENTO-00001        |02|30/06/2026|30/06/2026|601000    |GASTOS DE PERSONAL                     |01|000000120000|000000000000|01|000000120000|000000000000|          |PAGO DE PLANILLA JUNIO 2026            |  |F001-00001234         |30/06/2026|1
```

### 5.3 Libro Mayor (LE-MAYOR)

**Record layout per account-month line:**

| Position | Length | Field                          | Description |
| -------- | ------ | ------------------------------ | ----------- |
| 1-2      | 2      | Period (MM)                    |
| 3-6      | 4      | Fiscal year (YYYY)             |
| 7-20     | 14     | RUC                            |
| 21-30    | 10     | Account code (PCGE)            |
| 31-70    | 40     | Account description            |
| 71-82    | 12     | Opening debit balance (cents)  |
| 83-94    | 12     | Opening credit balance (cents) |
| 95-106   | 12     | Monthly debits total           |
| 107-118  | 12     | Monthly credits total          |
| 119-130  | 12     | Closing debit balance          |
| 131-142  | 12     | Closing credit balance         |
| 143      | 1      | State                          |

### 5.4 Registro de Compras (LE-COMPRAS)

**Record layout per purchase invoice:**

| Position | Length | Field                                                                        | Description |
| -------- | ------ | ---------------------------------------------------------------------------- | ----------- |
| 1-2      | 2      | Period (MM)                                                                  |
| 3-6      | 4      | Fiscal year (YYYY)                                                           |
| 7-20     | 14     | RUC                                                                          |
| 21-30    | 10     | Operation date (DD/MM/YYYY)                                                  |
| 31-40    | 10     | Document issue date                                                          |
| 41-50    | 10     | Document due/expiry date                                                     |
| 51-52    | 2      | Document type (01=Factura, 03=Boleta, 07=Nota de Crédito, 08=Nota de Débito) |
| 53-72    | 20     | Document series                                                              |
| 73-92    | 20     | Document number                                                              |
| 93-106   | 14     | Supplier RUC                                                                 |
| 107-146  | 40     | Supplier name                                                                |
| 147-158  | 12     | Adquisiciones gravadas (taxable purchases in cents)                          |
| 159-170  | 12     | IGV base imponible                                                           |
| 171-182  | 12     | IGV amount                                                                   |
| 183-194  | 12     | Adquisiciones no gravadas                                                    |
| 195-206  | 12     | Adquisiciones gravadas + no gravadas (total)                                 |
| 207-218  | 12     | ISC amount                                                                   |
| 219-230  | 12     | Detracción amount                                                            |
| 231-242  | 12     | Retención amount                                                             |
| 243-254  | 12     | Total amount                                                                 |
| 255-264  | 10     | Currency code                                                                |
| 265-276  | 12     | Exchange rate (x10000)                                                       |
| 277      | 1      | State                                                                        |

### 5.5 Registro de Ventas (LE-VENTAS)

**Record layout per sales invoice:**

| Position | Length | Field                                               | Description |
| -------- | ------ | --------------------------------------------------- | ----------- |
| 1-2      | 2      | Period (MM)                                         |
| 3-6      | 4      | Fiscal year (YYYY)                                  |
| 7-20     | 14     | RUC                                                 |
| 21-30    | 10     | Operation date                                      |
| 31-40    | 10     | Document issue date                                 |
| 41-50    | 10     | Document due date                                   |
| 51-52    | 2      | Document type (01=Factura, 03=Boleta, 07=NC, 08=ND) |
| 53-72    | 20     | Document series                                     |
| 73-92    | 20     | Document number                                     |
| 93-106   | 14     | Customer RUC                                        |
| 107-146  | 40     | Customer name                                       |
| 147-158  | 12     | Ventas gravadas (taxable sales)                     |
| 159-170  | 12     | IGV base imponible                                  |
| 171-182  | 12     | IGV amount                                          |
| 183-194  | 12     | Exportaciones                                       |
| 195-206  | 12     | Ventas no gravadas                                  |
| 207-218  | 12     | ISC amount                                          |
| 219-230  | 12     | Descuentos/Bonificaciones                           |
| 231-242  | 12     | Total amount                                        |
| 243-252  | 10     | Currency code                                       |
| 253-264  | 12     | Exchange rate                                       |
| 265      | 1      | State                                               |

### 5.6 PLE Generation Flow

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ LedgerQuery  │────▶│ PLE Formatter   │────▶│ PLE Validator    │
│ (entries)    │     │ (fixed-width)   │     │ (structural)     │
└──────────────┘     └────────┬────────┘     └────────┬─────────┘
                              │                       │
                              ▼                       ▼
                     ┌────────────────┐     ┌──────────────────┐
                     │ CDR Hash       │     │ ple_generations  │
                     │ (SHA-256)      │     │ (persist)        │
                     └────────────────┘     └──────────────────┘
```

1. **Read**: LedgerQuery returns journal entries / account balances / purchases / sales for the period.
2. **Format**: PLE Formatter converts entries to fixed-width text lines according to SUNAT 5.1 spec.
3. **Validate**: PLE Validator checks structural constraints:
   - All required fields present
   - Debit === Credit for each journal entry
   - Period consistency (no cross-period entries)
   - RUC format valid
   - Account codes exist in PCGE
4. **Hash**: SHA-256 of the full text content → stored as `cdr_hash`.
5. **Persist**: Insert/update `ple_generations` row with status and content.
6. **Download gate**: Only entries with `status = 'validated'` can be downloaded.

### 5.7 Validation Chain (compliance integration)

The existing `fiscal-compliance-pipeline` infrastructure provides chain primitives. A new chain `ple-validation` is registered:

```typescript
// Chain: ple-validation
// Steps:
//   1. ple-structural-validator: checks fixed-width format, required fields, field lengths
//   2. ple-accounting-validator: debit/credit balance, period consistency
//   3. ple-cdr-hasher: computes SHA-256, stores it
//   4. ple-approval-gate: status → 'validated' on pass, 'validation_failed' on fail
```

---

## 6. API Versioning Strategy

### 6.1 Dual Endpoint Architecture

```
                    ┌────────────────────────────┐
                    │     reportsModule          │
                    │   (Elysia root assembly)   │
                    └──────────┬─────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
    ┌─────────▼──────────┐          ┌───────────▼──────────┐
    │  legacyModule      │          │  v1Module             │
    │  prefix: /api/     │          │  prefix: /api/v1/     │
    │  reports           │          │  reports              │
    │                    │          │                       │
    │  • Deprecation:    │          │  • X-API-Version: 1   │
    │    true            │          │  • No deprecation     │
    │  • Sunset:         │          │    headers            │
    │    2027-01-01      │          │                       │
    └────────┬───────────┘          └───────────┬───────────┘
             │                                  │
             └──────────────┬───────────────────┘
                            │
                ┌───────────▼───────────┐
                │  Shared Service Layer │
                │  (ReportingService,   │
                │   LedgerQuery, etc.)  │
                └───────────────────────┘
```

### 6.2 Legacy Route Implementation

```typescript
// legacy/routes.ts
import { Elysia } from 'elysia'
import { v1FinancialRoutes } from '../v1/routes' // reuse handler logic

export const legacyModule = new Elysia({ prefix: '/api/reports' })
  .use(companyScopeGuard({ allowHeaderFallback: true }))
  // Each legacy route wraps the v1 handler + injects deprecation headers
  .get('/profit-loss', async (ctx) => {
    const result = await v1ProfitLossHandler(ctx)
    ctx.set.headers['Deprecation'] = 'true'
    ctx.set.headers['Sunset'] = 'Sat, 01 Jan 2027 00:00:00 GMT'
    return result
  })
// ... mirror all 4 existing endpoints
// PLE routes do NOT have legacy counterparts
```

### 6.3 Version Header Contract

| Endpoint            | `X-API-Version` | `Deprecation` | `Sunset`                        |
| ------------------- | --------------- | ------------- | ------------------------------- |
| `/api/reports/*`    | absent          | `true`        | `Sat, 01 Jan 2027 00:00:00 GMT` |
| `/api/v1/reports/*` | `1`             | absent        | absent                          |

---

## 7. General Ledger Integration

### 7.1 Problem

Current report queries hit `invoices` and `bills` tables directly. The spec requires all reports to derive from the canonical General Ledger (`/api/ledger/general`).

### 7.2 Solution: LedgerQuery Facade

```typescript
// infrastructure/ledger-query.facade.ts

export interface LedgerQuery {
  /** Return all ledger entries for a company in a period, optionally filtered by account. */
  getEntries(filter: {
    companyId: string
    startDate: Date
    endDate: Date
    accountCode?: string
  }): Promise<LedgerEntry[]>

  /** Return account balances as of a date (for Balance Sheet, Trial Balance). */
  getAccountBalances(filter: {
    companyId: string
    asOfDate: Date
  }): Promise<AccountBalance[]>

  /** Return entries between companies in a consolidation group (for inter-company elimination). */
  getInterCompanyEntries(filter: {
    groupId: string
    startDate: Date
    endDate: Date
  }): Promise<InterCompanyEntry[]>

  /** Health check — is the ledger service reachable? */
  healthCheck(): Promise<boolean>
}
```

### 7.3 Implementations

**Primary: `LedgerApiClient`** — HTTP client to the existing `/api/ledger/general` and `/api/ledger/trial-balance` endpoints.

```typescript
class LedgerApiClient implements LedgerQuery {
  constructor(private baseUrl: string) {}

  async getEntries(filter) {
    const res = await fetch(`${this.baseUrl}/api/ledger/general`, {
      method: 'POST',
      body: JSON.stringify(filter),
    })
    if (!res.ok) throw new LedgerUnavailableError()
    return res.json()
  }
  // ...
}
```

**Fallback: `LedgerDbFallback`** — Direct DB query to `ledger_entries` table when API is unreachable. Used for degraded mode: returns 503 with `LEDGER_UNAVAILABLE` when both primary and fallback fail.

### 7.4 Migration Path

| Step | Action                                                                 | Risk                          |
| ---- | ---------------------------------------------------------------------- | ----------------------------- |
| 1    | Introduce `LedgerQuery` interface + `LedgerApiClient`                  | Low                           |
| 2    | Refactor P&L query to use `LedgerQuery.getEntries()`                   | Medium — verify output parity |
| 3    | Refactor Balance Sheet query to use `LedgerQuery.getAccountBalances()` | Medium                        |
| 4    | Refactor Cash Flow query                                               | Medium                        |
| 5    | Refactor Sales by Customer query                                       | Medium                        |
| 6    | Add Trial Balance query (new, ledger-native)                           | Low                           |
| 7    | Add General Ledger query (new, ledger-native)                          | Low                           |
| 8    | Remove direct invoice/bill queries from reports module                 | Low — after parity confirmed  |
| 9    | Add lint rule: no direct `invoices`/`bills` import in reports queries  | Low                           |

---

## 8. Multi-Company Consolidation

### 8.1 Approach

**Phase 1 scope:** Aggregate P&L and Balance Sheet across 2–4 RUCs with elimination of inter-company AR/AP only.

### 8.2 Consolidation Algorithm

```
For a consolidation group G = {RUC_A (parent), RUC_B, RUC_C}:

1. QUERY individual reports:
   - For each RUC in G: getProfitLoss(ruc, period) → PnL_ruc
   - For each RUC in G: getBalanceSheet(ruc, asOfDate) → BS_ruc

2. IDENTIFY inter-company entries:
   - Query ledger for entries where:
     accountCode ∈ AR_accounts (12*) AND counterpartyRuc ∈ G
     accountCode ∈ AP_accounts (42*) AND counterpartyRuc ∈ G
   - Group by (sourceRuc, targetRuc)

3. ELIMINATE:
   - For each inter-company pair (A, B):
     - Find matching AR on A ↔ AP on B
     - Subtract the matched amount from consolidated AR and AP totals
     - Create elimination audit entry in inter_company_eliminations

4. AGGREGATE:
   - Sum all non-eliminated P&L line items across RUCs
   - Sum all non-eliminated Balance Sheet items across RUCs

5. RETURN:
   - Consolidated P&L with metadata { consolidatedRucs, eliminationsApplied }
   - Consolidated Balance Sheet with metadata
```

### 8.3 Inter-Company Detection

The ledger module must tag entries with `counterparty_ruc` when the transaction involves another company. The detection uses:

1. **Invoice-based**: If an invoice's `customerId` maps to a `companies.ruc` in the same consolidation group → inter-company.
2. **Bill-based**: If a bill's `supplierId` maps to a `companies.ruc` in the same group → inter-company.
3. **Manual journal entries**: Require `counterparty_ruc` field on ledger entries for manual adjustments.

### 8.4 Feature Flag Behavior

```
MULTI_COMPANY_CONSOLIDATION = true:
  → /api/v1/reports/consolidated/* → functional
  → consolidation_groups CRUD → functional

MULTI_COMPANY_CONSOLIDATION = false:
  → /api/v1/reports/consolidated/* → 503 CONSOLIDATION_DISABLED
  → consolidation_groups endpoints → 503
```

---

## 9. Feature Flag Infrastructure

### 9.1 Flag Storage

Feature flags are stored in a configuration source accessible at runtime. The recommended approach:

**Primary**: Environment variables (12-factor) — `PLE_ENABLED=true`, `MULTI_COMPANY_CONSOLIDATION=false`, etc.
**Fallback**: Database table `feature_flags` for per-tenant overrides.

### 9.2 Flag Evaluator

```typescript
// infrastructure/feature-flags.ts

type FeatureFlag =
  | 'PLE_ENABLED'
  | 'MULTI_COMPANY_CONSOLIDATION'
  | 'BUDGET_ENABLED'
  | 'COST_CENTER_ENABLED'
  | 'EXPORT_ENABLED'
  | 'TEMPLATE_ENABLED'
  | 'SCHEDULER_ENABLED'

export function isFeatureEnabled(
  flag: FeatureFlag,
  tenantId?: string
): boolean {
  // 1. Check per-tenant override in DB (if tenantId provided)
  // 2. Fall back to environment variable
  // 3. Default: all flags default to false (spec requirement)
  const envValue = process.env[flag]
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1'
  }
  // DB check would go here for tenant-specific overrides
  return false
}
```

### 9.3 Flag Middleware

```typescript
// Elysia middleware wrapping each flag-gated route group
function requireFeatureFlag(flag: FeatureFlag) {
  return new Elysia().onBeforeHandle(({ set }) => {
    if (!isFeatureEnabled(flag)) {
      set.status = 503
      return {
        success: false,
        error: `${flag.replace('_ENABLED', '_DISABLED')}`,
        message: `Feature ${flag} is not available.`,
      }
    }
  })
}
```

---

## 10. Error Response Contract

### 10.1 Unified Error Shape

All `/api/v1/reports/*` responses follow:

```typescript
// Successful
{
  success: true,
  data: <report-data>,
  meta?: { consolidatedRucs?: string[], eliminationsApplied?: number, ... }
}

// Error
{
  success: false,
  error: "<ERROR_CODE>",
  code: "<ERROR_CODE>",        // Backward compat with existing ApiFailure
  message: "<human-readable>",
  details: [...]
}
```

### 10.2 Error Code Catalog

| Code                      | HTTP | Trigger                             |
| ------------------------- | ---- | ----------------------------------- |
| `COMPANY_NOT_IN_SCOPE`    | 403  | companyId outside tenant scope      |
| `LEDGER_UNAVAILABLE`      | 503  | Ledger service unreachable          |
| `PLE_DISABLED`            | 503  | `PLE_ENABLED=false`                 |
| `PLE_VALIDATION_FAILED`   | 422  | PLE structural validation fails     |
| `CONSOLIDATION_NOT_READY` | 422  | Missing ledger data for some RUCs   |
| `CONSOLIDATION_DISABLED`  | 503  | `MULTI_COMPANY_CONSOLIDATION=false` |
| `INVALID_PERIOD`          | 400  | Date range invalid                  |
| `VALIDATION_ERROR`        | 422  | Query/body validation failure       |
| `INTERNAL_ERROR`          | 500  | Unexpected error                    |

### 10.3 Response Helper

```typescript
// _internal/error-shapes.ts
export function reportError(
  code: string,
  message: string,
  details?: unknown,
  status?: number
): {
  success: false
  error: string
  code: string
  message: string
  details?: unknown
} {
  return {
    success: false,
    error: code,
    code,
    message,
    ...(details ? { details } : {}),
  }
}

// Usage in route handler:
if (!isFeatureEnabled('PLE_ENABLED')) {
  set.status = 503
  return reportError('PLE_DISABLED', 'PLE generation is not available.')
}
```

---

## 11. Phase 1 Implementation Sequence

### 11.1 Dependency Order

```
1. LedgerQuery interface + LedgerApiClient
       │
2. Feature flag infrastructure
       │
3. API versioning (v1 module + legacy module)
       │
4. Refactor 4 existing queries to LedgerQuery
       │
5. Trial Balance endpoint (new, v1 only)
6. General Ledger endpoint (new, v1 only)
       │
7. PLE formatters + validator + endpoints
       │
8. Multi-company consolidation engine + endpoints
```

### 11.2 File Changes Summary

| Action   | Files                                                          |
| -------- | -------------------------------------------------------------- |
| CREATE   | `v1/`, `v1/routes/`, `v1/schemas/` (12+ files)                 |
| CREATE   | `legacy/routes.ts`                                             |
| CREATE   | `application/services/ple-generator.service.ts`                |
| CREATE   | `application/services/ple-validator.service.ts`                |
| CREATE   | `application/services/consolidation.service.ts`                |
| CREATE   | `application/generators/ple-*.formatter.ts` (4 files)          |
| CREATE   | `domain/ple.types.ts`, `domain/consolidation.types.ts`         |
| CREATE   | `infrastructure/ledger-query.facade.ts`                        |
| CREATE   | `infrastructure/repositories/ple-generation.repo.ts`           |
| CREATE   | `infrastructure/repositories/consolidation-group.repo.ts`      |
| CREATE   | `infrastructure/feature-flags.ts`                              |
| CREATE   | `_internal/error-shapes.ts`, `_internal/api-version-header.ts` |
| CREATE   | DB migrations (4 new tables)                                   |
| REFACTOR | `routes.ts` → assembly of legacy + v1                          |
| REFACTOR | `queries/*.ts` → use LedgerQuery instead of direct DB          |
| REFACTOR | `reports.schemas.ts` → enhanced with new report types          |
| KEEP     | `_internal/money-utils.ts`, existing tests (update assertions) |

---

## 12. Phase 2 & 3 — Key Design Decisions (Preview)

### 12.1 Export PDF/XLSX

Reuse the ledger-mvp export pipeline (`apps/api/src/features/ledger-mvp/services/`). The existing `export/pdf` and `export/xlsx` infrastructure for General Ledger is extended to accept any `ReportData` type. Export endpoints:

```
POST /api/v1/reports/{reportType}/export/pdf
POST /api/v1/reports/{reportType}/export/xlsx
```

The export request body mirrors the GET query params; the same LedgerQuery reads data, then a format-specific renderer produces the binary.

### 12.2 Report Scheduler

A lightweight cron process (node-cron or a DB-poller) reads `report_schedules WHERE next_run_at <= now() AND is_active = true`. On trigger:

1. Generate report data via LedgerQuery.
2. Export to requested formats via export service.
3. Upload to storage (existing `StorageService`).
4. Email distribution via existing notification service.
5. POST to webhook if configured.
6. Log execution in `report_schedule_executions`.

### 12.3 Custom Report Builder

Templates are constrained JSON configs, not arbitrary SQL. The `TemplateEngine` validates:

- Max 50 columns
- Max 5-year date range
- Max 3 joins
- Account codes validated against PCGE

Execution compiles the template config into a parameterized LedgerQuery call. No dynamic SQL generation.

---

## 13. Risks & Mitigations

| Risk                                    | Severity | Mitigation                                                                                                           |
| --------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| PLE files rejected by SUNAT             | CRITICAL | Pre-validate with SUNAT PLE Validator (desktop tool) before release; generate test files against known-good examples |
| Ledger data not ready for consolidation | HIGH     | Feature flag `MULTI_COMPANY_CONSOLIDATION=false` by default; per-tenant opt-in when data is verified complete        |
| Legacy endpoint consumers break         | HIGH     | Legacy routes remain identical in response shape; only headers are added; monitoring on legacy usage before sunset   |
| Versioned endpoints add complexity      | MEDIUM   | Shared service layer means one implementation; versioning is a routing concern only                                  |
| PLE format changes by SUNAT             | MEDIUM   | Formatter is isolated; format version parameter enables format switching; monitor SUNAT normativa                    |

---

## 14. Rollback Plan

All Phase 1 features are gated by independent feature flags (default: `false`). To rollback:

1. Set flag to `false` → endpoints return 503 (no data loss, no broken consumers).
2. Legacy endpoints continue functioning independently of flags.
3. Revert migration: `ple_generations`, `consolidation_groups`, `consolidation_group_members`, `inter_company_eliminations` tables can be dropped without affecting existing invoices/bills data.

---

## 15. Success Criteria (Design Review)

- [ ] Architecture diagram is clear and maps to module structure
- [ ] PLE format matches SUNAT 5.1 specification (verified against SUNAT docs)
- [ ] API versioning preserves backward compatibility
- [ ] LedgerQuery facade decouples reports from direct DB access
- [ ] Consolidation algorithm correctly eliminates inter-company AR/AP
- [ ] Feature flags are independent and default to false
- [ ] Error contract is consistent across all Phase 1 endpoints
- [ ] Data models support all three phases without Phase 1 migration rework
- [ ] Migration path from current queries to ledger-backed queries is incremental
