# M2 — Real Monthly Close Execution — Implementation Tasks

**Change:** M2 — Real Monthly Close Execution  
**Date:** 2026-08-01  
**Inputs:** proposal.md, spec.md, design.md, existing codebase

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,800–2,400 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes  
Chained PRs recommended: Yes  
Chain strategy: pending  
400-line budget risk: High  

---

## Pre-Flight: Schema Migrations + Shared Types

> These are dependency-free foundation tasks. Run before any PR work begins.

- [ ] **TASK-0.1**: Add `snapshot`, `steps`, `blockers`, `current_step` columns to `accounting_missions` table in `packages/persistence/src/schema/mission.schema.ts`. Run `drizzle-kit generate` and `drizzle-kit migrate`. <!-- sdd-owner: implementation -->
  - **Complexity**: S
  - **Files**: `packages/persistence/src/schema/mission.schema.ts`, new migration file in `packages/infrastructure/drizzle/`
  - **Acceptance**: Columns exist in DB; existing M1 queries still work; `snapshot` and `blockers` default to `NULL`/`[]`.

- [ ] **TASK-0.2**: Add `correction_of UUID REFERENCES journal_entries(id)` column to `journal_entries` table. Run `drizzle-kit generate` and `drizzle-kit migrate`. Add index `journal_entries_correction_of_idx`. <!-- sdd-owner: implementation -->
  - **Complexity**: S
  - **Files**: `packages/persistence/src/schema/accounting.schema.ts`, new migration file
  - **Acceptance**: Column and index exist; existing journal entry queries unaffected.

---

## PR1: Domain Types + Snapshot + Gates (~650 lines)

### TASK-1.1: Create MonthlyCloseOrchestrator directory structure and type definitions
- **Complexity**: M
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.types.ts`
- **Dependencies**: TASK-0.1
- **Acceptance**: All types from design §2 (StepResult, StepMetrics, StepError, RetryPolicy, MonthlyCloseStep, PipelineContext, CloseExecutionResult, ApplyResult, MissionEventEmitter) compile. Types match design §2.1–2.2 exactly. No runtime logic yet.
- [x] Create `monthly-close-orchestrator.types.ts` with all pipeline types, step interface, retry policies, and context. <!-- sdd-owner: implementation -->

### TASK-1.2: Create InputSnapshot type + freeze logic (D1 deliverable)
- **Complexity**: L
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/steps/freeze-snapshot.step.ts`
- **Dependencies**: TASK-1.1
- **Acceptance**: `FreezeSnapshotStep` implements `MonthlyCloseStep`. Captures ledger version (MAX `entry_number` from `journal_entries` for period), invoice count, bank reconciliation count, exchange rates from `exchange_rates`, SIRE snapshot (optional degrade to null), jurisdiction package version. Computes SHA-256 hash over ordered JSON. Stores snapshot on mission via `db.update(accountingMissions).set({ snapshot })`. Missing optional data (SIRE) produces WARN, not failure. `retryPolicy: { type: "none" }`, `isBlocker: false`.
- [x] Implement `FreezeSnapshotStep` with all 6 data sources, hash computation, and degrade logic. <!-- sdd-owner: implementation -->

### TASK-1.3: Create 7 ReadinessGates with evaluators (D2 deliverable)
- **Complexity**: XL
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/gates/readiness-gate.interface.ts`
  - `packages/application/src/use-cases/monthly-close/gates/period-open.gate.ts`
  - `packages/application/src/use-cases/monthly-close/gates/entries-balanced.gate.ts`
  - `packages/application/src/use-cases/monthly-close/gates/reconciliations-complete.gate.ts`
  - `packages/application/src/use-cases/monthly-close/gates/documents-processed.gate.ts`
  - `packages/application/src/use-cases/monthly-close/gates/min-evidence.gate.ts`
  - `packages/application/src/use-cases/monthly-close/gates/no-incompatible-missions.gate.ts`
  - `packages/application/src/use-cases/monthly-close/gates/prior-period-closed.gate.ts`
  - `packages/application/src/use-cases/monthly-close/steps/validate-gates.step.ts`
- **Dependencies**: TASK-1.1, TASK-1.2
- **Acceptance**:
  - `ReadinessGateEvaluator` interface defined with `gateType`, `isBlocker`, `isApplicable()`, `evaluate()`.
  - All 7 gate evaluators implemented:
    - `period_open` (BLOCKING): queries `accounting_periods.status = 'abierto'` for (company, year, month)
    - `entries_balanced` (non-blocking): SUM(debitCents) vs SUM(creditCents) via `journal_entry_lines` join
    - `reconciliations_complete` (non-blocking): all `bank_accounts` have COMPLETED reconciliation for period
    - `documents_processed` (non-blocking): no CPE invoices in `pendiente`/`rechazado`
    - `min_evidence` (non-blocking): at least one evidence item per required category
    - `no_incompatible_missions` (non-blocking): no other non-terminal monthly-close for (company, period)
    - `prior_period_closed` (BLOCKING): prior period `cerrado_final`/`auditado`; first period → NOT_APPLICABLE
  - `ValidateGatesStep` runs all evaluators, aggregates into `GateResults`, collects non-blocking FAILs as `AccountingException[]`, blocks immediately on blocking FAIL.
  - Writes gate results to existing `close_gates` table.
- [x] Create `readiness-gate.interface.ts` with `ReadinessGateEvaluator` contract. <!-- sdd-owner: implementation -->
- [x] Implement `PeriodOpenGate` and `PriorPeriodClosedGate` (both blocking). <!-- sdd-owner: implementation -->
- [x] Implement `EntriesBalancedGate`, `ReconciliationsCompleteGate`, `DocumentsProcessedGate`, `MinEvidenceGate`, `NoIncompatibleMissionsGate` (non-blocking). <!-- sdd-owner: implementation -->
- [x] Implement `ValidateGatesStep` aggregator with blocking-gate early-exit. <!-- sdd-owner: implementation -->

### TASK-1.4: Create AccountingException types + collector (D3 deliverable)
- **Complexity**: M
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.types.ts` (extend with exception types)
- **Dependencies**: TASK-1.1
- **Acceptance**: `AccountingException` type with `id`, `missionId`, `code`, `severity` ("info"|"warning"|"blocking"), `subjectRef`, `evidenceRefs`, `resolutionStatus` ("open"|"resolved"|"waived"), `description`, `suggestedAction`, `createdAt`. Exception codes: `UNMATCHED_TRANSACTION`, `LOW_CONFIDENCE_CATEGORIZATION`, `SUNAT_DISCREPANCY`, `MISSING_DOCUMENT`, `INVALID_ACCOUNT_CODE`, `UNBALANCED_PROPOSAL`, `EXCHANGE_RATE_DEVIATION`, `MISSING_EVIDENCE`, `TAX_CALCULATION_ANOMALY`, `GATE_*_FAILED`.
- [x] Define `AccountingException`, `ExceptionSeverity`, `ResolutionStatus`, and all exception code constants in types file. <!-- sdd-owner: implementation -->

### TASK-1.5: Create GateResults + blocker types
- **Complexity**: S
- **Files to modify**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.types.ts` (extend)
- **Dependencies**: TASK-1.1
- **Acceptance**: `GateResults` type with `gates: ReadinessGate[]`, `overallStatus: GateStatus`, `blockingGates: ReadinessGate[]`. `MissionBlocker` type with `gateType`, `reason`, `blockedAt`. `BlockerReport` with `hasBlockers: boolean`, `blockers: MissionBlocker[]`.
- [x] Add `GateResults`, `MissionBlocker`, and `BlockerReport` types. <!-- sdd-owner: implementation -->

### TASK-1.6: Unit tests for snapshot + gates + exceptions
- **Complexity**: L
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/__tests__/freeze-snapshot.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/period-open.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/entries-balanced.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/reconciliations-complete.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/documents-processed.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/min-evidence.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/no-incompatible-missions.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/gates/prior-period-closed.gate.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/validate-gates.test.ts`
- **Dependencies**: TASK-1.2, TASK-1.3, TASK-1.4
- **Acceptance** (~25 test cases):
  - Snapshot: captures correct ledger version, invoice count, exchange rates; hash deterministic; integrity check catches tampering; SIRE degrade produces WARN
  - Each gate: PASS/FAIL/WARN/UNKNOWN/NOT_APPLICABLE scenarios as specified in spec §Requirement: ReadinessGates
  - `period_open`: FAIL when not `abierto`
  - `prior_period_closed`: first period → NOT_APPLICABLE; prior period `abierto` → FAIL; `cerrado_final` → PASS
  - `entries_balanced`: unbalanced → FAIL
  - Exception collection: non-blocking FAIL becomes exception; blocking FAIL does not produce exception (handled by gate step)
  - `ValidateGatesStep`: overall status calculation, blocking gate detection
  - All tests use in-memory or mock DB — do not require a running PostgreSQL instance
- [x] Write unit tests for FreezeSnapshotStep (5+ cases). <!-- sdd-owner: implementation -->
- [x] Write unit tests for each of the 7 gate evaluators (2–3 cases per gate). <!-- sdd-owner: implementation -->
- [x] Write unit tests for ValidateGatesStep aggregation (3+ cases). <!-- sdd-owner: implementation -->

### TASK-1.7: PR1 bounded review
- **Complexity**: S
- **Files**: All PR1 files
- **Dependencies**: TASK-1.1 through TASK-1.6 all complete and tests passing
- **Acceptance**: All types compile. All unit tests pass (`npx vitest run packages/application/src/use-cases/monthly-close/__tests__/`). Code review approved.
- [ ] Start or reuse bounded review. <!-- sdd-owner: parent -->

---

## PR2: Pipeline + Proposal (~850 lines)

### TASK-2.1: Create MonthlyCloseOrchestrator class with runStep + pipeline skeleton
- **Complexity**: L
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.ts`
- **Dependencies**: PR1 complete
- **Acceptance**:
  - `MonthlyCloseOrchestrator` class with constructor injecting `db: DrizzleClient`, `fiscalAgent: FiscalNightlyRunUseCase`, `journalEntryPosting`, `periodClose`, `transactionalApply`, `compensatingGenerator`, `eventEmitter`.
  - `execute(missionId, companyId): Promise<CloseExecutionResult>` method skeleton with 10-step orchestration.
  - `applyEntries(missionId, companyId): Promise<ApplyResult>` method skeleton.
  - `runStep<TInput, TOutput>(step, input, context): Promise<StepResult<TOutput>>` implements retry logic matching `FiscalNightlyRunUseCase.runStep` pattern (design §2.4): loop up to `maxAttempts`, exponential backoff for `exponential` policy, updates mission step history via `db.update(accountingMissions).set({ steps })`, emits SSE events.
  - Pipeline skeleton compiles but inner steps throw "not implemented" — filled in by TASK-2.2 through TASK-2.8.
- [ ] Implement `MonthlyCloseOrchestrator` class with constructor DI, `runStep` retry pattern, and 10-step skeleton. <!-- sdd-owner: implementation -->

### TASK-2.2: Implement Step 1 (freeze snapshot) integration into orchestrator
- **Complexity**: S
- **Files to modify**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.ts`
- **Dependencies**: TASK-2.1
- **Acceptance**: `execute()` calls `FreezeSnapshotStep` as first step. On success, populates `context.snapshot`. On failure (non-blocking), continues with null snapshot and warns.
- [ ] Wire Step 1 into orchestrator `execute()` and populate `PipelineContext.snapshot`. <!-- sdd-owner: implementation -->

### TASK-2.3: Implement Step 2 (validate gates) integration with blocking-gate early exit
- **Complexity**: M
- **Files to modify**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.ts`
- **Dependencies**: TASK-2.2
- **Acceptance**: After Step 1, calls `ValidateGatesStep`. On blocking gate FAIL (`period_open` or `prior_period_closed`): calls `blockMission()`, transitions to `BLOCKED`, returns `{ status: "BLOCKED" }`. Non-blocking FAILs become `context.exceptions`. `context.gateResults` populated.
- [ ] Wire Step 2 with blocking-gate detection, `blockMission()` helper, and exception accumulation. <!-- sdd-owner: implementation -->

### TASK-2.4: Implement Steps 3–4 (FiscalAgent wrapper — AnalyzeLedger, AnalyzeInvoices)
- **Complexity**: L
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/steps/analyze-ledger.step.ts`
  - `packages/application/src/use-cases/monthly-close/steps/analyze-invoices.step.ts`
- **Dependencies**: TASK-2.1, TASK-1.1
- **Acceptance**:
  - `AnalyzeLedgerStep`: wraps `FiscalNightlyRunUseCase.execute()` with scope limited to Collect + Categorize. Input: `ledgerVersion` from snapshot. Output: `LedgerAnalysis` with transactions, categorizations, confidence scores. `isBlocker: true`, `retryPolicy: { type: "exponential", maxRetries: 3, baseDelayMs: 2000 }`. Persistent failure after retries → mission FAILED.
  - `AnalyzeInvoicesStep`: wraps FiscalAgent invoice analysis. Input: `invoiceDatasetVersion` from snapshot. Output: `InvoiceAnalysis` with matched/unmatched invoices, SUNAT status. `isBlocker: false`, same retry policy.
  - Low-confidence categorizations and SUNAT discrepancies become `AccountingException` objects.
- [ ] Implement `AnalyzeLedgerStep` wrapping `FiscalNightlyRunUseCase`. <!-- sdd-owner: implementation -->
- [ ] Implement `AnalyzeInvoicesStep` wrapping FiscalAgent invoice analysis. <!-- sdd-owner: implementation -->
- [ ] Wire Steps 3–4 into orchestrator pipeline after Step 2. <!-- sdd-owner: implementation -->

### TASK-2.5: Implement Steps 5–6 (AnalyzeReconciliations, AnalyzeCompliance)
- **Complexity**: L
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/steps/analyze-reconciliations.step.ts`
  - `packages/application/src/use-cases/monthly-close/steps/analyze-compliance.step.ts`
- **Dependencies**: TASK-2.1
- **Acceptance**:
  - `AnalyzeReconciliationsStep`: queries `bank_reconciliations` for period, compares totals against ledger, flags unmatched transactions. Output: `ReconciliationAnalysis`. Unmatched transactions → `UNMATCHED_TRANSACTION` exceptions (non-blocking). `isBlocker: false`, `retryPolicy: none`.
  - `AnalyzeComplianceStep`: checks CPE SUNAT statuses, detraction (SPOT) deposits, exchange rate tolerance, tax regime obligations. Output: `ComplianceAnalysis` with violations, warnings, compliance score. Critical violations → potentially blocking exceptions. `isBlocker: false`, `retryPolicy: none`.
- [ ] Implement `AnalyzeReconciliationsStep` with bank reconciliation verification. <!-- sdd-owner: implementation -->
- [ ] Implement `AnalyzeComplianceStep` with SUNAT/detraction/exchange-rate checks. <!-- sdd-owner: implementation -->
- [ ] Wire Steps 5–6 into orchestrator pipeline after Step 4. <!-- sdd-owner: implementation -->

### TASK-2.6: Implement Step 7 (DetectBlockers)
- **Complexity**: M
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/steps/detect-blockers.step.ts`
- **Dependencies**: TASK-2.3, TASK-2.4, TASK-2.5
- **Acceptance**:
  - Consolidates all `context.exceptions` from Steps 2–6. Categorizes by severity. If any `blocking` exceptions exist: compiles `BlockerReport`, calls `blockMission()`, returns `{ status: "BLOCKED" }`. No blockers → passes all non-blocking exceptions forward.
  - `isBlocker: true`, `retryPolicy: none` (pure logic).
- [ ] Implement `DetectBlockersStep` with exception consolidation and blocking detection. <!-- sdd-owner: implementation -->
- [ ] Wire Step 7 into pipeline; block mission on blockers, proceed on clear. <!-- sdd-owner: implementation -->

### TASK-2.7: Implement Step 8 (ProduceClosingProposal) with entry generators + validations
- **Complexity**: XL
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/steps/produce-proposal.step.ts`
- **Files to modify**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.types.ts` (add ClosingProposal, ProposedJournalEntry, TaxImpact, FinancialImpact types)
- **Dependencies**: TASK-2.6, TASK-1.1
- **Acceptance**:
  - `ProduceProposalStep` runs 4 generators in order: Depreciation, Accrual, Tax Provision, P&L Close.
  - **Depreciation generator** (design §6.3): queries `fixed_assets` WHERE `isActive = true` AND `depreciationMethod = "STRAIGHT_LINE"` (M2 scope). Calculates monthly depreciation: `round((purchasePriceCents - salvageCents) / usefulLifeMonths)`. Generates balanced entry: debit 681 (Gasto depreciación), credit 391 (Depreciación acumulada). Non-straight-line assets → WARN.
  - **Accrual generator**: identifies open payables/receivables at period end from `journal_entries`/`journal_entry_lines`.
  - **Tax provision generator**: calculates IGV and Renta from transaction data. Output: debit tax expense, credit tax payable.
  - **P&L close generator**: summarizes revenue (Class 7) and expense (Class 6) accounts, generates closing entries to P&L summary.
  - **Validations** (both blocking):
    1. Debits = Credits per entry (throws `UNBALANCED_PROPOSAL` on violation)
    2. PCGE account validation: every `accountCode` checked against `pcge_accounts` table (active codes only) (throws `INVALID_ACCOUNT_CODE` on violation)
  - Computes `taxImpact` ({ igvPayableCents, rentaPayableCents, totalTaxLiabilityCents }) and `financialImpact` ({ totalRevenueCents, totalExpenseCents, netIncomeCents }).
  - `riskLevel` derived from unresolved exception count/severity.
  - Stores `ClosingProposal` on mission via `db.update(accountingMissions).set({ proposal })`.
  - `isBlocker: true`, `retryPolicy: none`.
- [ ] Add `ClosingProposal`, `ProposedJournalEntry`, `TaxImpact`, `FinancialImpact` types to types file. <!-- sdd-owner: implementation -->
- [ ] Implement DepreciationEntryGenerator with straight-line calculation. <!-- sdd-owner: implementation -->
- [ ] Implement AccrualEntryGenerator for payables/receivables. <!-- sdd-owner: implementation -->
- [ ] Implement TaxProvisionEntryGenerator for IGV + Renta. <!-- sdd-owner: implementation -->
- [ ] Implement PLCloseEntryGenerator for revenue/expense summarization. <!-- sdd-owner: implementation -->
- [ ] Implement `ProduceProposalStep` with generator orchestration, debits=credits validation, and PCGE validation. <!-- sdd-owner: implementation -->

### TASK-2.8: Implement Steps 9–10 (BuildEvidence, RequestApproval)
- **Complexity**: L
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/steps/build-evidence.step.ts`
  - `packages/application/src/use-cases/monthly-close/steps/request-approval.step.ts`
- **Dependencies**: TASK-2.7
- **Acceptance**:
  - `BuildEvidenceStep`: assembles evidence bundle from snapshot, gate results, analysis outputs, proposal. Computes `evidenceHash` via SHA-256. Assigns to `proposal.sourceEvidence` and `proposal.evidenceHash`. `isBlocker: false`, `retryPolicy: none`.
  - `RequestApprovalStep`: creates `AccountingPR` row with `status: "PENDING_REVIEW"`, entries from proposal, evidence IDs, signer IDs from `requiredApprovals`. Updates mission status to `AWAITING_APPROVAL`. Links PR ID in `proposal.accountingPrId`. Emits `PROPOSAL_CREATED` SSE event. `isBlocker: true`, `retryPolicy: none`.
- [ ] Implement `BuildEvidenceStep` with evidence bundle assembly and hash. <!-- sdd-owner: implementation -->
- [ ] Implement `RequestApprovalStep` with AccountingPR creation and mission transition. <!-- sdd-owner: implementation -->
- [ ] Wire Steps 9–10 into orchestrator pipeline after Step 8. <!-- sdd-owner: implementation -->

### TASK-2.9: Wire orchestrator into M1 mission system (IntentHandler)
- **Complexity**: M
- **Files to modify**:
  - `apps/api/src/features/missions/missions.service.ts`
- **Files to create**:
  - `apps/api/src/features/missions/intent-handlers/monthly-close-intent.handler.ts`
  - `apps/api/src/features/missions/intent-handlers/correction-intent.handler.ts`
- **Dependencies**: TASK-2.1 (orchestrator class exists)
- **Acceptance**:
  - `MissionIntentHandler` interface: `onRunning(missionId, companyId)` and `onApproved(missionId, companyId)`.
  - `MonthlyCloseIntentHandler`: `onRunning` calls `orchestrator.execute()` fire-and-forget with `.catch()` for crash handling (marks mission FAILED). `onApproved` calls `orchestrator.applyEntries()`.
  - `INTENT_HANDLERS` registry: `Map<string, MissionIntentHandler>`.
  - `executeMission()`: after QUEUED→RUNNING transition, looks up handler by `mission.intent` and calls `handler.onRunning()`. If no handler registered, existing no-op behavior.
  - `approveMission()`: after APPROVED transition, calls `handler.onApproved()`.
  - Existing non-monthly-close intents unaffected (no handler registered → no-op).
- [ ] Create `MissionIntentHandler` interface and `MonthlyCloseIntentHandler` class. <!-- sdd-owner: implementation -->
- [ ] Create `INTENT_HANDLERS` registry and wire into `executeMission()` and `approveMission()`. <!-- sdd-owner: implementation -->

### TASK-2.10: Unit + integration tests for pipeline (PR2)
- **Complexity**: XL
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/__tests__/monthly-close-orchestrator.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/analyze-ledger.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/analyze-invoices.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/analyze-reconciliations.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/analyze-compliance.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/detect-blockers.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/produce-proposal.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/build-evidence.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/steps/request-approval.test.ts`
- **Dependencies**: TASK-2.1 through TASK-2.9
- **Acceptance** (~30 test cases):
  - **Orchestrator**: happy path (all 10 steps succeed, mission → AWAITING_APPROVAL), blocked path (Step 2 blocking gate → BLOCKED), blocked path (Step 7 blockers → BLOCKED), failed path (Step 3 persistent failure after retries → FAILED), partial path (Step 4 non-blocking failure → continues).
  - **Retry**: exponential backoff timing verified (mock timers), 3 retries exhausted → FAILED, transient success on attempt 2 → continues.
  - **FiscalAgent wrapping**: correct scope passed to `FiscalNightlyRunUseCase`, output parsed into `LedgerAnalysis`/`InvoiceAnalysis`.
  - **Proposal generation**: depreciation calculated correctly, debits=credits asserted, PCGE validation catches invalid codes, tax impact computed.
  - **Evidence**: hash deterministic, hash changes when evidence changes.
  - **RequestApproval**: AccountingPR created with correct status, mission transitions AWAITING_APPROVAL.
  - **IntentHandler**: `onRunning` invokes orchestrator, `onApproved` invokes `applyEntries`.
  - All tests use mocked `FiscalNightlyRunUseCase`, mocked DB via Drizzle mock or test container.
- [ ] Write unit tests for AnalyzeLedgerStep and AnalyzeInvoicesStep (FiscalAgent wrapping). <!-- sdd-owner: implementation -->
- [ ] Write unit tests for AnalyzeReconciliationsStep and AnalyzeComplianceStep. <!-- sdd-owner: implementation -->
- [ ] Write unit tests for DetectBlockersStep (blocking vs non-blocking). <!-- sdd-owner: implementation -->
- [ ] Write unit tests for ProduceProposalStep (depreciation, accruals, tax, P&L close, validations). <!-- sdd-owner: implementation -->
- [ ] Write unit tests for BuildEvidenceStep and RequestApprovalStep. <!-- sdd-owner: implementation -->
- [ ] Write integration tests for full orchestrator pipeline (happy, blocked, failed, partial paths). <!-- sdd-owner: implementation -->
- [ ] Write unit tests for IntentHandler wiring. <!-- sdd-owner: implementation -->

### TASK-2.11: PR2 bounded review
- **Complexity**: S
- **Files**: All PR1 + PR2 files
- **Dependencies**: TASK-2.10 all tests passing
- **Acceptance**: Full pipeline runs end-to-end with test data, produces valid ClosingProposal, transitions mission correctly.
- [ ] Start or reuse bounded review. <!-- sdd-owner: parent -->

---

## PR3: Transactional Apply + Roll-Forward + Integration (~750 lines)

### TASK-3.1: Implement JournalEntryPostingService
- **Complexity**: M
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/posting/journal-entry-posting.service.ts`
- **Dependencies**: PR2 complete
- **Acceptance**:
  - `post(tx, params)` method: inserts one row into `journal_entries` (with `entryNumber`, `periodKey`, `date`, `gloss`, `status: "mayorizado"`) and N rows into `journal_entry_lines` (one per line with `accountCode`, `description`, `debitCents`, `creditCents`). Returns the created entry ID. Operates within a passed transaction `tx`.
  - `nextEntryNumber(tx, companyId, periodKey)`: queries MAX(`entry_number`) + 1 for the company and period, or 1 if none.
- [ ] Implement `JournalEntryPostingService` with `post()` and `nextEntryNumber()`. <!-- sdd-owner: implementation -->

### TASK-3.2: Implement PeriodCloseService
- **Complexity**: S
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/posting/period-close.service.ts`
- **Dependencies**: TASK-3.1
- **Acceptance**:
  - `closeFinal(tx, { companyId, year, month })`: creates `AccountingPeriod` value object, calls `closeFinal()` for validation, updates `accounting_periods` row status to `cerrado_final` within the passed transaction `tx`.
  - Uses existing `AccountingPeriod` domain VO from `packages/domain/src/accounting/accounting-period.ts`.
- [ ] Implement `PeriodCloseService.closeFinal()` using `AccountingPeriod` VO. <!-- sdd-owner: implementation -->

### TASK-3.3: Implement TransactionalApplyUseCase (D5 deliverable)
- **Complexity**: XL
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/posting/transactional-apply.use-case.ts`
- **Dependencies**: TASK-3.1, TASK-3.2
- **Acceptance**:
  - `execute(missionId, companyId): Promise<ApplyResult>`:
    1. Loads mission and proposal from `accounting_missions`
    2. Opens `db.transaction(async (tx) => { ... })`
    3. **Period guard**: `SELECT ... FROM accounting_periods WHERE ... FOR UPDATE` — rejects if period not `abierto` with `PERIOD_ALREADY_CLOSED`
    4. **Posts all journal entries**: iterates `proposal.proposedEntries`, calls `journalEntryPosting.post(tx, ...)` for each
    5. **Updates period**: calls `periodClose.closeFinal(tx, ...)`
    6. **Resolves gates**: `UPDATE close_gates SET status = 'PASSED' WHERE (company, period)`
    7. **Updates mission**: `UPDATE accounting_missions SET status = 'COMPLETED'`
    8. **Generates receipt**: uses `generateReceiptHash()` from M1 with `decision: "APPLY"`, full `CloseReceiptContent` payload. Inserts into `mission_receipts`.
    9. **COMMIT** — any failure rolls back entire transaction
  - Returns `{ success: true, receiptHash, postedEntryIds }`.
  - Partial failure: any entry validation fails → entire transaction rolls back, mission → FAILED.
- [ ] Implement `TransactionalApplyUseCase` with full atomic transaction boundary. <!-- sdd-owner: implementation -->

### TASK-3.4: Integrate AccountingPR POSTED → Mission APPLY trigger
- **Complexity**: M
- **Files to modify**:
  - `apps/api/src/features/missions/missions.service.ts`
  - `apps/api/src/features/accounting-pr/` (existing PR approval handler — locate and extend)
- **Dependencies**: TASK-3.3
- **Acceptance**:
  - When an AccountingPR transitions to POSTED (all signers approved), detect if the PR is linked to a `monthly-close` mission via `proposal->>'accountingPrId'`.
  - If linked: update mission status to `APPROVED`, then invoke `MonthlyCloseOrchestrator.applyEntries()` (or directly `TransactionalApplyUseCase.execute()`).
  - Implemented as a direct trigger in the PR approval handler (design §7.2 approach).
- [ ] Locate AccountingPR approval handler and add POSTED → mission APPLY trigger. <!-- sdd-owner: implementation -->

### TASK-3.5: Implement CompensatingEntryGenerator (D6 deliverable)
- **Complexity**: M
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/correction/compensating-entry-generator.ts`
- **Dependencies**: TASK-0.2 (correction_of column), PR2 complete
- **Acceptance**:
  - `generate(originalEntryIds: string[], currentOpenPeriod: string): Promise<CompensatingEntry[]>`:
    1. Reads original journal entries + lines from DB
    2. Inverts each line: original `debitCents` → `creditCents`, original `creditCents` → `debitCents`
    3. Sets `correctionOf: originalEntryId`, `date: lastDayOfMonth(currentOpenPeriod)`, `description: "Corrección del cierre {period}: {gloss}"`
    4. Returns array of `CompensatingEntry` objects ready to post
  - Entries target the **current open period**, never the closed one.
- [ ] Implement `CompensatingEntryGenerator.generate()` with line inversion and period targeting. <!-- sdd-owner: implementation -->

### TASK-3.6: Create CorrectionMission intent + handler
- **Complexity**: M
- **Files to modify**:
  - `packages/mission-domain/src/mission-contracts.ts` (add `"correction"` to `MissionIntent`)
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/correction/correction-mission.handler.ts`
- **Dependencies**: TASK-3.5, TASK-2.9
- **Acceptance**:
  - `MissionIntent` union extended with `"correction"`.
  - `CorrectionMissionHandler` implements `MissionIntentHandler`:
    - `onRunning`: loads original mission receipt, verifies closed period still `cerrado_final`, generates compensating entries via `CompensatingEntryGenerator`, produces a `ClosingProposal` with `entryType: "CORRECTION"`, routes through AccountingPR.
    - `onApproved`: posts compensating entries via `TransactionalApplyUseCase` to current open period.
  - Registered in `INTENT_HANDLERS` map.
  - Correction entry has `correctionOf` field referencing the original `journal_entries.id`.
- [ ] Add `"correction"` to `MissionIntent` union in mission-domain. <!-- sdd-owner: implementation -->
- [ ] Implement `CorrectionMissionHandler` with compensating entry generation and apply. <!-- sdd-owner: implementation -->
- [ ] Register `CorrectionMissionHandler` in `INTENT_HANDLERS`. <!-- sdd-owner: implementation -->

### TASK-3.7: Checklist auto-population from mission steps
- **Complexity**: M
- **Files to modify**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.ts`
- **Dependencies**: PR2 complete
- **Acceptance**:
  - On first pipeline execution for a period: creates a `close_checklist` row with `name: "Cierre Mensual YYYY-MM"` and `status: "IN_PROGRESS"`.
  - Creates `close_checklist_items` rows for each pipeline step (10 items), one per step with `category` mapped from step type.
  - As each step completes: updates corresponding `close_checklist_item.status` to `COMPLETED`.
  - On re-execution: updates existing items, does not duplicate checklist.
  - Uses existing `close_checklists` and `close_checklist_items` tables from `monthly-close.schema.ts`.
- [ ] Implement checklist auto-population logic in orchestrator after each step completes. <!-- sdd-owner: implementation -->

### TASK-3.8: SSE progress events during pipeline execution
- **Complexity**: M
- **Files to modify**:
  - `packages/application/src/use-cases/monthly-close/monthly-close-orchestrator.ts`
  - `apps/api/src/features/missions/sse/mission-event-store.ts` (extend if needed)
- **Files to create** (if needed):
  - `packages/application/src/use-cases/monthly-close/monthly-close-event-emitter.ts`
- **Dependencies**: TASK-2.1
- **Acceptance**:
  - `MissionEventEmitter` implementation persists events to `mission_events` table and streams via existing SSE infrastructure.
  - Events emitted: `STEP_STARTED`, `STEP_COMPLETED`, `STEP_FAILED`, `BLOCKERS_DETECTED`, `PROPOSAL_CREATED`, `PROPOSAL_UPDATED`, `APPLY_STARTED`, `APPLY_COMPLETED`.
  - Pipeline progress: `emitStepProgress()` called before and after each step with `stepNumber`, `stepName`, `status`, `metrics`.
  - Connected SSE clients receive real-time progress updates.
- [ ] Implement `MissionEventEmitter` with SSE persistence. <!-- sdd-owner: implementation -->
- [ ] Wire event emission into orchestrator `runStep()` and pipeline phases. <!-- sdd-owner: implementation -->

### TASK-3.9: Integration tests (full pipeline end-to-end)
- **Complexity**: XL
- **Files to create**:
  - `packages/application/src/use-cases/monthly-close/__tests__/transactional-apply.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/correction/compensating-entry-generator.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/correction/correction-mission.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/integration/full-close-cycle.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/integration/rollback-on-failure.test.ts`
  - `packages/application/src/use-cases/monthly-close/__tests__/integration/security-tenant-isolation.test.ts`
- **Dependencies**: TASK-3.1 through TASK-3.8
- **Acceptance** (~25 test cases):
  - **TransactionalApply**: successful apply posts all entries, updates period, resolves gates, generates receipt. Partial failure rolls back entire transaction (zero entries persisted, period unchanged). Duplicate close for already-closed period rejected with `PERIOD_ALREADY_CLOSED`. `SELECT FOR UPDATE` serializes concurrent applies.
  - **CompensatingEntryGenerator**: inverts lines correctly, sets `correctionOf`, targets current open period. Description includes original period.
  - **CorrectionMission**: full correction cycle: create → generate → approve → apply. Original period stays `cerrado_final`. `correctionOf` traceable via `journal_entries.correction_of`.
  - **Full close cycle**: create mission → execute → pipeline runs → AWAITING_APPROVAL → AccountingPR created → signers approve → POSTED → APPLY → COMPLETED → receipt verifiable.
  - **Rollback**: inject failure at posting step 3 of 5 → verify transaction rollback, verify all 5 entries rolled back.
  - **Security**: tenant isolation — mission for company A cannot close period for company B. Gate queries scoped to `companyId`.
  - Tests should use a real PostgreSQL test database (test container or dedicated test DB) since transactional behavior, FOR UPDATE, and JSONB operations need real Postgres.
- [ ] Write integration tests for `TransactionalApplyUseCase` (success, rollback, duplicate, concurrency). <!-- sdd-owner: implementation -->
- [ ] Write unit tests for `CompensatingEntryGenerator`. <!-- sdd-owner: implementation -->
- [ ] Write integration tests for correction mission full cycle. <!-- sdd-owner: implementation -->
- [ ] Write end-to-end integration test for full close cycle (mission → completed). <!-- sdd-owner: implementation -->
- [ ] Write integration test for transaction rollback on partial failure. <!-- sdd-owner: implementation -->
- [ ] Write security test for tenant isolation on close operations. <!-- sdd-owner: implementation -->

### TASK-3.10: API routes for snapshot, gate override, and mission SSE extension
- **Complexity**: M
- **Files to modify**:
  - `apps/api/src/features/missions/missions.routes.ts`
  - `apps/api/src/features/missions/missions.controller.ts`
- **Dependencies**: PR2 complete
- **Acceptance**:
  - `GET /missions/:id/snapshot` — returns stored `InputSnapshot` JSON. 404 if no snapshot yet.
  - `POST /missions/:id/gates/:gateType/override` — overrides a non-blocking gate. Body: `{ reason: string, expectedMissionVersion: number }`. Requires `accounting_admin` role. Blocking gates (`period_open`, `prior_period_closed`) return `409 BLOCKING_GATE_CANNOT_BE_OVERRIDDEN`. Emits `GATE_OVERRIDDEN` SSE event.
  - `GET /missions/:id/events` — existing SSE stream extended to include M2 event types.
- [ ] Add `GET /:id/snapshot` route. <!-- sdd-owner: implementation -->
- [ ] Add `POST /:id/gates/:gateType/override` route with blocking-gate guard. <!-- sdd-owner: implementation -->
- [ ] Verify SSE stream handles all M2 event types. <!-- sdd-owner: implementation -->

### TASK-3.11: PR3 bounded review
- **Complexity**: S
- **Files**: All PR1 + PR2 + PR3 files
- **Dependencies**: TASK-3.9 all tests passing
- **Acceptance**: Real monthly close executes end-to-end via tests. Journal entries posted atomically. Period closed. Receipt generated and verifiable. Correction mission creates traceable compensating entries. All M1 tests still pass (no regressions).
- [ ] Start or reuse bounded review. <!-- sdd-owner: parent -->

---

## Summary: Task Count by PR

| PR | Tasks | Estimated Lines | Key Deliverables |
|----|-------|-----------------|------------------|
| PR1 | 7 | ~650 | D1 (InputSnapshot), D2 (ReadinessGates), D3 (AccountingException), Migration |
| PR2 | 11 | ~850 | Steps 3–10 pipeline, D4 (ClosingProposal), M1 IntentHandler wiring, Pipeline tests |
| PR3 | 11 | ~750 | D5 (TransactionalApply), D6 (Roll-Forward), Checklist auto-population, SSE, Integration tests |
| **Total** | **29** | **~2,250** | All 6 deliverables |

## M1 Regression Guard

After every PR merge, run: `npx vitest run packages/mission-domain/ packages/application/src/use-cases/fiscal-agent/ apps/api/src/features/missions/` — all M1 tests must pass unchanged.

## Definition of Done (from proposal §8)

1. ✅ End-to-end close executes: mission → 10-step pipeline → AWAITING_APPROVAL with real journal entries
2. ✅ Gates automated: 7 gates evaluate against real DB state; blocking gates stop close
3. ✅ Proposal reviewable: evidence bundle versioned, hash-verified on approval
4. ✅ Apply atomic: all entries + period update + gate resolution in single transaction
5. ✅ Receipt verifiable: cryptographic receipt using M1 SHA-256 infrastructure
6. ✅ Exceptions durable: typed `AccountingException` objects with severity and suggested action
7. ✅ Correction missions: compensating entries reference originals; same approve→apply→receipt flow
8. ✅ Checklists sync: mission steps auto-create/update `close_checklist_items`
9. ✅ No M1 regressions: all existing tests pass
10. ✅ All tests pass: unit + integration for every step, deliverable, and full pipeline
