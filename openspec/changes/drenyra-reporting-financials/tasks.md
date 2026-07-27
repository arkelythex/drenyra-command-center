# Reporting & Financial Statements — Implementation Tasks

**Change ID:** `drenyra-reporting-financials`
**Generated:** 2026-07-25
**Phase:** tasks (Phase 1 — Compliance & Foundation)

---

## Review Workload Forecast

| Field                   | Value                                   |
| ----------------------- | --------------------------------------- |
| Estimated changed lines | ~2750–3200 across Phase 1               |
| 400-line budget risk    | High                                    |
| Chained PRs recommended | Yes                                     |
| Suggested split         | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 |
| Delivery strategy       | auto-chain (from config)                |
| Chain strategy          | stacked-to-main                         |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

---

## Dependency Order (Phase 1)

```
PR 1: LedgerQuery + Feature Flags (Foundation)
   │
PR 2: API Versioning + Error Contracts + Legacy
   │
PR 3: Ledger-Backed Reports (refactor + new endpoints)
   │
PR 4: PLE Formatters + Validator + Domain Types
   │
PR 5: PLE Endpoints + Migrations + Validation Chain
   │
PR 6: Consolidation Engine + Endpoints + Migrations
   │
PR 7: Integration Tests + Contract Tests + Polish
```

---

## PR 1 — Foundation: LedgerQuery Facade + Feature Flags

**Estimated:** ~280 changed lines

### 1.1 Domain Types

- [ ] Create `apps/api/src/features/reports/domain/ledger-query.types.ts` with `LedgerEntry`, `AccountBalance`, `InterCompanyEntry` interfaces matching the design's `LedgerQuery` contract. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/domain/feature-flag.types.ts` with `FeatureFlag` union type and `FeatureFlagContext` type. <!-- sdd-owner: implementation -->

### 1.2 LedgerQuery Facade

- [ ] Create `apps/api/src/features/reports/infrastructure/ledger-query.facade.ts` with the `LedgerQuery` interface (`getEntries`, `getAccountBalances`, `getInterCompanyEntries`, `healthCheck`). <!-- sdd-owner: implementation -->
- [ ] Implement `LedgerApiClient` class: HTTP client calling `POST /api/ledger/general` and `POST /api/ledger/trial-balance`. Handle `!res.ok` throwing `LedgerUnavailableError`. <!-- sdd-owner: implementation -->
- [ ] Implement `LedgerDbFallback` class: direct DB query to `ledger_entries` table as degraded fallback when API is unreachable. <!-- sdd-owner: implementation -->
- [ ] Implement `LedgerQueryFactory`: returns `LedgerApiClient` normally, falls back to `LedgerDbFallback` on health check failure. Emits `LEDGER_UNAVAILABLE` when both fail. <!-- sdd-owner: implementation -->

### 1.3 Feature Flag Infrastructure

- [ ] Create `apps/api/src/features/reports/infrastructure/feature-flags.ts` with `isFeatureEnabled(flag, tenantId?)` function. Check env vars first, DB override second, default `false`. <!-- sdd-owner: implementation -->

### 1.4 Tests — Foundation

- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/ledger-query.facade.test.ts`: unit tests for `LedgerApiClient` (mocking fetch), `LedgerDbFallback` (mocking DB), `LedgerQueryFactory` fallback behavior. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/feature-flags.test.ts`: test env var resolution, tenant override, default-false behavior. <!-- sdd-owner: implementation -->

---

## PR 2 — API Versioning + Error Contracts + Legacy

**Estimated:** ~350 changed lines

### 2.1 Error Response Helpers

- [ ] Create `apps/api/src/features/reports/_internal/error-shapes.ts` with `reportError(code, message, details?, status?)` helper producing the `{ success: false, error, code, message, details? }` shape per design §10. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/_internal/api-version-header.ts` with `injectVersionHeader(set)` helper that adds `X-API-Version: 1` to Elysia response headers. <!-- sdd-owner: implementation -->

### 2.2 v1 Schemas

- [ ] Create `apps/api/src/features/reports/v1/schemas/reports.schemas.ts` — refactored from `reports.schemas.ts` with:
  - `ReportsDateRangeQuerySchema` (existing + `currency?` field, default `PEN`)
  - `ReportsAsOfDateQuerySchema` (existing)
  - `AccountCodeQuerySchema` (new: optional `accountCode` string)
  - `ProfitLossReportSchema`, `BalanceSheetReportSchema`, `CashFlowReportSchema`, `SalesByCustomerReportSchema` (migrated)
  - `TrialBalanceReportSchema` (new)
  - `GeneralLedgerReportSchema` (new) <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/schemas/index.ts` barrel exporting all schemas. <!-- sdd-owner: implementation -->

### 2.3 Legacy Module

- [ ] Create `apps/api/src/features/reports/legacy/routes.ts` — Elysia module at prefix `/api/reports` that wraps v1 handlers and injects `Deprecation: true` + `Sunset: Sat, 01 Jan 2027 00:00:00 GMT` headers on every response. Mirrors all 4 existing endpoints (profit-loss, balance-sheet, cash-flow, sales-by-customer). <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/legacy/index.ts` barrel. <!-- sdd-owner: implementation -->

### 2.4 Routes Assembly

- [ ] Refactor `apps/api/src/features/reports/routes.ts` from monolithic module into assembly of:
  - `legacyModule` (prefix `/api/reports`, from `./legacy/routes`)
  - `v1ReportsModule` (prefix `/api/v1/reports`, from `./v1/routes` — initially empty scaffolding) <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/index.ts` as empty scaffold barrel that will be populated in subsequent PRs. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/index.ts` barrel for the v1 module. <!-- sdd-owner: implementation -->

### 2.5 Feature Flag Middleware

- [ ] Add `requireFeatureFlag(flag)` Elysia middleware in `apps/api/src/features/reports/infrastructure/feature-flags.ts` that returns `503` with `{ error: "<FLAG>_DISABLED" }` when flag is off, per design §9.3. <!-- sdd-owner: implementation -->

### 2.6 Tests — Versioning

- [ ] Create `apps/api/src/features/reports/__tests__/integration/v1-versioning.integration.test.ts`: verify `/api/v1/reports/*` returns `X-API-Version: 1` header. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/__tests__/integration/legacy-deprecation.integration.test.ts`: verify `/api/reports/profit-loss` returns `Deprecation: true` and `Sunset` headers. <!-- sdd-owner: implementation -->
- [ ] Update `apps/api/src/features/reports/__tests__/integration/reports-routes.integration.test.ts` to test against legacy paths and verify response shape parity. <!-- sdd-owner: implementation -->

---

## PR 3 — Ledger-Backed Reports (Refactor + New Endpoints)

**Estimated:** ~420 changed lines

### 3.1 Refactor Existing Queries to LedgerQuery

- [ ] Refactor `apps/api/src/features/reports/application/queries/get-profit-loss.ts`: replace direct `invoices`/`bills` queries with `LedgerQuery.getEntries()` for revenue (Class 4) and expense (Class 6) account ranges. Verify output parity with existing tests. <!-- sdd-owner: implementation -->
- [ ] Refactor `apps/api/src/features/reports/application/queries/get-balance-sheet.ts`: replace direct `invoices`/`bills` queries with `LedgerQuery.getAccountBalances()` for asset (Class 1-3), liability (Class 4), and equity (Class 5) account ranges. <!-- sdd-owner: implementation -->
- [ ] Refactor `apps/api/src/features/reports/application/queries/get-cash-flow.ts`: replace direct queries with ledger-backed entries for operating/investing/financing classifications. <!-- sdd-owner: implementation -->
- [ ] Refactor `apps/api/src/features/reports/application/queries/get-sales-by-customer.ts`: replace direct `invoices` query with `LedgerQuery.getEntries()` filtered by revenue accounts, grouped by customer. <!-- sdd-owner: implementation -->

### 3.2 New Queries

- [ ] Create `apps/api/src/features/reports/application/queries/get-trial-balance.ts`: function `getTrialBalance(companyId, asOfDate)` using `LedgerQuery.getAccountBalances()`. Returns `{ asOfDate, accounts: [{ accountCode, accountName, debitBalance, creditBalance }] }`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/application/queries/get-general-ledger.ts`: function `getGeneralLedger(companyId, startDate, endDate, accountCode?)` using `LedgerQuery.getEntries()`. Returns `{ period, entries: [{ date, voucherNo, accountCode, description, debit, credit, balance }] }`. <!-- sdd-owner: implementation -->

### 3.3 v1 Financial Routes

- [ ] Create `apps/api/src/features/reports/v1/routes/profit-loss.routes.ts`: `GET /api/v1/reports/profit-loss` using refactored query, Zod validation, error contract, version header. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/balance-sheet.routes.ts`: `GET /api/v1/reports/balance-sheet`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/cash-flow.routes.ts`: `GET /api/v1/reports/cash-flow`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/sales-by-customer.routes.ts`: `GET /api/v1/reports/sales-by-customer`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/trial-balance.routes.ts`: `GET /api/v1/reports/trial-balance` with optional `accountCode` query param. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/general-ledger.routes.ts`: `GET /api/v1/reports/general-ledger` with optional `accountCode` query param. <!-- sdd-owner: implementation -->

### 3.4 v1 Routes Assembly

- [ ] Update `apps/api/src/features/reports/v1/routes/index.ts` to assemble all 6 financial route modules, apply `companyScopeGuard`, handle `LEDGER_UNAVAILABLE` errors returning 503. <!-- sdd-owner: implementation -->

### 3.5 Reporting Service Refactor

- [ ] Refactor `apps/api/src/features/reports/application/services/reporting.service.ts` to delegate to `LedgerQuery` instead of direct DB access. <!-- sdd-owner: implementation -->
- [ ] Update `apps/api/src/features/reports/_internal/default-instance.ts` `ReportsService` to include new queries (`getTrialBalance`, `getGeneralLedger`). <!-- sdd-owner: implementation -->

### 3.6 Tests — Refactored Reports

- [ ] Update `apps/api/src/features/reports/__tests__/integration/reports-routes.integration.test.ts` assertions to verify response shapes through v1 paths, not legacy paths. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/get-trial-balance.test.ts`: unit test with mocked `LedgerQuery`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/get-general-ledger.test.ts`: unit test with mocked `LedgerQuery`. <!-- sdd-owner: implementation -->

---

## PR 4 — PLE Formatters + Validator + Domain Types

**Estimated:** ~600 changed lines

### 4.1 PLE Domain Types

- [ ] Create `apps/api/src/features/reports/domain/ple.types.ts` with:
  - `PleBookType`: `'LE-DIARIO' | 'LE-MAYOR' | 'LE-COMPRAS' | 'LE-VENTAS'`
  - `PleGenerationStatus`: `'generated' | 'validated' | 'validation_failed' | 'filed'`
  - `PleDiarioRecord`, `PleMayorRecord`, `PleComprasRecord`, `PleVentasRecord` types matching the fixed-width field layouts in design §5
  - `PleGenerationResult`: `{ generationId, bookType, period, ruc, status, cdrHash?, downloadUrl?, fileSizeBytes? }` <!-- sdd-owner: implementation -->

### 4.2 PLE Schemas

- [ ] Create `apps/api/src/features/reports/v1/schemas/ple.schemas.ts` with:
  - `PleGenerationRequestSchema`: `z.object({ period: z.string().regex(/^\d{4}-\d{2}$/), ruc: z.string().length(11) })`
  - `PleGenerationResponseSchema`: matches `PleGenerationResult` <!-- sdd-owner: implementation -->

### 4.3 PLE Formatters (RED — write tests first)

- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/ple-diario.formatter.test.ts`: test that journal entries produce correct fixed-width lines per design §5.2 field layout. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/ple-mayor.formatter.test.ts`: test account-month aggregation per design §5.3. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/ple-compras.formatter.test.ts`: test purchase invoice records per design §5.4. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/ple-ventas.formatter.test.ts`: test sales invoice records per design §5.5. <!-- sdd-owner: implementation -->

### 4.4 PLE Formatters (GREEN)

- [ ] Create `apps/api/src/features/reports/application/generators/ple-diario.formatter.ts`: `formatDiario(entries: LedgerEntry[]): string` — converts ledger entries to fixed-width text lines per design §5.2. Each line is a `|`-delimited record with 21 fixed-width fields. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/application/generators/ple-mayor.formatter.ts`: `formatMayor(balances: AccountBalance[], period: string): string` — per design §5.3 layout. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/application/generators/ple-compras.formatter.ts`: `formatCompras(purchases: PurchaseEntry[]): string` — per design §5.4 layout. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/application/generators/ple-ventas.formatter.ts`: `formatVentas(sales: SalesEntry[]): string` — per design §5.5 layout. <!-- sdd-owner: implementation -->

### 4.5 PLE Validator

- [ ] Create `apps/api/src/features/reports/application/services/ple-validator.service.ts` with:
  - `validateStructural(content: string, bookType: PleBookType): ValidationResult` — checks field presence, field lengths per book type
  - `validateAccounting(content: string, bookType: PleBookType): ValidationResult` — debit/credit balance for Diario, period consistency
  - Returns `{ valid: boolean, errors: ValidationError[] }` with structured error details <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/ple-validator.service.test.ts`: test structural and accounting validators with valid/invalid fixtures. <!-- sdd-owner: implementation -->

### 4.6 PLE Generator Service

- [ ] Create `apps/api/src/features/reports/application/services/ple-generator.service.ts` with:
  - `generatePleBook(companyId, bookType, period, ruc): Promise<PleGenerationResult>`
  - Orchestrates: LedgerQuery → Formatter → Validator → CDR hash (SHA-256) → persist to `ple_generations`
  - Status transitions: `generated` → `validated` (on pass) or `validation_failed` (on fail)
  - Download gate: only `validated` records available for download <!-- sdd-owner: implementation -->

### 4.7 PLE CDR Hasher

- [ ] Add `computeCdrHash(content: string): string` to `ple-generator.service.ts` — SHA-256 of the full PLE text content, stored as `cdr_hash`. <!-- sdd-owner: implementation -->

---

## PR 5 — PLE Endpoints + Migrations + Validation Chain

**Estimated:** ~380 changed lines

### 5.1 Database Migration — PLE

- [ ] Create DB migration for `ple_generations` table per design §4.1.1 schema: columns, constraints (`ple_generations_book_period_ruc_uniq`), and indexes (`idx_ple_generations_company_book_period`, `idx_ple_generations_status`). <!-- sdd-owner: implementation -->
- [ ] Create DB migration for `report_generation_log` table per design §4.1.4 schema: columns and indexes (`idx_rgl_company_type`, `idx_rgl_generated_at`). <!-- sdd-owner: implementation -->

### 5.2 PLE Repository

- [ ] Create `apps/api/src/features/reports/infrastructure/repositories/ple-generation.repo.ts` with:
  - `createGeneration(data)`: insert new row, status `'generated'`
  - `updateStatus(id, status, cdrHash?, fileContent?, fileSizeBytes?)`: transition status
  - `findByCompanyBookPeriod(companyId, bookType, period)`: lookup existing generation
  - `findById(id)`: single lookup
  - `logReportGeneration(data)`: insert into `report_generation_log` <!-- sdd-owner: implementation -->

### 5.3 PLE Routes

- [ ] Create `apps/api/src/features/reports/v1/routes/ple/index.ts`: PLE sub-module assembly, all routes wrapped with `requireFeatureFlag('PLE_ENABLED')`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/ple/diario.routes.ts`: `POST /api/v1/reports/ple/diario` — accepts `{ period, ruc }`, calls `pleGeneratorService.generatePleBook('LE-DIARIO', ...)`, returns `PleGenerationResult`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/ple/mayor.routes.ts`: `POST /api/v1/reports/ple/mayor`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/ple/compras.routes.ts`: `POST /api/v1/reports/ple/compras`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/ple/ventas.routes.ts`: `POST /api/v1/reports/ple/ventas`. <!-- sdd-owner: implementation -->
- [ ] Add `GET /api/v1/reports/ple/download/:generationId` route in `ple/index.ts` — validates status is `'validated'` before returning file content; returns `422 PLE_VALIDATION_FAILED` if not validated. <!-- sdd-owner: implementation -->

### 5.4 PLE Validation Chain Registration

- [ ] Register `ple-validation` chain in the fiscal-compliance-pipeline:
  - Step 1: `ple-structural-validator` — checks fixed-width format
  - Step 2: `ple-accounting-validator` — debit/credit balance
  - Step 3: `ple-cdr-hasher` — SHA-256 + persist
  - Step 4: `ple-approval-gate` — status → `'validated'` on pass, `'validation_failed'` on fail <!-- sdd-owner: implementation -->

### 5.5 v1 Routes Assembly Update

- [ ] Update `apps/api/src/features/reports/v1/routes/index.ts` to include `pleModule` from `./ple/index.ts`. <!-- sdd-owner: implementation -->

### 5.6 Tests — PLE Endpoints

- [ ] Create `apps/api/src/features/reports/v1/__tests__/integration/ple-routes.integration.test.ts`: integration tests for all 4 PLE POST endpoints + download gate + validation failure case. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/contracts/ple-format.contract.test.ts`: contract tests verifying PLE output format matches SUNAT 5.1 field positions and lengths using known-good fixtures. <!-- sdd-owner: implementation -->

---

## PR 6 — Multi-Company Consolidation

**Estimated:** ~420 changed lines

### 6.1 Consolidation Domain Types

- [ ] Create `apps/api/src/features/reports/domain/consolidation.types.ts` with:
  - `ConsolidationGroup`: `{ id, groupName, parentCompanyId, tenantId, members: GroupMember[] }`
  - `GroupMember`: `{ companyId, role: 'parent' | 'member', ruc }`
  - `EliminationEntry`: `{ sourceCompanyId, targetCompanyId, accountCode, amountCents, period }`
  - `ConsolidatedReport<T>`: `{ data: T, meta: { consolidatedRucs, eliminationsApplied } }` <!-- sdd-owner: implementation -->

### 6.2 Consolidation Schemas

- [ ] Create `apps/api/src/features/reports/v1/schemas/consolidated.schemas.ts` with:
  - `ConsolidatedReportQuerySchema`: `z.object({ groupId: z.string().uuid(), ...DateRangeFields })`
  - `ConsolidatedBalanceSheetQuerySchema`: `z.object({ groupId: z.string().uuid(), asOfDate: z.coerce.date() })` <!-- sdd-owner: implementation -->

### 6.3 Database Migrations — Consolidation

- [ ] Create DB migration for `consolidation_groups` table per design §4.1.2. <!-- sdd-owner: implementation -->
- [ ] Create DB migration for `consolidation_group_members` table per design §4.1.2 (with indexes). <!-- sdd-owner: implementation -->
- [ ] Create DB migration for `inter_company_eliminations` table per design §4.1.3. <!-- sdd-owner: implementation -->

### 6.4 Repositories

- [ ] Create `apps/api/src/features/reports/infrastructure/repositories/consolidation-group.repo.ts` with CRUD for `consolidation_groups` and `consolidation_group_members`. <!-- sdd-owner: implementation -->

### 6.5 Consolidation Engine

- [ ] Create `apps/api/src/features/reports/application/services/consolidation.service.ts` with:
  - `consolidateProfitLoss(groupId, startDate, endDate): Promise<ConsolidatedReport<ProfitLossReport>>`
  - `consolidateBalanceSheet(groupId, asOfDate): Promise<ConsolidatedReport<BalanceSheetReport>>`
  - Algorithm per design §8.2:
    1. Query individual reports for each RUC in group
    2. Detect inter-company entries via `LedgerQuery.getInterCompanyEntries()`
    3. Match AR on source ↔ AP on target, subtract matched amounts
    4. Create elimination audit entries in `inter_company_eliminations`
    5. Aggregate non-eliminated line items
    6. Return consolidated report with metadata <!-- sdd-owner: implementation -->
- [ ] Implement `detectInterCompanyEntries(groupId, startDate, endDate)` helper using:
  - Invoice-based: `customerId` → `companies.ruc` in group → inter-company
  - Bill-based: `supplierId` → `companies.ruc` in group → inter-company
  - Manual journal entries: `counterparty_ruc` field on ledger entries <!-- sdd-owner: implementation -->

### 6.6 Consolidated Routes

- [ ] Create `apps/api/src/features/reports/v1/routes/consolidated/index.ts`: sub-module wrapped with `requireFeatureFlag('MULTI_COMPANY_CONSOLIDATION')`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/consolidated/profit-loss.routes.ts`: `GET /api/v1/reports/consolidated/profit-loss` — validates all RUCs have ledger data, returns `422 CONSOLIDATION_NOT_READY` with `missingRucs` if not. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/routes/consolidated/balance-sheet.routes.ts`: `GET /api/v1/reports/consolidated/balance-sheet`. <!-- sdd-owner: implementation -->

### 6.7 v1 Routes Assembly Update

- [ ] Update `apps/api/src/features/reports/v1/routes/index.ts` to include `consolidatedModule`. <!-- sdd-owner: implementation -->

### 6.8 Tests — Consolidation

- [ ] Create `apps/api/src/features/reports/v1/__tests__/unit/consolidation.service.test.ts`: unit tests for inter-company detection, elimination logic, and aggregation with mocked LedgerQuery. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/integration/consolidation.integration.test.ts`: integration tests with 2-3 RUC group, AR/AP elimination verification, missing data → `CONSOLIDATION_NOT_READY`. <!-- sdd-owner: implementation -->

---

## PR 7 — Integration Tests + Contract Tests + Polish

**Estimated:** ~350 changed lines

### 7.1 End-to-End Contract Tests

- [ ] Create `apps/api/src/features/reports/v1/__tests__/contracts/v1-error-contract.contract.test.ts`: verify all error codes from design §10.2 return correct HTTP statuses and consistent `{ success, error, code, message }` shape. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/reports/v1/__tests__/contracts/v1-feature-flag.contract.test.ts`: verify each feature flag independently gates its endpoints with 503 when `false`, does NOT affect other endpoints. <!-- sdd-owner: implementation -->

### 7.2 Tenant Isolation Tests

- [ ] Create `apps/api/src/features/reports/v1/__tests__/integration/tenant-isolation.integration.test.ts`: verify `companyScopeGuard` enforces RUC isolation on all v1 endpoints; consolidated endpoints validate all RUCs belong to same tenant. <!-- sdd-owner: implementation -->

### 7.3 Legacy Sunset Monitoring

- [ ] Add `x-legacy-usage` logging in `apps/api/src/features/reports/legacy/routes.ts` to track legacy endpoint consumption before 2027-01-01 sunset. <!-- sdd-owner: implementation -->

### 7.4 Index Exports + Barrel Updates

- [ ] Update `apps/api/src/features/reports/index.ts` barrel to export new domain types, services, v1 module alongside existing exports. <!-- sdd-owner: implementation -->
- [ ] Update `apps/api/src/api-module-surface.ts` to register the refactored `reportsModule` (now assembly of legacy + v1). <!-- sdd-owner: implementation -->

### 7.5 Final Verification

- [ ] Run full test suite: `pnpm test --filter @drenyra/api` and verify no regressions in existing reports tests. <!-- sdd-owner: implementation -->
- [ ] Verify all 7 feature flags default to `false` and endpoints return 503 when corresponding flag is off. <!-- sdd-owner: implementation -->
- [ ] Verify legacy endpoints return deprecation headers and identical response bodies to v1 endpoints. <!-- sdd-owner: implementation -->

---

## Phase 2 — Planning & Analysis (Future)

> **Note:** Do NOT implement until Phase 1 is deployed and verified.
> Phase 2 tasks are included as a forecast for dependency-aware planning.

| Task Group                                                            | Est. Lines |
| --------------------------------------------------------------------- | ---------- |
| Budget CRUD + budget-vs-actual endpoint                               | ~350       |
| Cost Center CRUD + P&L/Trial Balance cost center filtering            | ~300       |
| Export PDF/XLSX (5 report types × 2 formats) reusing ledger-mvp infra | ~400       |
| Phase 2 tests (unit + integration)                                    | ~300       |

---

## Phase 3 — Self-Service & Automation (Future)

> **Note:** Do NOT implement until Phase 2 is deployed and verified.

| Task Group                                                | Est. Lines |
| --------------------------------------------------------- | ---------- |
| Report Template CRUD + template execution engine          | ~450       |
| Template complexity limiter + validation                  | ~200       |
| Report Scheduler CRUD + cron trigger + email distribution | ~450       |
| Webhook distributor                                       | ~150       |
| Phase 3 tests (unit + integration)                        | ~350       |

---

## Verification Checklist (Parent-Phase)

- [ ] All Phase 1 PRs merged to main in dependency order. <!-- sdd-owner: parent -->
- [ ] Integration test suite passes in CI. <!-- sdd-owner: parent -->
- [ ] PLE format validated against SUNAT PLE Validator (desktop tool). <!-- sdd-owner: parent -->
- [ ] Legacy endpoint monitoring confirms no unexpected breakage. <!-- sdd-owner: parent -->
- [ ] Feature flags tested independently: toggling one does not affect others. <!-- sdd-owner: parent -->
- [ ] Run `sdd-verify drenyra-reporting-financials` against spec. <!-- sdd-owner: parent -->
