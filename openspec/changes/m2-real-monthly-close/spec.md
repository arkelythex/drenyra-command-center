# Monthly Close Execution — Technical Specification

**Change:** M2 — Real Monthly Close Execution  
**Status:** Draft | **Date:** 2026-07-30  
**Inputs:** proposal.md, exploration findings, M1 design, product decisions

---

## Purpose

Define the behavior of the `MonthlyCloseOrchestrator` — the application service that executes a real accounting close when a `monthly-close` mission reaches `RUNNING`. This specification covers the 10-step pipeline, input freezing, automated gate evaluation, exception collection, closing proposal generation, transactional application, roll-forward foundations, mission integration, and API contracts.

---

## Requirements

### Requirement: MonthlyCloseOrchestrator 10-Step Pipeline

The system MUST execute the monthly close through an ordered 10-step pipeline when a `monthly-close` intent mission transitions to `RUNNING`. Each step MUST produce a typed output that feeds subsequent steps. The pipeline MUST support partial success (non-blocking failures degrade to warnings) and catastrophic failure (blockers halt the pipeline).

#### Scenario: Pipeline executes all 10 steps successfully for a clean period

- GIVEN a company with no blocking conditions for period 2026-06
- AND a `monthly-close` mission in QUEUED state
- WHEN the mission transitions to RUNNING and the orchestrator is invoked
- THEN steps 1-10 execute sequentially
- AND the mission transitions to AWAITING_APPROVAL with a valid ClosingProposal
- AND every step records its output in the mission's step history

#### Scenario: Pipeline blocks on prior-period gate failure

- GIVEN a company where period 2026-05 is still `abierto`
- AND a `monthly-close` mission for period 2026-06
- WHEN the orchestrator evaluates readiness gates in Step 2
- THEN the `prior_period_closed` gate returns FAIL
- AND the orchestrator transitions the mission to BLOCKED
- AND no subsequent steps execute
- AND the blocker is recorded with reason "Period 2026-05 must be cerrado_final or auditado before closing 2026-06"

#### Scenario: First period for a company auto-passes prior-period gate

- GIVEN a company with no prior accounting periods (first period ever)
- AND a `monthly-close` mission for period 2026-01
- WHEN the orchestrator evaluates the `prior_period_closed` gate
- THEN the gate returns NOT_APPLICABLE
- AND the pipeline continues past Step 2

#### Scenario: Pipeline retries FiscalAgent steps on transient failure

- GIVEN FiscalAgent's Collect step fails on attempt 1 with a network error
- WHEN the orchestrator invokes the step via `runStep`
- THEN the step retries up to 3 times with exponential backoff (2s, 4s, 8s)
- AND if a subsequent attempt succeeds, the pipeline continues
- AND if all 3 attempts fail, the step is marked FAILED with error details

#### Scenario: Persistent FiscalAgent failure blocks the close

- GIVEN FiscalAgent's Collect step fails all 3 retry attempts
- WHEN the orchestrator determines the step is persistently FAILED
- THEN the mission transitions to FAILED (not BLOCKED)
- AND the reason is "FiscalAgent step 'Collect' failed after 3 retries"
- AND no ClosingProposal is generated

#### Scenario: Non-blocking exceptions degrade to warnings

- GIVEN Step 5 (Analyze Reconciliations) finds 3 unmatched bank transactions
- WHEN those unmatched items are classified as `UNMATCHED_TRANSACTION` exceptions with severity MEDIUM
- THEN the pipeline continues past Step 5
- AND the exceptions appear in the ClosingProposal's `unresolvedExceptions` array
- AND the mission does NOT block

---

### Requirement: InputSnapshot Freezing

The system MUST freeze an immutable `InputSnapshot` at close execution start that captures the state of all data sources the pipeline depends on. All subsequent steps MUST reference this snapshot, NOT live data.

#### Scenario: Snapshot captures ledger, invoices, reconciliations, exchange rates, and policies

- GIVEN a close execution starts for company C, period 2026-06
- WHEN the `FreezeSnapshotStep` executes
- THEN an `InputSnapshot` is produced containing:
  - `fiscalPeriod: "2026-06"`
  - `ledgerVersion` with the last journal entry sequence number and total entries for the period
  - `invoiceDatasetVersion` with the last invoice ID and total invoices
  - `bankReconciliationVersion` with the last completed reconciliation ID and count
  - `exchangeRateSource` with buy/sell rates for each active currency pair
  - `jurisdictionPackageVersion` with the active tax regime and depreciation method
  - `capturedAt` as an ISO 8601 timestamp
- AND the snapshot is stored as JSON on the mission record

#### Scenario: Snapshot hash detects tampering

- GIVEN a stored InputSnapshot with hash `abc123`
- WHEN `verifySnapshotIntegrity()` recomputes the hash
- AND any field in the snapshot has been modified post-capture
- THEN the recomputed hash differs from `abc123`
- AND the verification returns `false`

#### Scenario: Missing optional data degrades gracefully

- GIVEN a company has no SIRE (SUNAT) data for the period
- WHEN the snapshot step attempts to capture the SIRE snapshot
- THEN `sireSnapshot` is set to `null` or `{ lastRunId: null, discrepancyCount: 0 }`
- AND a WARN-level exception is recorded
- AND the pipeline does NOT block

---

### Requirement: ReadinessGates Automated Evaluation

The system MUST evaluate seven automated readiness gates before the close proceeds. Each gate MUST produce one of five statuses: PASS, FAIL, WARN, UNKNOWN, or NOT_APPLICABLE. A FAIL on `prior_period_closed` or `period_open` MUST block the close. All other FAILs MUST become exceptions evaluated in the blocker-detection step.

#### Scenario: All seven gates evaluate against real database state

- GIVEN a close execution for company C, period 2026-06
- WHEN `EvaluateGatesStep` runs
- THEN each of these gates is evaluated:
  - `period_open` — checks `accounting_periods.status = 'abierto'` for (year=2026, month=06)
  - `entries_balanced` — queries `journal_entries` + `journal_entry_lines` for the period; verifies SUM(debitCents) = SUM(creditCents)
  - `reconciliations_complete` — checks all `bank_accounts` for this company have a COMPLETED `bank_reconciliation` covering the period
  - `documents_processed` — verifies no CPE invoices in `pendiente` or `rechazado` SUNAT status for the period
  - `min_evidence` — at least one evidence item exists for each required category (bank, tax, invoices)
  - `no_incompatible_missions` — no other non-terminal `monthly-close` mission exists for this (company, period)
  - `prior_period_closed` — the immediately prior period (2026-05) has status `cerrado_final` or `auditado`
- AND each gate produces a `ReadinessGate` result with `gateType`, `status`, `reason`, and `evidenceIds`

#### Scenario: period_open FAIL blocks the close

- GIVEN the accounting period for 2026-06 has status `cerrado_parcial` (not `abierto`)
- WHEN the `period_open` gate evaluates
- THEN the gate returns FAIL with reason "Period 2026-06 is cerrado_parcial, expected abierto"
- AND the mission transitions to BLOCKED
- AND no further steps execute

#### Scenario: prior_period_closed FAIL blocks the close

- GIVEN period 2026-05 has status `abierto`
- WHEN the `prior_period_closed` gate evaluates for period 2026-06
- THEN the gate returns FAIL
- AND the mission transitions to BLOCKED

#### Scenario: Non-blocking FAIL becomes an exception

- GIVEN `documents_processed` gate returns FAIL because 2 CPE invoices have SUNAT status `rechazado`
- WHEN gate evaluation completes
- THEN the gate result is FAIL but does NOT immediately block the pipeline
- AND it is collected as an `AccountingException` with severity determined by Step 7

#### Scenario: First-period detection returns NOT_APPLICABLE

- GIVEN no prior `accounting_periods` row exists for year < 2026 or (year=2026, month < 06) for this company
- WHEN the `prior_period_closed` gate evaluates for period 2026-06
- THEN the gate returns NOT_APPLICABLE
- AND the reason is "First accounting period for this company"

---

### Requirement: AccountingException Collection

The system MUST collect all issues discovered during pipeline execution as typed `AccountingException` objects. Each exception MUST carry an `id`, `missionId`, `code`, `severity` ("info" | "warning" | "blocking"), `subjectRef`, `evidenceRefs`, and `resolutionStatus` ("open" | "resolved" | "waived").

#### Scenario: Blocking exceptions prevent proposal generation

- GIVEN Step 7 (`DetectBlockersStep`) receives 5 exceptions
- AND two of them have `severity: "blocking"`
- WHEN the step determines whether to proceed
- THEN the mission transitions to BLOCKED
- AND all 5 exceptions are stored on the mission
- AND the blocking exceptions include a `suggestedAction` field explaining the resolution

#### Scenario: Non-blocking exceptions appear in ClosingProposal

- GIVEN Step 7 detects 3 exceptions with severity "warning"
- AND zero exceptions with severity "blocking"
- WHEN the pipeline reaches Step 8 (`ProduceClosingProposalStep`)
- THEN all 3 exceptions appear in `ClosingProposal.unresolvedExceptions`
- AND the mission does NOT block
- AND the `riskLevel` in the proposal is adjusted accordingly

#### Scenario: Exceptions carry structured evidence references

- GIVEN an exception generated for an unmatched bank transaction
- WHEN the exception is created
- THEN `subjectRef` points to the transaction ID (e.g., `"bankTx:550e8400-..."`)
- AND `evidenceRefs` contains the reconciliation report ID and the bank statement ID
- AND `code` is `"UNMATCHED_TRANSACTION"`
- AND `severity` is `"warning"`

---

### Requirement: ClosingProposal Generation

The system MUST generate a `ClosingProposal` containing proposed journal entries, tax impact, financial impact, required approvals, and source evidence. Every proposed entry MUST balance (total debits = total credits). Every account code MUST be validated against the PCGE chart of accounts.

#### Scenario: Proposal includes depreciation, accrual, tax provision, and P&L close entries

- GIVEN a clean period with fixed assets, outstanding payables, and revenue/expense transactions
- WHEN `ProduceClosingProposalStep` executes
- THEN the proposal contains at minimum:
  - One or more `DEPRECIATION` entries (debit depreciation expense, credit accumulated depreciation)
  - One or more `ACCRUAL` entries for outstanding payables/receivables at period end
  - One `TAX_PROVISION` entry for IGV and Renta tax liability
  - One or more `PL_CLOSE` entries summarizing revenue and expense to P&L summary account
- AND every entry has `totalDebits === totalCredits`
- AND every line's `accountCode` is validated against `pcge_accounts` (active codes only)

#### Scenario: Unbalanced proposal is rejected

- GIVEN the depreciation entry generator produces lines where totalDebits ≠ totalCredits
- WHEN the proposal is assembled
- THEN the assembly throws an error with code `"UNBALANCED_PROPOSAL"`
- AND the mission transitions to FAILED

#### Scenario: Proposal includes tax and financial impact summaries

- GIVEN a generated ClosingProposal
- WHEN the proposal is complete
- THEN `taxImpact` contains `igvPayableCents`, `rentaPayableCents`, and `totalTaxLiabilityCents`
- AND `financialImpact` contains `totalRevenueCents`, `totalExpenseCents`, and `netIncomeCents`
- AND `requiredApprovals` lists the roles/users that must sign (derived from company policy)
- AND `sourceEvidence` references all evidence items that support the proposed entries

#### Scenario: PCGE account validation rejects invalid codes

- GIVEN a proposed entry line with `accountCode: "99999"` (non-existent PCGE code)
- WHEN `ProduceClosingProposalStep` validates account codes
- THEN the entry is rejected with an `AccountingException` code `"INVALID_ACCOUNT_CODE"`
- AND the proposal is not generated until the invalid code is corrected or the entry is removed

---

### Requirement: Transactional Apply with AccountingPR Integration

The system MUST apply an approved ClosingProposal atomically: all closing journal entries, the period status transition, and gate resolution MUST succeed or fail as a single database transaction. The closing entries MUST route through the existing AccountingPR multi-signer approval workflow.

#### Scenario: Approved proposal posts all entries and closes the period in one transaction

- GIVEN a mission in AWAITING_APPROVAL with an approved ClosingProposal
- WHEN the `APPROVED` transition triggers `TransactionalApplyUseCase`
- THEN within a single database transaction:
  - All `journal_entries` rows are inserted (one per proposed entry)
  - All `journal_entry_lines` rows are inserted (one per line)
  - The `accounting_periods` row for (company, year, month) is updated to status `cerrado_final`
  - All relevant `close_gates` rows are updated to status PASSED
  - An `AccountingPR` is created with status POSTED, containing references to the posted journal entries
- AND the transaction commits
- AND a cryptographic receipt is generated using M1's `generateReceiptHash`

#### Scenario: Partial failure rolls back the entire transaction

- GIVEN 5 proposed journal entries to post
- AND the 3rd entry has invalid data (e.g., missing account code)
- WHEN `TransactionalApplyUseCase` attempts to post all entries
- THEN the database transaction rolls back
- AND zero journal entries are persisted
- AND the period status remains unchanged
- AND the mission transitions to FAILED with error details

#### Scenario: Closing entries route through AccountingPR for multi-signer approval

- GIVEN a ClosingProposal generated by the orchestrator
- WHEN the proposal is ready for approval
- THEN an `AccountingPR` is created with:
  - `status: "DRAFT"`
  - `entries` referencing each proposed journal entry ID
  - `evidenceIds` from the proposal's source evidence
  - `totalDebitCents` and `totalCreditCents` matching the proposal totals
  - `approveSignerIds` from the proposal's `requiredApprovals`
- AND the PR follows the standard lifecycle: DRAFT → PENDING_REVIEW → APPROVED → POSTED
- AND posting occurs only after all required signers have approved (N-of-M)

#### Scenario: Duplicate close for an already-closed period is rejected

- GIVEN period 2026-06 is already `cerrado_final`
- WHEN a new `monthly-close` mission attempts to apply for the same period
- THEN the transactional apply detects the period status guard
- AND the apply is rejected with error `"PERIOD_ALREADY_CLOSED"`
- AND the mission transitions to FAILED

---

### Requirement: Roll-Forward Correction Foundation

The system MUST support a `correction` mission intent that generates compensating journal entries referencing the original closing entries. Corrected periods MUST remain closed; corrections MUST post to the next open period.

#### Scenario: Correction mission generates compensating entries for a closed period

- GIVEN period 2026-06 is `cerrado_final` with closing entry JE-001 (debit Gasto 1000 / credit Caja 1000)
- AND a user creates a `correction` intent mission referencing JE-001
- WHEN the correction mission executes
- THEN `generateCompensatingEntries()` produces a mirror entry with:
  - Lines inverted: credit Gasto 1000 / debit Caja 1000
  - `correctionOf` field set to `"JE-001"`
  - `date` set to the current open period's date
  - `description` prefixed with "Corrección del cierre {period}: "
- AND the new entry posts to the current open period, not the closed one

#### Scenario: Correction mission follows the same approve→apply→receipt flow

- GIVEN a `correction` mission with a generated compensating entry
- WHEN the mission reaches AWAITING_APPROVAL
- THEN the approval flow validates evidence hash and proposal version (same as monthly-close)
- AND on APPROVED, the compensating entry posts atomically
- AND a cryptographic receipt is generated
- AND the original period remains `cerrado_final` (unchanged)

#### Scenario: Correction references are traceable

- GIVEN a compensating entry JE-002 created as correction for JE-001
- WHEN an auditor queries JE-002
- THEN the entry's `correctionOf` field returns `"JE-001"`
- AND JE-001 can be located from JE-002's reference
- AND the mission receipt for the correction mission links to both entries

---

### Requirement: M1 Mission System Integration

The system MUST wire the `MonthlyCloseOrchestrator` into the M1 mission execution handler. When a `monthly-close` intent mission transitions to `RUNNING`, the handler MUST invoke the orchestrator. The orchestrator MUST report progress, step completions, blockers, and evidence back to the mission via SSE events.

#### Scenario: Mission execution handler invokes the orchestrator for monthly-close intent

- GIVEN a mission with `intent: "monthly-close"` transitions DRAFT → QUEUED → RUNNING
- WHEN the RUNNING transition handler executes
- THEN `MissionsService` detects the `monthly-close` intent
- AND instantiates `MonthlyCloseOrchestrator` with the mission's company ID and fiscal period
- AND calls `orchestrator.execute(missionId)`
- AND the orchestrator runs the 10-step pipeline
- AND progress updates flow back through SSE to connected clients

#### Scenario: Orchestrator reports step progress via mission events

- GIVEN the orchestrator is executing Step 3 (Analyze Ledger)
- WHEN the step starts, progresses, or completes
- THEN a `MissionEvent` is emitted with:
  - `eventType: "STEP_PROGRESS"`
  - `snapshot` containing `currentStep`, `progress`, `steps` array with per-step status
- AND the event is persisted to `mission_events` and streamed via SSE

#### Scenario: Non-monthly-close intents are unaffected

- GIVEN a mission with `intent: "reconciliation"` transitions to RUNNING
- WHEN the RUNNING handler executes
- THEN the orchestrator is NOT invoked
- AND the mission follows its existing behavior (or defers to its own handler)

#### Scenario: Approval flows from AccountingPR back to mission

- GIVEN a ClosingProposal has been routed to an AccountingPR
- AND the PR reaches `APPROVED` status with all required signatures
- WHEN the PR transitions to POSTED
- THEN the mission receives the approval event
- AND `TransactionalApplyUseCase` is invoked
- AND the mission transitions COMPLETED

---

### Requirement: API Contracts

The system MUST extend the existing mission API with real close execution behavior. The `POST /missions/:id/execute` endpoint MUST actually run the close pipeline for `monthly-close` intents. New endpoints MUST be provided for snapshot retrieval and gate override.

#### Scenario: POST /missions/:id/execute runs the close pipeline

- GIVEN a `monthly-close` mission in DRAFT state with id `m-001`
- WHEN the client sends `POST /api/v1/missions/m-001/execute` with valid `expectedMissionVersion`
- THEN the mission transitions DRAFT → QUEUED → RUNNING
- AND the `MonthlyCloseOrchestrator` begins executing the 10-step pipeline
- AND the response includes SSE headers for streaming progress
- AND the client receives `STATE_TRANSITION`, `STEP_PROGRESS`, `PROPOSAL_CREATED` events

#### Scenario: GET /missions/:id/snapshot retrieves the frozen snapshot

- GIVEN a mission `m-001` has completed Step 1 and stored an InputSnapshot
- WHEN the client sends `GET /api/v1/missions/m-001/snapshot`
- THEN the response contains the full `InputSnapshot` JSON
- AND the response includes `status: 200`

#### Scenario: POST /missions/:id/gates/:gateType/override overrides a non-blocking gate (if allowed)

- GIVEN the `documents_processed` gate has status FAIL
- AND the user has the `accounting_admin` role
- WHEN the client sends `POST /api/v1/missions/m-001/gates/documents_processed/override` with body `{ reason: "Manual review confirmed all documents", expectedMissionVersion: 3 }`
- THEN the gate status is updated to WAIVED
- AND the override is recorded with the actor ID, timestamp, and reason
- AND a `MissionEvent` of type `GATE_OVERRIDDEN` is emitted

#### Scenario: Blocking gate override is rejected

- GIVEN the `prior_period_closed` gate has status FAIL (blocking)
- AND the user has the `accounting_admin` role
- WHEN the client attempts to override this gate
- THEN the endpoint returns `409 BLOCKING_GATE_CANNOT_BE_OVERRIDDEN`
- AND the gate status remains FAIL
- AND the mission remains BLOCKED

---

### Requirement: Step Retry Policy

Each pipeline step MUST have a defined retry policy. Steps that depend on external services (FiscalAgent) MUST retry up to 3 times with exponential backoff. Steps that perform local database queries MUST NOT retry automatically (fail-fast, surfaced to the user).

#### Scenario: FiscalAgent step retries with exponential backoff

- GIVEN Step 3 (Analyze Ledger) calls `FiscalNightlyRunUseCase.execute()`
- AND the call fails with a network error
- WHEN the orchestrator's `runStep` method handles the error
- THEN it retries after 2 seconds (attempt 2)
- AND if that fails, retries after 4 seconds (attempt 3)
- AND if that fails, retries after 8 seconds (attempt 4 — exceeds MAX_RETRIES=3, marked FAILED)

#### Scenario: Local database step fails immediately without retry

- GIVEN Step 2 (Validate Gates) queries the database and encounters a connection error
- WHEN the error occurs
- THEN the step is marked FAILED immediately (no retry)
- AND the mission transitions to FAILED with the database error details

---

### Requirement: Mission Schema Extension for M2

The `accounting_missions` table MUST support the new M2 capabilities through additive columns: a `snapshot` JSONB column for the frozen InputSnapshot, a `steps` JSONB column for pipeline step history, a `blockers` JSONB column for blocker details, and a `currentStep` varchar column for the active step identifier.

#### Scenario: All pipeline state is stored on the mission row

- GIVEN a close execution is in progress at Step 5
- WHEN `GET /api/v1/missions/m-001` is called
- THEN the response includes:
  - `snapshot`: the frozen InputSnapshot from Step 1
  - `currentStep`: `"analyze-reconciliations"`
  - `steps`: array of StepResult objects for steps 1-4 with status and metrics
  - `blockers`: empty array (no blockers yet)
  - `proposal`: null (not yet generated)

#### Scenario: Backward compatibility with M1 missions

- GIVEN an existing M1 mission with `intent: "reconciliation"` and no snapshot/steps/blockers columns populated
- WHEN the mission is queried
- THEN `snapshot` is `null`, `steps` is `[]`, `blockers` is `[]`, and `currentStep` is `""`
- AND the existing M1 behavior is unchanged
- AND all M1 tests continue to pass

---

### Requirement: Concurrent Close Prevention

The system MUST prevent concurrent close execution for the same (company, period). If a `monthly-close` mission is already active (non-terminal state), new close missions for the same company and period MUST be rejected.

#### Scenario: Second close mission for same period is rejected at creation

- GIVEN an active `monthly-close` mission for (company C, period 2026-06) in RUNNING state
- WHEN a user attempts `POST /api/v1/missions` with `{ companyId: "C", fiscalPeriod: "2026-06", intent: "monthly-close" }`
- THEN the creation is rejected with `409 CONFLICT`
- AND the error message is "An active monthly-close mission already exists for this period"
- AND the M1 unique constraint `acct_missions_company_period_intent_unq` prevents duplicate rows

#### Scenario: Transactional apply uses SELECT FOR UPDATE to prevent races

- GIVEN two approved proposals attempt to apply simultaneously for the same period (race condition)
- WHEN `TransactionalApplyUseCase` begins its transaction
- THEN it executes `SELECT ... FROM accounting_periods WHERE ... FOR UPDATE`
- AND the second transaction blocks until the first commits or rolls back
- AND the second transaction detects the period is already `cerrado_final` and aborts

---

### Requirement: Checklist Auto-Population

The system MUST automatically create and update `close_checklist_items` as the pipeline progresses through its steps. Each step completion MUST update the corresponding checklist item status.

#### Scenario: Pipeline steps create checklist items on first execution

- GIVEN a close execution starts for period 2026-06
- AND no `close_checklist` exists for this (company, period)
- WHEN Step 1 (Freeze Snapshot) completes
- THEN a `close_checklist` is created with `name: "Cierre Mensual 2026-06"` and `status: IN_PROGRESS`
- AND `close_checklist_items` are created for each pipeline step with `status: PENDING`
- AND as each step completes, its corresponding item transitions to COMPLETED

#### Scenario: Existing checklist is updated, not duplicated

- GIVEN a `close_checklist` already exists for (company C, period 2026-06) with items in various states
- WHEN a new close execution starts for the same period
- THEN no new checklist is created
- AND existing items are updated to reflect the current pipeline state
- AND completed items that were previously COMPLETED remain COMPLETED (no regression)

---

## Appendix A: Type Definitions

### InputSnapshot

```typescript
interface InputSnapshot {
  fiscalPeriod: string;            // "YYYY-MM"
  ledgerVersion: number;            // last journal entry sequence number
  invoiceDatasetVersion: number;    // last invoice ID or count
  bankReconciliationVersion: number; // last completed reconciliation ID
  exchangeRateSource: string;       // "sunat" | "manual" | "bcrp"
  jurisdictionPackageVersion: string; // e.g., "PE-2026-v3"
  capturedAt: string;               // ISO 8601 timestamp
}
```

### ReadinessGate

```typescript
type GateStatus = "PASS" | "FAIL" | "WARN" | "UNKNOWN" | "NOT_APPLICABLE";

type GateType =
  | "period_open"
  | "entries_balanced"
  | "reconciliations_complete"
  | "documents_processed"
  | "min_evidence"
  | "no_incompatible_missions"
  | "prior_period_closed";

interface ReadinessGate {
  name: string;
  type: GateType;
  status: GateStatus;
  evidence: string[];  // evidence item IDs
}
```

### AccountingException

```typescript
type ExceptionSeverity = "info" | "warning" | "blocking";
type ResolutionStatus = "open" | "resolved" | "waived";

interface AccountingException {
  id: string;
  missionId: string;
  code: string;                    // e.g., "UNMATCHED_TRANSACTION"
  severity: ExceptionSeverity;
  subjectRef: string;              // e.g., "bankTx:uuid"
  evidenceRefs: string[];
  resolutionStatus: ResolutionStatus;
}
```

### ClosingProposal

```typescript
interface MonetaryImpact {
  totalRevenueCents: number;
  totalExpenseCents: number;
  netIncomeCents: number;
}

interface ProposedEntry {
  entryType: "DEPRECIATION" | "ACCRUAL" | "TAX_PROVISION" | "PL_CLOSE" | "CORRECTION";
  description: string;
  date: string;
  lines: Array<{
    accountCode: string;
    accountName: string;
    description: string;
    debitCents: number;
    creditCents: number;
  }>;
  totalDebits: number;
  totalCredits: number;
  sourceEvidence: string[];
}

interface ClosingProposal {
  version: number;
  proposedJournalEntries: ProposedEntry[];
  unresolvedExceptions: AccountingException[];
  taxImpact: MonetaryImpact;
  financialImpact: MonetaryImpact;
  requiredApprovals: string[];       // role/user IDs
  sourceEvidence: EvidenceRef[];     // full evidence references
}

interface EvidenceRef {
  id: string;
  label: string;
  type: string;
}
```

### CorrectionMission

```typescript
interface CorrectionMission {
  originalMissionId: string;
  originalPeriod: string;
  entriesToReverse: string[];  // journal entry IDs
  reason: string;
}

interface CompensatingEntry {
  originalEntryId: string;
  correctionOf: string;
  lines: Array<{
    accountCode: string;
    description: string;
    debitCents: number;   // inverted from original
    creditCents: number;  // inverted from original
  }>;
  date: string;            // current open period date
}
```

## Appendix B: Pipeline Step Specifications

### Step 1: Freeze Input Snapshot

| Field | Value |
|-------|-------|
| **Input** | `missionId`, `companyId`, `fiscalPeriod` |
| **Processing** | Query current ledger state (MAX sequence number from journal_entries for period), invoice dataset state, bank reconciliation state, exchange rates from `exchange_rates` table for active currency pairs, and active jurisdiction package. Freeze values into an `InputSnapshot`. Compute SHA-256 hash over the snapshot JSON. |
| **Output** | `InputSnapshot` stored on mission. Step result with metrics. |
| **Error states** | Missing exchange rates → WARN, continue. Missing ledger data → WARN (no entries yet), continue. |
| **Retry policy** | No retry (local DB reads). Fail-fast on connection error. |

### Step 2: Validate Readiness Gates

| Field | Value |
|-------|-------|
| **Input** | `companyId`, `fiscalPeriod`, `InputSnapshot` |
| **Processing** | Evaluate all 7 gates against database state. For each gate: query relevant tables, determine status, collect evidence IDs. Aggregate results: `overallStatus` = most severe gate status. |
| **Output** | `GateResults` with all 7 `ReadinessGate` objects. Stored on mission. |
| **Error states** | `period_open` FAIL → BLOCKED. `prior_period_closed` FAIL → BLOCKED. Other FAILs → collected as exceptions for Step 7. |
| **Retry policy** | No retry (local DB reads). |

### Step 3: Analyze Ledger Data

| Field | Value |
|-------|-------|
| **Input** | `companyId`, `fiscalPeriod`, `InputSnapshot.ledgerVersion` |
| **Processing** | Invoke `FiscalNightlyRunUseCase` with scope limited to Collect + Categorize steps. Feed the pipeline with transactions from the period, categorize against PCGE accounts, flag low-confidence categorizations. |
| **Output** | `LedgerAnalysis` — all transactions with PCGE categorizations, confidence scores, and per-transaction exceptions. |
| **Error states** | Step failure after 3 retries → mission FAILED. Low-confidence categorizations → `LOW_CONFIDENCE_CATEGORIZATION` exceptions (non-blocking). |
| **Retry policy** | 3 retries, exponential backoff (2s, 4s, 8s). |

### Step 4: Analyze Invoices

| Field | Value |
|-------|-------|
| **Input** | `companyId`, `fiscalPeriod`, `InputSnapshot.invoiceDatasetVersion` |
| **Processing** | Invoke `FiscalNightlyRunUseCase` Invoice analysis. Match invoices to ledger entries, verify SUNAT CPE statuses, detect missing or duplicate entries. |
| **Output** | `InvoiceAnalysis` — matched/unmatched invoices, SUNAT status per invoice, discrepancies. |
| **Error states** | `rechazado` CPE → `SUNAT_DISCREPANCY` exception (potentially blocking). Missing invoices → `MISSING_DOCUMENT` exception. |
| **Retry policy** | 3 retries, exponential backoff. |

### Step 5: Analyze Reconciliations

| Field | Value |
|-------|-------|
| **Input** | `companyId`, `fiscalPeriod`, `InputSnapshot.bankReconciliationVersion` |
| **Processing** | Query `bank_reconciliations` for the period. Compare bank transaction totals against ledger entries. Flag unmatched transactions. Verify all bank accounts have reconciliations. |
| **Output** | `ReconciliationAnalysis` — match rate, unmatched items list, per-account status. |
| **Error states** | Unmatched transactions → `UNMATCHED_TRANSACTION` exceptions (non-blocking). |
| **Retry policy** | No retry (local DB reads). |

### Step 6: Analyze Compliance State

| Field | Value |
|-------|-------|
| **Input** | `companyId`, `fiscalPeriod`, `InputSnapshot` |
| **Processing** | Check CPE SUNAT statuses (`pendiente`/`rechazado`), detraction (SPOT) deposit status, exchange rate tolerance against SUNAT reference rates, tax regime obligations. |
| **Output** | `ComplianceAnalysis` — violations array, warnings array, compliance score (0-100). |
| **Error states** | Critical violations → `TAX_CALCULATION_ANOMALY` or `SUNAT_DISCREPANCY` exceptions (potentially blocking). |
| **Retry policy** | No retry (local DB reads). |

### Step 7: Detect Blockers and Exceptions

| Field | Value |
|-------|-------|
| **Input** | Gate results (Step 2), exceptions from Steps 3-6 |
| **Processing** | Consolidate all exceptions. Categorize by severity. If any `blocking` exceptions exist, compile `BlockerReport`. If no blockers, pass all non-blocking exceptions forward to Step 8. |
| **Output** | `BlockerReport` (if blocked) or `Exception[]` (if clear). |
| **Error states** | Blockers present → mission BLOCKED. No blockers → proceed to Step 8. |
| **Retry policy** | Not applicable (pure logic, no I/O). |

### Step 8: Produce Closing Proposal

| Field | Value |
|-------|-------|
| **Input** | All analysis results (Steps 3-6), non-blocking exceptions (Step 7), `InputSnapshot`, PCGE chart of accounts |
| **Processing** | Generate depreciation entries (query fixed_assets, calculate monthly depreciation per asset). Generate accrual entries (identify open payables/receivables). Generate tax provision entries (IGV + Renta from transaction data). Generate P&L close entries (summarize revenue/expense to P&L summary). Validate every entry: debits = credits, account codes exist and are active. Assemble full `ClosingProposal`. |
| **Output** | `ClosingProposal` — stored on mission as `proposal` JSONB with version 1. |
| **Error states** | Unbalanced entry → FAILED mission. Invalid account code → FAILED mission. |
| **Retry policy** | Not applicable (pure logic). |

### Step 9: Build Evidence Bundle

| Field | Value |
|-------|-------|
| **Input** | InputSnapshot, GateResults, all analysis outputs, ClosingProposal |
| **Processing** | Assemble the complete evidence bundle: snapshot metadata, gate results with evidence IDs, exception log, proposed journal entries, tax impact calculation, financial impact summary. Hash the entire bundle → `evidenceHash`. |
| **Output** | `EvidenceBundle` — assigned to the ClosingProposal as `sourceEvidence`. `evidenceHash` stored on the proposal. |
| **Error states** | Missing optional evidence → WARN, continue. |
| **Retry policy** | Not applicable (pure logic). |

### Step 10: Request Approval

| Field | Value |
|-------|-------|
| **Input** | ClosingProposal, EvidenceBundle, company approval policy |
| **Processing** | Create an `AccountingPR` from the ClosingProposal. Set PR status to PENDING_REVIEW with required signers from `requiredApprovals`. Update mission state to AWAITING_APPROVAL. Set mission `proposal` with version, evidence, and evidenceHash. Emit `PROPOSAL_CREATED` SSE event. |
| **Output** | Mission in AWAITING_APPROVAL state. AccountingPR in PENDING_REVIEW for signers. |
| **Error states** | PR creation failure → FAILED mission. |
| **Retry policy** | No retry (local DB write). |

## Appendix C: Product Decisions Reference

| Decision | Choice | Spec Impact |
|----------|--------|-------------|
| Approval workflow | Multi-signer AccountingPR (N-of-M) | Step 10 creates PR; TransactionalApply waits for all signatures |
| Blocked close | BLOCKED until resolved — no force override | Blocking gates (`period_open`, `prior_period_closed`) cannot be overridden |
| Corrections | Next period adjustment | CorrectionMission posts compensating entries to the current open period |
| FiscalAgent failure | Block on persistent FAILED after retries | Step 3/4 failure after 3 retries → mission FAILED |
| First period gate | NOT_APPLICABLE automatic detection | `prior_period_closed` gate queries for any prior period; if none, NOT_APPLICABLE |
