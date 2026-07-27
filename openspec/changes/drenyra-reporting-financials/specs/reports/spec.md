# Reports & Financial Statements Specification

**Change ID:** `drenyra-reporting-financials`
**Domain:** `reports`
**Created:** 2026-07-25
**Phases:** 3

---

## Purpose

Elevate the Drenyra Reports module from PEN-only baseline aggregation to a full financial statements platform. Deliver compliance-grade electronic books (PLE), canonical General Ledger-backed reporting, multi-company consolidation, budget vs actual analysis, cost center reporting, exportable reports, a custom report builder, and scheduled report distribution — all served through a versioned API surface that preserves existing consumers.

---

## Phase 1 — Compliance & Foundation

### Requirement: PLE — Programa de Libros Electrónicos (REQ-RPT-PLE)

The system MUST generate the four SUNAT-mandated electronic books in a valid structure accepted by SUNAT PLE validation.

**Format:** The system SHALL generate PLE books in SUNAT formato 5.1 (txt estructurado de ancho fijo) as the authoritative output. If SUNAT migrates to XML/XSD during the initiative, the format decision SHALL be confirmed against the normativa vigente before Phase 1 implementation starts.

**Books:**

| Book | Content | SUNAT Code |
|------|---------|------------|
| Libro Diario | Journal entries with account, debit, credit, GL code, period | LE-DIARIO |
| Libro Mayor | Account → monthly accumulated movements with opening/closing balances | LE-MAYOR |
| Registro de Compras | Received invoices with IGV, detracciones, retenciones, supplier RUC | LE-COMPRAS |
| Registro de Ventas | Issued invoices with IGV, SUNAT series, customer RUC | LE-VENTAS |

The system MUST store each PLE generation with CDR hash, SUNAT response code, generation timestamp, period, and RUC in `ple_generations`. A compliance chain `ple-validation` SHALL gate download availability: only files that pass structural validation may be downloaded.

The system MUST support a feature flag `PLE_ENABLED`. When `false`, PLE endpoints return `503 Service Unavailable` without affecting other reports endpoints.

#### Scenario: Generate Libro Diario for a fiscal period

- GIVEN a company with RUC `20123456789` and ledger data for period `2026-06`
- WHEN a POST to `/api/v1/reports/ple/diario` with `{ "period": "2026-06", "ruc": "20123456789" }` is issued
- THEN the system generates a SUNAT formato 5.1 txt file with all journal entries for that period
- AND the response includes `{ "generationId": "<uuid>", "status": "validated", "cdrHash": "<sha256>", "downloadUrl": "<url>" }`

#### Scenario: PLE validation gate blocks invalid file download

- GIVEN a PLE generation that fails structural validation (e.g., missing required fields)
- WHEN a GET to the download URL is issued
- THEN the system returns `422 Unprocessable Entity` with `{ "error": "PLE_VALIDATION_FAILED", "details": ["field X missing in entry Y"] }`
- AND the generation record status is `validation_failed`

#### Scenario: PLE feature flag off

- GIVEN feature flag `PLE_ENABLED=false`
- WHEN any PLE endpoint is called
- THEN the system returns `503 Service Unavailable` with `{ "error": "PLE_DISABLED" }`
- AND other `/api/v1/reports/*` endpoints continue to function normally

#### Scenario: Registro de Compras includes IGV breakdown

- GIVEN purchase invoices received in period `2026-06` with IGV, detracciones, and retenciones data
- WHEN PLE Registro de Compras is generated
- THEN each row includes: supplier RUC, invoice series/number, taxable base, IGV amount, detracción amount, retención amount, total

#### Scenario: Registro de Ventas includes SUNAT series

- GIVEN issued invoices in period `2026-06` with SUNAT-authorized series
- WHEN PLE Registro de Ventas is generated
- THEN each row includes: customer RUC, invoice series/number, taxable base, IGV amount, total

---

### Requirement: API Versioning (REQ-RPT-VER)

The system MUST serve all reports endpoints under the versioned prefix `/api/v1/reports/*`. Legacy endpoints at `/api/reports/*` MUST remain functional and SHALL emit a `Sunset: Sat, 01 Jan 2027 00:00:00 GMT` response header along with a `Deprecation: true` header.

**API Contracts (Phase 1):**

| Method | Path | Purpose | Query Params |
|--------|------|---------|-------------|
| GET | `/api/v1/reports/profit-loss` | Profit & Loss statement | `companyId`, `startDate`, `endDate`, `currency` (default PEN) |
| GET | `/api/v1/reports/balance-sheet` | Balance Sheet | `companyId`, `asOfDate` |
| GET | `/api/v1/reports/cash-flow` | Cash Flow statement | `companyId`, `startDate`, `endDate` |
| GET | `/api/v1/reports/sales-by-customer` | Sales by Customer | `companyId`, `startDate`, `endDate` |
| GET | `/api/v1/reports/trial-balance` | Trial Balance | `companyId`, `asOfDate` |
| GET | `/api/v1/reports/general-ledger` | General Ledger detail | `companyId`, `startDate`, `endDate`, `accountCode?` |
| POST | `/api/v1/reports/ple/diario` | Generate PLE Libro Diario | body: `{ period, ruc }` |
| POST | `/api/v1/reports/ple/mayor` | Generate PLE Libro Mayor | body: `{ period, ruc }` |
| POST | `/api/v1/reports/ple/compras` | Generate PLE Registro de Compras | body: `{ period, ruc }` |
| POST | `/api/v1/reports/ple/ventas` | Generate PLE Registro de Ventas | body: `{ period, ruc }` |
| GET | `/api/v1/reports/consolidated/profit-loss` | Consolidated P&L | `groupId`, `startDate`, `endDate` |
| GET | `/api/v1/reports/consolidated/balance-sheet` | Consolidated Balance Sheet | `groupId`, `asOfDate` |

All `/api/v1/reports/*` endpoints SHALL return consistent error shapes: `{ "error": "<ERROR_CODE>", "message": "<human-readable>", "details": [...] }`.

All v1 responses SHALL include a `X-API-Version: 1` response header.

#### Scenario: v1 endpoint serves P&L

- GIVEN a valid `companyId` and date range
- WHEN a GET to `/api/v1/reports/profit-loss?companyId=X&startDate=2026-01-01&endDate=2026-06-30` is issued
- THEN the system returns a P&L report with revenue, expenses, and net income segments
- AND the response includes header `X-API-Version: 1`
- AND the response does NOT include `Deprecation` or `Sunset` headers

#### Scenario: Legacy endpoint returns deprecation warning

- GIVEN the same request to `/api/reports/profit-loss?companyId=X&startDate=2026-01-01&endDate=2026-06-30`
- WHEN the response is returned
- THEN the response body is identical to the v1 response
- AND the response includes headers `Deprecation: true` and `Sunset: Sat, 01 Jan 2027 00:00:00 GMT`

#### Scenario: v1 error shape is consistent

- GIVEN an invalid `companyId` that does not belong to the authenticated tenant
- WHEN any `/api/v1/reports/*` endpoint is called
- THEN the system returns `403 Forbidden` with `{ "error": "COMPANY_NOT_IN_SCOPE", "message": "...", "details": [] }`

---

### Requirement: General Ledger as Canonical Source (REQ-RPT-06)

The system MUST use the General Ledger (`/api/ledger/general`) as the canonical data source for all financial reports. Reports SHALL NOT query invoices, bills, or transactions directly. The ledger layer SHALL resolve all accounting entries into a unified representation consumed by Profit & Loss, Balance Sheet, Cash Flow, Trial Balance, and Sales by Customer.

The system MUST migrate existing P&L, Balance Sheet, Cash Flow, and Sales by Customer endpoints to read from the ledger. Direct invoice/bill aggregation logic SHALL be removed from the reports module.

#### Scenario: P&L reads from ledger

- GIVEN ledger entries exist for revenue and expense accounts in period `2026-06`
- WHEN `/api/v1/reports/profit-loss` is called
- THEN the returned revenue and expense figures match a direct query to `/api/ledger/general` for the same accounts and period

#### Scenario: Reports module no longer queries invoices directly

- GIVEN the reports module codebase
- WHEN a code review or lint rule inspects report query paths
- THEN no report query resolves against `invoices`, `bills`, or `transactions` tables directly
- AND all report data flows through the ledger query interface

#### Scenario: Ledger unavailable — report degrades gracefully

- GIVEN the ledger service is temporarily unavailable
- WHEN any `/api/v1/reports/*` endpoint is called
- THEN the system returns `503 Service Unavailable` with `{ "error": "LEDGER_UNAVAILABLE", "message": "General Ledger service is not reachable. Try again later." }`

---

### Requirement: Multi-Company Consolidation (REQ-RPT-08)

The system MUST support consolidated financial reports for company groups of 2–4 RUCs. Consolidation SHALL eliminate inter-company transactions (accounts receivable/payable between group members) and produce unified Profit & Loss and Balance Sheet statements.

The system MUST support a feature flag `MULTI_COMPANY_CONSOLIDATION`. When `false`, consolidated endpoints return `503 Service Unavailable`. When ledger data for a group member is incomplete, the endpoint SHALL return `422 Unprocessable Entity` with `{ "error": "CONSOLIDATION_NOT_READY", "missingRucs": ["..."] }`.

**Consolidation Group:** A group SHALL be defined as a set of RUCs with a designated parent. Inter-company elimination SHALL cover accounts receivable/payable between any two RUCs within the group. Revenue/expense elimination between group members is deferred to a follow-up.

#### Scenario: Consolidated P&L for 3-RUC group

- GIVEN a consolidation group with RUCs A (parent), B, and C, all with complete ledger data for `2026-06`
- WHEN `/api/v1/reports/consolidated/profit-loss?groupId=G1&startDate=2026-01-01&endDate=2026-06-30` is called
- THEN the returned P&L aggregates revenue and expenses across all three RUCs
- AND inter-company AR/AP between (A,B), (A,C), and (B,C) is eliminated from the totals
- AND the response metadata includes `{ "consolidatedRucs": ["A", "B", "C"], "eliminationsApplied": N }`

#### Scenario: Consolidated Balance Sheet with inter-company elimination

- GIVEN RUC A owes RUC B S/ 50,000 (accounts payable on A, accounts receivable on B)
- WHEN consolidated Balance Sheet is generated for the group
- THEN the consolidated AR and AP do NOT include the S/ 50,000 inter-company balance

#### Scenario: Consolidation not ready — missing data

- GIVEN a consolidation group of 3 RUCs where RUC C has no ledger data for the requested period
- WHEN a consolidated report is requested
- THEN the system returns `422 Unprocessable Entity` with `{ "error": "CONSOLIDATION_NOT_READY", "missingRucs": ["C"] }`

#### Scenario: Feature flag off

- GIVEN `MULTI_COMPANY_CONSOLIDATION=false`
- WHEN any `/api/v1/reports/consolidated/*` endpoint is called
- THEN the system returns `503 Service Unavailable` with `{ "error": "CONSOLIDATION_DISABLED" }`

---

## Phase 2 — Planning & Analysis

### Requirement: Budget vs Actual (REQ-RPT-10)

The system MUST support creation, update, and deletion of budgets (annual and monthly granularity, per account). The system MUST expose a Budget vs Actual comparison endpoint that compares budgeted amounts against realized ledger entries for the same account and period, returning both absolute and percentage variance.

**Budget CRUD API:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/budgets` | Create a budget entry |
| GET | `/api/v1/budgets` | List budgets (filter: `companyId`, `year`, `accountCode?`) |
| GET | `/api/v1/budgets/{id}` | Get a single budget |
| PUT | `/api/v1/budgets/{id}` | Update a budget |
| DELETE | `/api/v1/budgets/{id}` | Delete a budget |
| GET | `/api/v1/reports/budget-vs-actual` | Budget vs Actual comparison |

**Budget model:** `{ id, companyId, accountCode, year, month? (null = annual), amount, currency (default PEN), createdAt, updatedAt }`.

**Budget vs Actual response:** `{ period, accountCode, budgetedAmount, actualAmount, varianceAmount, variancePercent, currency }`.

#### Scenario: Create annual budget for an account

- GIVEN a valid `companyId` and account code `601000` (Gastos de personal)
- WHEN a POST to `/api/v1/budgets` with `{ "companyId": "X", "accountCode": "601000", "year": 2026, "amount": 120000, "currency": "PEN" }` is issued
- THEN the system creates the budget and returns `201 Created` with the budget object including an `id`

#### Scenario: Budget vs Actual comparison

- GIVEN an annual budget of S/ 120,000 for account `601000` in 2026, and actual ledger entries totaling S/ 97,500 for the same account Jan–Jun 2026
- WHEN `/api/v1/reports/budget-vs-actual?companyId=X&accountCode=601000&year=2026&startMonth=1&endMonth=6` is called
- THEN the response includes `{ "budgetedAmount": 120000, "actualAmount": 97500, "varianceAmount": -22500, "variancePercent": -18.75 }`

#### Scenario: Monthly budget granularity

- GIVEN monthly budgets for account `601000`: Jan=S/10,000, Feb=S/10,000, Mar=S/10,000
- WHEN budget vs actual is queried for March only
- THEN the comparison uses the March budget of S/ 10,000, not the annual total

#### Scenario: Budget feature flag off

- GIVEN feature flag `BUDGET_ENABLED=false`
- WHEN any `/api/v1/budgets/*` or `/api/v1/reports/budget-vs-actual` endpoint is called
- THEN the system returns `503 Service Unavailable` with `{ "error": "BUDGET_DISABLED" }`

---

### Requirement: Cost Center / Profit Center Reporting (REQ-RPT-07)

The system MUST support assigning transactions to cost centers and profit centers. Reports (P&L and Trial Balance) SHALL be filterable and groupable by cost center. The system MUST support a flat cost center hierarchy (tag-based) as the initial implementation.

**API additions:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/cost-centers` | Create a cost center |
| GET | `/api/v1/cost-centers` | List cost centers for a company |
| PUT | `/api/v1/cost-centers/{id}` | Update a cost center |
| DELETE | `/api/v1/cost-centers/{id}` | Delete (soft) a cost center |

**Cost Center model:** `{ id, companyId, code, name, type: "cost" | "profit", active, createdAt, updatedAt }`.

Existing P&L and Trial Balance endpoints SHALL accept an optional query parameter `costCenterId` for filtering and `groupBy=costCenter` for grouped output.

#### Scenario: Filter P&L by cost center

- GIVEN transactions are tagged with cost centers `CC-ADMIN` and `CC-VENTAS`
- WHEN `/api/v1/reports/profit-loss?companyId=X&startDate=2026-01-01&endDate=2026-06-30&costCenterId=CC-ADMIN` is called
- THEN only transactions tagged with `CC-ADMIN` are included in the P&L totals

#### Scenario: Group Trial Balance by cost center

- GIVEN transactions tagged across multiple cost centers
- WHEN `/api/v1/reports/trial-balance?companyId=X&asOfDate=2026-06-30&groupBy=costCenter` is called
- THEN the response contains per-cost-center subtotals in addition to the consolidated trial balance

#### Scenario: Unassigned transactions visible

- GIVEN some transactions have no cost center assignment
- WHEN a P&L with no `costCenterId` filter is requested
- THEN all transactions (assigned and unassigned) are included
- AND the response metadata includes `{ "unassignedCount": N }`

#### Scenario: Cost Center feature flag off

- GIVEN feature flag `COST_CENTER_ENABLED=false`
- WHEN cost center endpoints are called
- THEN the system returns `503 Service Unavailable`
- AND P&L/Trial Balance endpoints ignore `costCenterId` and `groupBy=costCenter` parameters (no error, parameters are silently dropped)

---

### Requirement: Exportable Reports PDF/XLSX (REQ-RPT-13)

The system MUST support exporting any report (P&L, Balance Sheet, Cash Flow, Sales by Customer, Trial Balance) in both PDF and XLSX formats. Export infrastructure SHALL reuse the existing ledger-mvp export pipeline extended to the reports domain.

**Export API:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/reports/{reportType}/export/pdf` | Export a report as PDF |
| POST | `/api/v1/reports/{reportType}/export/xlsx` | Export a report as XLSX |

Where `{reportType}` is one of: `profit-loss`, `balance-sheet`, `cash-flow`, `sales-by-customer`, `trial-balance`.

Export request body SHALL mirror the corresponding GET endpoint's query parameters. The response SHALL be the binary file with appropriate `Content-Type` (`application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) and `Content-Disposition: attachment; filename="..."`.

#### Scenario: Export P&L as PDF

- GIVEN a P&L report for company X, Jan–Jun 2026
- WHEN a POST to `/api/v1/reports/profit-loss/export/pdf` with `{ "companyId": "X", "startDate": "2026-01-01", "endDate": "2026-06-30" }` is issued
- THEN the response is a PDF with `Content-Type: application/pdf`
- AND the PDF contains a formatted Profit & Loss statement with company name, period, and all line items

#### Scenario: Export Balance Sheet as XLSX

- GIVEN a Balance Sheet for company X as of `2026-06-30`
- WHEN a POST to `/api/v1/reports/balance-sheet/export/xlsx` is issued
- THEN the response is an XLSX workbook with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- AND the workbook contains assets, liabilities, and equity on structured sheets

#### Scenario: Export endpoint respects same filters as GET endpoint

- GIVEN a Trial Balance filtered by `costCenterId=CC-ADMIN`
- WHEN the export XLSX is requested with the same `costCenterId` parameter
- THEN the exported file contains only the cost-center-filtered data

#### Scenario: Export feature flag off

- GIVEN feature flag `EXPORT_ENABLED=false`
- WHEN any export endpoint is called
- THEN the system returns `503 Service Unavailable` with `{ "error": "EXPORT_DISABLED" }`

---

## Phase 3 — Self-Service & Automation

### Requirement: Custom Report Builder (REQ-RPT-15)

The system MUST provide a guided wizard for non-technical users to create custom reports by selecting accounts, periods, cost centers, and format (tabular, P&L-style, or comparative). Created reports SHALL be saveable as templates and shareable within the same company/firm.

The query builder SHALL be constrained: no arbitrary SQL; templates pre-define columns and filters. Generated queries SHALL pass through a typed query builder with complexity limits (max joins, max columns, max date range) to prevent DB overload.

**Custom Report Builder API:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/report-templates` | Create a report template |
| GET | `/api/v1/report-templates` | List templates (filter: `companyId`) |
| GET | `/api/v1/report-templates/{id}` | Get a single template |
| PUT | `/api/v1/report-templates/{id}` | Update a template |
| DELETE | `/api/v1/report-templates/{id}` | Delete a template |
| POST | `/api/v1/report-templates/{id}/execute` | Execute a template and return the report data |
| POST | `/api/v1/report-templates/{id}/export/{pdf|xlsx}` | Execute and export |

**Template model:** `{ id, companyId, name, description, format: "tabular" | "pnl-style" | "comparative", config: { accounts: [...], costCenterIds: [...], periodType: "monthly" | "quarterly" | "annual" | "custom", columns: [...], groupBy?: "account" | "costCenter" }, sharedWithFirm: boolean, createdAt, updatedAt }`.

#### Scenario: Create a custom tabular report

- GIVEN a logged-in user with access to company X
- WHEN a POST to `/api/v1/report-templates` with `{ "companyId": "X", "name": "Gastos Administrativos Q1", "format": "tabular", "config": { "accounts": ["601000","602000","603000"], "costCenterIds": ["CC-ADMIN"], "periodType": "custom", "startDate": "2026-01-01", "endDate": "2026-03-31", "columns": ["accountCode","accountName","debit","credit","balance"] } }` is issued
- THEN the template is created and returned with `201 Created`
- AND executing it returns the filtered, formatted data

#### Scenario: Template execution returns consistent report shape

- GIVEN a saved template with format `tabular`
- WHEN `POST /api/v1/report-templates/{id}/execute` is called
- THEN the response includes `{ "templateId": "...", "generatedAt": "...", "columns": [...], "rows": [...] }`

#### Scenario: Complexity limits enforced

- GIVEN a template configuration that requests more than 50 columns or more than a 5-year date range
- WHEN the template is created or executed
- THEN the system returns `422 Unprocessable Entity` with `{ "error": "TEMPLATE_TOO_COMPLEX", "message": "...", "limits": { "maxColumns": 50, "maxPeriodYears": 5 } }`

#### Scenario: Template shared within firm

- GIVEN a template with `sharedWithFirm: true` created by user in company X
- WHEN a user in company Y (same firm) lists templates
- THEN the shared template is visible and executable (data scoped to company Y's own records)

---

### Requirement: Report Scheduler & Distribution (REQ-RPT-14)

The system MUST support scheduling reports for automatic generation on a recurring basis (daily, weekly, monthly). Generated reports SHALL be distributed via email with PDF/XLSX attachments and via webhook for integrations.

**Scheduler API:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/report-schedules` | Create a schedule |
| GET | `/api/v1/report-schedules` | List schedules (filter: `companyId`) |
| GET | `/api/v1/report-schedules/{id}` | Get a single schedule |
| PUT | `/api/v1/report-schedules/{id}` | Update a schedule |
| DELETE | `/api/v1/report-schedules/{id}` | Delete a schedule |
| GET | `/api/v1/report-schedules/{id}/history` | Generation log for a schedule |

**Schedule model:** `{ id, companyId, reportType: "profit-loss" | "balance-sheet" | "cash-flow" | "sales-by-customer" | "trial-balance" | "template", templateId?, reportParams: {...}, frequency: "daily" | "weekly" | "monthly", dayOfWeek?, dayOfMonth?, time: "HH:MM", timezone, formats: ["pdf" | "xlsx"], recipients: [{ email, name }], webhookUrl?, active, lastRunAt?, nextRunAt, createdAt, updatedAt }`.

**Generation log entry:** `{ id, scheduleId, status: "success" | "failed", startedAt, completedAt, fileUrls?: { pdf?, xlsx? }, errorMessage?, emailSentAt? }`.

#### Scenario: Schedule monthly Balance Sheet

- GIVEN a logged-in user with access to company X
- WHEN a POST to `/api/v1/report-schedules` with `{ "companyId": "X", "reportType": "balance-sheet", "reportParams": { "asOfDate": "LAST_DAY_OF_MONTH" }, "frequency": "monthly", "dayOfMonth": 1, "time": "08:00", "timezone": "America/Lima", "formats": ["pdf", "xlsx"], "recipients": [{ "email": "contador@empresa.pe", "name": "Contador Principal" }] }` is issued
- THEN the schedule is created with `nextRunAt` set to the next 1st of the month at 08:00 Lima time
- AND on execution, the Balance Sheet is generated in PDF and XLSX and emailed to the recipient

#### Scenario: Schedule execution logs success

- GIVEN a schedule executes successfully
- WHEN `/api/v1/report-schedules/{id}/history` is queried
- THEN the log shows `status: "success"` with `fileUrls`, `startedAt`, `completedAt`, and `emailSentAt`

#### Scenario: Schedule execution logs failure

- GIVEN a schedule execution fails (e.g., ledger unavailable)
- WHEN the history is queried
- THEN the log shows `status: "failed"` with `errorMessage` and `startedAt`/`completedAt`
- AND the schedule's `nextRunAt` advances to the next period normally

#### Scenario: Webhook distribution on generation

- GIVEN a schedule with a `webhookUrl` configured
- WHEN the report generation completes successfully
- THEN the system POSTs to the webhook URL with `{ "scheduleId": "...", "reportType": "...", "generatedAt": "...", "fileUrls": {...}, "status": "success" }`

#### Scenario: Scheduler feature flag off

- GIVEN feature flag `SCHEDULER_ENABLED=false`
- WHEN any `/api/v1/report-schedules/*` endpoint is called
- THEN the system returns `503 Service Unavailable` with `{ "error": "SCHEDULER_DISABLED" }`
- AND existing schedules do not execute (cron skips when flag is off)

---

## Cross-Cutting Concerns

### Feature Flag Summary

| Flag | Scope | Default | Affected Endpoints |
|------|-------|---------|-------------------|
| `PLE_ENABLED` | Phase 1 | `false` | `/api/v1/reports/ple/*` |
| `MULTI_COMPANY_CONSOLIDATION` | Phase 1 | `false` | `/api/v1/reports/consolidated/*` |
| `BUDGET_ENABLED` | Phase 2 | `false` | `/api/v1/budgets/*`, `/api/v1/reports/budget-vs-actual` |
| `COST_CENTER_ENABLED` | Phase 2 | `false` | `/api/v1/cost-centers/*`, P&L/TB cost center params |
| `EXPORT_ENABLED` | Phase 2 | `false` | `/api/v1/reports/*/export/*` |
| `TEMPLATE_ENABLED` | Phase 3 | `false` | `/api/v1/report-templates/*` |
| `SCHEDULER_ENABLED` | Phase 3 | `false` | `/api/v1/report-schedules/*` |

All feature flags SHALL support independent toggling. Disabling one flag MUST NOT affect endpoints governed by other flags.

### Error Response Contract

All `/api/v1/reports/*` and associated endpoints SHALL return errors in the following shape:

```json
{
  "error": "<ERROR_CODE>",
  "message": "<human-readable message>",
  "details": ["..."]
}
```

**Standard error codes:**

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `COMPANY_NOT_IN_SCOPE` | 403 | companyId outside authenticated tenant scope |
| `LEDGER_UNAVAILABLE` | 503 | General Ledger service unreachable |
| `PLE_DISABLED` | 503 | PLE feature flag off |
| `PLE_VALIDATION_FAILED` | 422 | Generated PLE file fails structural validation |
| `CONSOLIDATION_NOT_READY` | 422 | One or more group RUCs missing ledger data |
| `CONSOLIDATION_DISABLED` | 503 | Multi-company feature flag off |
| `BUDGET_DISABLED` | 503 | Budget feature flag off |
| `COST_CENTER_DISABLED` | 503 | Cost Center feature flag off |
| `EXPORT_DISABLED` | 503 | Export feature flag off |
| `TEMPLATE_TOO_COMPLEX` | 422 | Report template exceeds complexity limits |
| `SCHEDULER_DISABLED` | 503 | Scheduler feature flag off |
| `INVALID_PERIOD` | 400 | Date range invalid (end before start, future-only, etc.) |

### Tenant Isolation

All endpoints MUST enforce `companyScopeGuard` (RUC isolation): the authenticated user's tenant SHALL determine the visible set of `companyId` values. Consolidated endpoints SHALL validate that all RUCs in the group belong to the same tenant.

### Phase Ordering Contract

1. **Phase 1** MUST be complete and deployed before Phase 2 development begins. Phase 1 delivers the versioned API surface and canonical ledger integration that Phase 2 depends on.
2. **Phase 2** MUST be complete and deployed before Phase 3 development begins. Phase 3's report builder and scheduler depend on the export infrastructure and cost center tagging delivered in Phase 2.
3. **PLE** is the highest-priority deliverable within Phase 1. If scope must be cut, multi-company consolidation SHALL be cut before PLE.

### Open Questions (Resolved at Design Phase)

1. PLE format: txt plano 5.1 assumed; confirm against SUNAT normativa vigente 2026 before implementation.
2. Inter-company elimination: AR/AP only in Phase 1; revenue/expense elimination deferred.
3. Custom report builder: financial statements only (not operational/inventory/payroll).
4. Cost center hierarchy: flat (tag-based), not tree.
5. PLE filing automation: follow-up post-Phase-1, not in this initiative scope.
