# M2 — Real Monthly Close Execution — Proposal

**Status:** Draft | **Date:** 2026-07-30 | **Inputs:** M1 design/tasks, M2 exploration

---

## 1. PRD: Problem, Users, Business Rules

### 1.1 Business Problem

M1 delivered a durable mission state machine — 11 states, idempotency, cryptographic receipts, SSE streaming, evidence-bound approvals. But a mission that reaches `RUNNING` does **nothing** with real accounting data. The state transitions happen, but no journal entries are created, no depreciation is calculated, no tax provisions are generated, no period is closed.

Meanwhile, the codebase already has:

- **FiscalNightlyRunUseCase**: a 5-step AI pipeline that collects transactions, categorizes them, calculates taxes, reconciles against SUNAT, and produces suggested journal entries — but **never posts them** to the database.
- **AccountingPeriod** with a clean `abierto → cerrado_parcial → cerrado_final → auditado` lifecycle — but nothing ever transitions it.
- **close_checklists** and **close_gates** — a manual CRUD system where humans tick items off and manually override gates.
- **AccountingPRs** — a multi-signer approval workflow that is fully functional but disconnected from any close orchestration.
- Full PCGE chart of accounts, fixed assets with depreciation data, bank reconciliations, and journal entries tables.

**The pain**: Every month-end close is manual. The accountant must run FiscalAgent separately, copy its suggested entries into the journal entry UI, manually verify every checklist item, manually check gates, and manually update the period status. There is no single end-to-end workflow. The mission system (M1) has the durability and audit trail but no connection to accounting reality.

### 1.2 Target Users and Situations

| User | Situation | Urgency |
|------|-----------|---------|
| **Contador** (accountant) | Running the monthly close for a company. Needs a single "Iniciar Cierre" button that produces a verifiable, auditable close with real journal entries. | High — this is their core monthly task. |
| **Auditor** (internal/external) | Reviewing a closed period. Needs the full evidence bundle: snapshot, journal entries, reconciliations, gate results, and approval receipt. | Medium — during audit cycles. |
| **CFO / Gerente** | Approving the closing proposal. Needs to see the financial impact (tax liability, P&L summary, exceptions) before signing off. | High — gatekeeper of the close. |
| **Soporte** (support) | Investigating a failed or partial close. Needs to see exactly which step failed, why, and whether a roll-forward correction mission can fix it. | Medium — during incidents. |

### 1.3 Business Rules

| Rule | Description |
|------|-------------|
| **BR1 — Period locking** | When a close mission enters `RUNNING`, the accounting period must be locked (prevent new journal entries). The period status remains unchanged until close completes. |
| **BR2 — Prior-period gate** | A period cannot close if the immediately prior period is not in `cerrado_final` or `auditado` state. Exception: the very first period for a company. |
| **BR3 — Debits = Credits** | Every closing journal entry must balance (total debits = total credits). Unbalanced proposals are blocked from posting. |
| **BR4 — Evidence-bound approval** | The approver must see the exact evidence bundle (snapshot, gate results, journal entries, tax impact) that was current at proposal generation. Evidence changes invalidate the proposal. |
| **BR5 — Atomic apply** | Approved closing entries must post atomically: all entries succeed or none do. Partial posting is forbidden. |
| **BR6 — Immutable close** | Once a period reaches `cerrado_final`, its closing journal entries cannot be edited or deleted. Corrections require a roll-forward mission with compensating entries. |
| **BR7 — Single active close** | Only one `monthly-close` mission can be active (non-terminal) per company per period at a time. The unique constraint from M1 enforces this. |
| **BR8 — PCGE compliance** | All generated journal entries must reference valid PCGE account codes from the chart of accounts. Entries referencing missing or inactive accounts are rejected. |
| **BR9 — Exchange rate snapshots** | Closing entries in foreign currency must use the exchange rate frozen in the input snapshot, not the live rate. |
| **BR10 — Tax period integrity** | Tax provisions (IGV, Renta) must be calculated against the period's actual transaction data, not estimated. |

---

## 2. Scope: What's IN and OUT for M2

### 2.1 IN scope

1. **MonthlyCloseOrchestrator** — a new application service that executes the 10-step pipeline when a `monthly-close` mission transitions to `RUNNING`.
2. **Input Snapshot** — freeze ledger version, exchange rates, invoice dataset, bank reconciliation version, and active policies at execution start. Stored as immutable JSON on the mission.
3. **Readiness Gates** — automated gate evaluation (PASS/FAIL/WARN/UNKNOWN/NOT_APPLICABLE) before close proceeds. Replaces manual gate toggling.
4. **AccountingException** — typed, durable exception objects (not UI strings). Each exception carries: type, severity, affected account/transaction, suggested action, and whether it blocks the close.
5. **ClosingProposal** — a real accounting proposal containing: proposed journal entries (with debits/credits in cents), tax impact summary, P&L summary, financial ratios snapshot, and the evidence bundle.
6. **Transactional Apply** — atomic posting of approved closing entries to `journal_entries` + `journal_entry_lines`, period status transition to `cerrado_final`, and gate resolution.
7. **Roll-forward foundation** — correction mission intent that can reverse specific entries via compensating journal entries. The full roll-forward UI is deferred to M3.
8. **Mission execution handler** — wire the mission `RUNNING` state to invoke the `MonthlyCloseOrchestrator` instead of just logging a state transition.
9. **Checklist auto-population** — mission steps automatically create/update corresponding `close_checklist_items` so the manual checklist stays in sync.
10. **FiscalAgent integration** — the orchestrator invokes `FiscalNightlyRunUseCase` as the Collect→Categorize→Calculate steps, then extends with closing-specific steps.

### 2.2 OUT of scope (deferred to M3+)

- **Full roll-forward UI** — M2 builds the backend compensating-entry mechanism; the user-facing correction workflow is M3.
- **Multi-company batch close** — M2 closes one company per mission. Bulk orchestration across organizations is M4.
- **Audit workspace** — auditor-specific UI for reviewing closed periods is M3.
- **SUNAT direct filing (PDT, PLAME)** — generating and submitting tax declarations is M5.
- **Automatic depreciation schedule maintenance** — M2 reads existing fixed asset data; asset lifecycle management is a separate feature.
- **Real-time dashboard for in-progress close** — M2 provides SSE progress events; the dedicated dashboard is M3.
- **Close template/policy engine** — M2 uses hardcoded close steps. Configurable close policies per company/industry is M4.

---

## 3. Architecture: How Missions Bridge to Real Accounting

### 3.1 The Bridge: MonthlyCloseOrchestrator

M2 introduces a **MonthlyCloseOrchestrator** in `packages/application/src/use-cases/monthly-close/`. This is the bridge between the M1 mission state machine and the real accounting world.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MISSION STATE MACHINE (M1)                    │
│  DRAFT → QUEUED → RUNNING → AWAITING_APPROVAL → APPROVED → ... │
│                      │                                   │      │
│                      ▼                                   │      │
│  ┌──────────────────────────────────────┐                 │      │
│  │   MonthlyCloseOrchestrator (M2)      │                 │      │
│  │                                      │                 │      │
│  │  10-step pipeline:                   │                 │      │
│  │  1. Freeze snapshot                  │                 │      │
│  │  2. Validate readiness gates         │                 │      │
│  │  3. Analyze ledger (FiscalAgent)     │                 │      │
│  │  4. Analyze invoices (FiscalAgent)   │                 │      │
│  │  5. Analyze reconciliations          │                 │      │
│  │  6. Analyze compliance               │                 │      │
│  │  7. Detect blockers & exceptions     │                 │      │
│  │  8. Produce ClosingProposal          │                 │      │
│  │  9. Build evidence bundle            │                 │      │
│  │ 10. Request approval ────────────────►  AWAITING_APPROVAL   │
│  │                                      │       │              │
│  └──────────────────────────────────────┘       │              │
│                                                 ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Transactional Apply (on APPROVED)            │  │
│  │  - Post journal_entries + journal_entry_lines            │  │
│  │  - Update accounting_periods.status → cerrado_final      │  │
│  │  - Resolve close_gates                                   │  │
│  │  - Generate cryptographic receipt                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Package Placement

```
packages/application/src/use-cases/monthly-close/
├── monthly-close-orchestrator.ts    # 10-step pipeline orchestrator
├── steps/
│   ├── freeze-snapshot.step.ts      # Step 1
│   ├── validate-gates.step.ts       # Step 2
│   ├── analyze-ledger.step.ts       # Step 3 (delegates to FiscalAgent)
│   ├── analyze-invoices.step.ts     # Step 4 (delegates to FiscalAgent)
│   ├── analyze-reconciliations.step.ts  # Step 5
│   ├── analyze-compliance.step.ts   # Step 6
│   ├── detect-blockers.step.ts      # Step 7
│   ├── produce-proposal.step.ts     # Step 8
│   ├── build-evidence.step.ts       # Step 9
│   └── request-approval.step.ts     # Step 10
├── deliverables/
│   ├── input-snapshot.ts            # Deliverable 1
│   ├── readiness-gate.ts            # Deliverable 2
│   ├── accounting-exception.ts      # Deliverable 3
│   ├── closing-proposal.ts          # Deliverable 4
│   ├── transactional-apply.ts       # Deliverable 5
│   └── roll-forward.ts              # Deliverable 6
├── posting/
│   ├── journal-entry-posting.service.ts  # Atomic posting to journal_entries
│   └── period-close.service.ts          # Period status transitions
└── types.ts                         # All M2 types
```

### 3.3 Integration Points

| Integration | Direction | Mechanism |
|-------------|-----------|-----------|
| M1 mission state machine | Inbound | `executeMission()` invokes orchestrator on RUNNING transition |
| FiscalNightlyRunUseCase | Internal | Orchestrator wraps FiscalAgent steps 3-4 |
| PostgresJournalEntryRepository | Outbound | Posting service writes journal entries |
| PostgresAccountingPeriodRepository | Outbound | Period close service updates status |
| PostgresCloseChecklistRepository | Outbound | Auto-populate checklist items from mission steps |
| AccountingPR system | Outbound | Closing entries routed through PR for multi-signer approval |
| MissionsService (SSE) | Outbound | Progress events streamed via existing SSE infrastructure |
| M1 receipt system | Outbound | Cryptographic receipt for applied close |

### 3.4 Key Design Decisions

**Decision 1: Orchestrator as a new service, not inline in MissionsService.**
- MissionsService stays focused on state machine enforcement.
- MonthlyCloseOrchestrator is the execution harness that the mission invokes.
- This keeps the mission domain generic and the close logic testable in isolation.

**Decision 2: FiscalAgent is wrapped, not replaced.**
- Steps 3-4 delegate to `FiscalNightlyRunUseCase` for transaction collection, categorization, and calculation.
- The orchestrator adds closing-specific steps (depreciation, accruals, P&L close) that FiscalAgent doesn't do.
- This preserves the existing AI pipeline investment.

**Decision 3: Closing entries route through AccountingPR for approval.**
- Rather than bypassing the existing multi-signer workflow, the ClosingProposal creates an AccountingPR with the proposed entries.
- The PR's existing approval flow (DRAFT → PENDING_REVIEW → APPROVED → POSTED) governs posting.
- This avoids building a parallel approval system.

**Decision 4: Snapshot is stored on the mission as JSON, not a separate table.**
- The `accountingMissions` table already has a `proposal` JSONB column.
- We extend it with a `snapshot` JSONB column for the frozen input data.
- This keeps the mission as the single source of truth for the close execution.

---

## 4. 10-Step Pipeline Design

### Step 1: Freeze Input Snapshot

**Input**: companyId, fiscalPeriod
**Action**: Capture immutable copies of all data that could change during execution:
- Ledger version (last journal entry sequence number for the period)
- Invoice dataset version (last invoice ID or timestamp)
- Bank reconciliation version (last completed reconciliation ID)
- SIRE snapshot (last SUNAT discrepancy report)
- Exchange rates (buy/sell rates for each currency pair active in the period)
- Active accounting policies (depreciation method, tax regime, etc.)
**Output**: `CloseInputSnapshot` — stored as JSON on the mission. All subsequent steps reference this snapshot, not live data.
**Failure**: Non-blocking. Missing optional data (e.g., SIRE) degrades to WARN.

### Step 2: Validate Readiness Gates

**Input**: companyId, fiscalPeriod, snapshot
**Action**: Evaluate automated gates:
- `prior_period_closed`: prior period in `cerrado_final` or `auditado` → PASS/FAIL
- `bank_reconciled`: all bank accounts have a COMPLETED reconciliation for this period → PASS/FAIL/WARN
- `open_prs`: no open AccountingPRs for this period → PASS/FAIL
- `unverified_evidence`: all evidence items verified → PASS/FAIL
- `missing_depreciation`: fixed assets have depreciation calculated for this period → PASS/FAIL
- `pending_tax`: all tax obligations for the period are identified → PASS/WARN
- `period_open`: accounting period is in `abierto` state → PASS/FAIL
**Output**: `GateResults` — array of {gate, status, reason, evidence}. Stored on the mission.
**Failure**: FAIL on `prior_period_closed` or `period_open` blocks the close. Other FAILs become blockers in Step 7.

### Step 3: Analyze Ledger Data

**Input**: companyId, fiscalPeriod, snapshot
**Action**: Invoke `FiscalNightlyRunUseCase` (Collect + Categorize steps) to:
- Collect all transactions for the period from the ledger
- Categorize each transaction against PCGE accounts
- Flag low-confidence categorizations
**Output**: `LedgerAnalysis` — transactions with categorizations, confidence scores, exceptions.
**Failure**: Retry up to 3 times. Persistent failure → FAILED mission.

### Step 4: Analyze Invoices

**Input**: companyId, fiscalPeriod, snapshot
**Action**: Invoke FiscalAgent's invoice analysis:
- Match invoices to ledger entries
- Verify invoice SUNAT status (aceptado/rechazado/observado)
- Detect missing invoices or duplicate entries
**Output**: `InvoiceAnalysis` — matched/unmatched invoices, SUNAT status discrepancies.
**Failure**: Retry up to 3 times. Persistent failure → PARTIAL with exceptions.

### Step 5: Analyze Reconciliations

**Input**: companyId, fiscalPeriod, snapshot
**Action**: Verify bank reconciliations:
- Compare bank transaction totals against ledger entries
- Flag unmatched transactions
- Verify reconciliation completeness
**Output**: `ReconciliationAnalysis` — match rates, unmatched items, reconciliation status per account.
**Failure**: Unmatched items become exceptions; does not block the close.

### Step 6: Analyze Compliance State

**Input**: companyId, fiscalPeriod, snapshot
**Action**: Check compliance requirements:
- CPE (SUNAT) status for all invoices — any pendiente/rechazado?
- Detraction (SPOT) deposits for applicable transactions
- Exchange rate usage matches SUNAT reference rates within tolerance
- Tax regime obligations (IGV, Renta, retenciones)
**Output**: `ComplianceAnalysis` — violations, warnings, compliance score.
**Failure**: Violations become blockers or exceptions depending on severity.

### Step 7: Detect Blockers and Exceptions

**Input**: Results from steps 2-6
**Action**: Consolidate all issues:
- **Blocker**: prevents the close from proceeding (e.g., prior period not closed, unbalanced ledger)
- **Exception**: noteworthy but non-blocking (e.g., low-confidence categorization, minor SUNAT discrepancy)
- **Warning**: informational (e.g., exchange rate outside tolerance)
**Output**: `BlockerReport` — categorized list with severities, affected items, suggested actions.
**Failure**: If blockers exist, mission transitions to `BLOCKED` instead of `AWAITING_APPROVAL`.

### Step 8: Produce Closing Proposal

**Input**: All analysis results, no blockers present
**Action**: Generate the closing journal entries:
- **Depreciation entries**: debit depreciation expense, credit accumulated depreciation for each fixed asset
- **Accrual entries**: debit/credit for outstanding payables/receivables at period end
- **Tax provision entries**: debit tax expense, credit tax payable for IGV and Renta
- **P&L close entries**: close revenue accounts to P&L summary, close expense accounts to P&L summary
- **Balance sheet verification**: confirm A/R, A/P, inventory, and equity accounts
- All amounts in cents. All accounts validated against PCGE. Debits = Credits verified.
**Output**: `ClosingProposal` — array of proposed journal entries, tax impact summary, P&L summary, financial ratios.
**Failure**: If proposal generation fails → FAILED mission.

### Step 9: Build Evidence Bundle

**Input**: Snapshot, gate results, analysis reports, proposal
**Action**: Assemble the immutable evidence bundle:
- Snapshot metadata (when, what, version)
- Gate results (all gates with status and evidence)
- Exceptions log (all exceptions with suggested actions)
- Proposed journal entries (complete with account codes, descriptions, amounts)
- Tax impact calculation (taxable base, rate, liability)
- Financial impact summary (P&L, balance sheet effects)
- Hash the entire bundle → `evidenceHash`
**Output**: `EvidenceBundle` — stored on the mission proposal with versioning.
**Failure**: Non-blocking. Missing optional evidence degrades to WARN.

### Step 10: Request Approval → Apply → Receipt

**Input**: ClosingProposal, EvidenceBundle
**Action**:
1. Update mission state to `AWAITING_APPROVAL`
2. Set mission `proposal` with version, evidence, evidenceHash
3. SSE event: `PROPOSAL_CREATED`
4. Human approves via existing M1 approve flow (with evidence verification)
5. On `APPROVED` → `TransactionalApply`:
   - Open DB transaction
   - Insert all closing journal entries (header + lines)
   - Update `accounting_periods.status` → `cerrado_final`
   - Resolve all close_gates to PASSED
   - Commit transaction
   - Generate cryptographic receipt
   - Mission → `COMPLETED`
**Output**: Applied journal entries, updated period, receipt.
**Failure**: If any entry fails validation → rollback entire transaction, mission → `FAILED`.

---

## 5. Six Deliverables

### D1: Input Snapshot

**File**: `packages/application/src/use-cases/monthly-close/deliverables/input-snapshot.ts`

```typescript
interface CloseInputSnapshot {
  missionId: string;
  companyId: string;
  fiscalPeriod: string;
  frozenAt: string; // ISO timestamp

  ledgerVersion: { lastEntrySequence: number; totalEntries: number };
  invoiceVersion: { lastInvoiceId: string | null; totalInvoices: number };
  bankReconVersion: { lastReconciliationId: string | null; completedCount: number };
  sireSnapshot: { lastRunId: string | null; discrepancyCount: number };
  exchangeRates: Array<{ currencyFrom: string; currencyTo: string; buyRate: number; sellRate: number }>;
  activePolicies: { depreciationMethod: string; taxRegime: string };

  hash: string; // SHA-256 of the snapshot content
}
```

**Sub-items**:
- [x] `freezeSnapshot()` function — reads current state from repositories, returns immutable snapshot
- [x] `verifySnapshotIntegrity()` — recomputes hash, compares with stored hash
- [x] Unit tests: snapshot captures correct data, hash is deterministic, integrity check catches tampering

### D2: Readiness Gates

**File**: `packages/application/src/use-cases/monthly-close/deliverables/readiness-gate.ts`

```typescript
type GateStatus = "PASS" | "FAIL" | "WARN" | "UNKNOWN" | "NOT_APPLICABLE";

interface ReadinessGate {
  gateType: "prior_period_closed" | "bank_reconciled" | "open_prs"
    | "unverified_evidence" | "missing_depreciation" | "pending_tax"
    | "period_open";
  status: GateStatus;
  reason: string;
  evidenceIds: string[];
  evaluatedAt: string;
}

interface GateResults {
  gates: ReadinessGate[];
  overallStatus: GateStatus; // most severe: FAIL > WARN > UNKNOWN > PASS > NOT_APPLICABLE
  blockingGates: ReadinessGate[]; // gates with status FAIL that block the close
}
```

**Sub-items**:
- [x] Gate evaluator functions — one per gate type, querying real data
- [x] `evaluateAllGates()` — runs all evaluators, returns GateResults
- [x] Integration with existing `close_gates` table — writes results back for dashboard visibility
- [x] Unit tests: each gate evaluator, overall status calculation, blocking gate detection

### D3: AccountingException

**File**: `packages/application/src/use-cases/monthly-close/deliverables/accounting-exception.ts`

```typescript
type ExceptionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface AccountingException {
  id: string;
  type: "LOW_CONFIDENCE_CATEGORIZATION" | "SUNAT_DISCREPANCY"
    | "AMOUNT_MISMATCH" | "UNMATCHED_TRANSACTION"
    | "MISSING_DEPRECIATION" | "TAX_CALCULATION_ANOMALY"
    | "EXCHANGE_RATE_DEVIATION" | "MISSING_DOCUMENT"
    | "PERIOD_OVERLAP" | "UNBALANCED_ENTRY";
  severity: ExceptionSeverity;
  affectedEntityId: string;   // transaction, account, invoice, or asset ID
  affectedEntityType: string;  // "transaction" | "account" | "invoice" | "asset"
  description: string;
  suggestedAction: string;
  blocksClose: boolean;        // CRITICAL severity → blocks close
  evidenceIds: string[];
  createdAt: string;
}
```

**Sub-items**:
- [x] Exception factory functions — typed constructors per exception type
- [x] `ExceptionCollector` — accumulates exceptions during pipeline execution
- [x] `toBlockers()` — converts CRITICAL exceptions to mission blockers
- [x] Unit tests: each exception type, collector aggregation, blocker conversion

### D4: ClosingProposal

**File**: `packages/application/src/use-cases/monthly-close/deliverables/closing-proposal.ts`

```typescript
interface ProposedJournalEntry {
  entryType: "DEPRECIATION" | "ACCRUAL" | "TAX_PROVISION" | "PL_CLOSE" | "CORRECTION";
  description: string;
  date: string; // YYYY-MM-DD
  lines: Array<{
    accountCode: string;     // PCGE account code
    accountName: string;     // resolved from chart of accounts
    description: string;
    debitCents: number;
    creditCents: number;
  }>;
  totalDebits: number;       // sum of debitCents — must equal totalCredits
  totalCredits: number;      // sum of creditCents — must equal totalDebits
  sourceEvidence: string[];  // IDs of evidence items supporting this entry
}

interface ClosingProposal {
  id: string;
  missionId: string;
  version: number;
  fiscalPeriod: string;
  generatedAt: string;

  proposedEntries: ProposedJournalEntry[];
  entryCount: number;
  totalDebitCents: number;
  totalCreditCents: number;

  taxImpact: {
    igvPayableCents: number;
    rentaPayableCents: number;
    totalTaxLiabilityCents: number;
  };

  plSummary: {
    totalRevenueCents: number;
    totalExpenseCents: number;
    netIncomeCents: number;
  };

  financialRatios: {
    currentRatio: number | null;
    debtRatio: number | null;
    grossMargin: number | null;
  };

  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  evidenceHash: string;
}
```

**Sub-items**:
- [x] Depreciation entry generator — queries fixed_assets, calculates monthly depreciation, generates balanced entry
- [x] Accrual entry generator — identifies outstanding payables/receivables for period
- [x] Tax provision generator — calculates IGV and Renta provisions from transaction data
- [x] P&L close generator — summarizes revenue/expense accounts, generates closing entries
- [x] Balance verification — debits = credits assertion on every entry
- [x] PCGE account validation — every account code checked against `pcge_accounts`
- [x] Unit tests: each generator, balance verification, PCGE validation, full proposal assembly

### D5: Transactional Apply

**File**: `packages/application/src/use-cases/monthly-close/deliverables/transactional-apply.ts`

**Sub-items**:
- [x] `TransactionalApplyUseCase` — wraps the entire apply in a database transaction
- [x] Journal entry posting — inserts into `journal_entries` + `journal_entry_lines` with proper entry numbers
- [x] Period status update — transitions `accounting_periods.status` to `cerrado_final`
- [x] Gate resolution — all relevant `close_gates` updated to PASSED
- [x] Atomicity guarantee — any failure in posting, period update, or gate resolution rolls back everything
- [x] Receipt generation — cryptographic receipt for the applied close using M1 receipt infrastructure
- [x] Integration tests: successful apply, partial failure rollback, duplicate entry prevention, period guard

### D6: Roll-Forward (Correction Missions)

**File**: `packages/application/src/use-cases/monthly-close/deliverables/roll-forward.ts`

**Sub-items**:
- [x] `RollForwardCommand` type — specifies the original mission, the entries to reverse, and the reason
- [x] `generateCompensatingEntries()` — given original entries, produces mirror entries (debit↔credit swap) with reference to the original
- [x] New mission intent: `correction` — added to `MissionIntent` union
- [x] Correction missions use the same approve→apply→receipt flow as regular closes
- [x] Compensating entries reference the original entry via `correctionOf` field on `journal_entries`
- [x] Unit tests: compensating entry generation, correction mission creation, original entry reference

---

## 6. Delivery Plan (3 PRs)

### PR1: Domain Types + Snapshot + Gates (estimated ~600 lines)

**Focus**: New types, snapshot freezing, and automated gate evaluation. No posting logic yet.

| # | Task | Files |
|---|------|-------|
| 1 | Create `packages/application/src/use-cases/monthly-close/types.ts` — all M2 types (CloseInputSnapshot, ReadinessGate, AccountingException, ClosingProposal, etc.) | `types.ts` |
| 2 | Create `freeze-snapshot.step.ts` — snapshot freezing logic with integrity hash | `steps/freeze-snapshot.step.ts` |
| 3 | Create `input-snapshot.ts` — D1 deliverable with freeze + verify | `deliverables/input-snapshot.ts` |
| 4 | Create `validate-gates.step.ts` — Step 2 gate evaluation | `steps/validate-gates.step.ts` |
| 5 | Create `readiness-gate.ts` — D2 deliverable with all 7 gate evaluators | `deliverables/readiness-gate.ts` |
| 6 | Create `accounting-exception.ts` — D3 deliverable with exception types and collector | `deliverables/accounting-exception.ts` |
| 7 | Unit tests for D1, D2, D3 (~20 tests) | `__tests__/` |

**Gate**: Types compile, tests pass, gate evaluators return correct results against test data.

### PR2: Pipeline Steps 3-9 + ClosingProposal (estimated ~800 lines)

**Focus**: The orchestrator pipeline, FiscalAgent integration, and proposal generation.

| # | Task | Files |
|---|------|-------|
| 1 | Create `analyze-ledger.step.ts` + `analyze-invoices.step.ts` — wrap FiscalAgent | `steps/` |
| 2 | Create `analyze-reconciliations.step.ts` — bank reconciliation verification | `steps/` |
| 3 | Create `analyze-compliance.step.ts` — SUNAT, detractions, exchange rate checks | `steps/` |
| 4 | Create `detect-blockers.step.ts` — consolidate exceptions into blockers | `steps/` |
| 5 | Create `produce-proposal.step.ts` — depreciation, accruals, tax, P&L close generators | `steps/` |
| 6 | Create `closing-proposal.ts` — D4 deliverable with full proposal assembly | `deliverables/closing-proposal.ts` |
| 7 | Create `build-evidence.step.ts` + evidence bundle assembly | `steps/` |
| 8 | Create `monthly-close-orchestrator.ts` — 10-step pipeline executor with retry logic | `orchestrator.ts` |
| 9 | Create `request-approval.step.ts` — Step 10: transition to AWAITING_APPROVAL | `steps/` |
| 10 | Integration tests for full pipeline (happy path, blocked path, partial path) | `__tests__/` |

**Gate**: Full pipeline runs end-to-end with test data, produces valid ClosingProposal, transitions mission correctly.

### PR3: Transactional Apply + Roll-Forward + Mission Integration (estimated ~700 lines)

**Focus**: Posting to real database tables, period close, and wiring into the mission system.

| # | Task | Files |
|---|------|-------|
| 1 | Create `journal-entry-posting.service.ts` — atomic posting to journal_entries + lines | `posting/` |
| 2 | Create `period-close.service.ts` — period status transition with guards | `posting/` |
| 3 | Create `transactional-apply.ts` — D5 deliverable with full transactional apply | `deliverables/transactional-apply.ts` |
| 4 | Create `roll-forward.ts` — D6 deliverable with compensating entries | `deliverables/roll-forward.ts` |
| 5 | Add `correction` intent to `MissionIntent` in mission-domain | `packages/mission-domain/src/mission-contracts.ts` |
| 6 | Wire `executeMission()` → invoke `MonthlyCloseOrchestrator` for `monthly-close` intent | `apps/api/src/features/missions/missions.service.ts` |
| 7 | Wire `APPROVED` transition → invoke `TransactionalApply` for `monthly-close` intent | `apps/api/src/features/missions/missions.service.ts` |
| 8 | Auto-populate `close_checklist_items` from mission steps | `orchestrator.ts` (checklist sync) |
| 9 | SSE progress events during pipeline execution | `steps/` (event emission) |
| 10 | Integration tests: full close cycle, rollback on failure, correction mission | `__tests__/` |
| 11 | Migration for any new columns (snapshot JSONB on accounting_missions, correctionOf on journal_entries) | `packages/infrastructure/drizzle/` |

**Gate**: Real monthly close executes end-to-end, journal entries posted, period closed, receipt generated.

---

## 7. Risks and Non-Goals

### 7.1 Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **FiscalAgent instability** — if the AI pipeline produces garbage categorizations, the close is wrong | HIGH | Each FiscalAgent step output is validated before use. Low-confidence categorizations become exceptions, not silent errors. The accountant reviews the proposal before approving. |
| **Race condition on period close** — two missions for the same period attempt to close simultaneously | MEDIUM | M1 already enforces unique (company, period, intent). Only one monthly-close mission per period. Additionally, the transactional apply locks the period row with SELECT...FOR UPDATE. |
| **Large period data** — a period with 50,000+ transactions could cause pipeline timeout | MEDIUM | Each step has a progress callback. The SSE stream sends incremental progress. Timeout handling from M1 (UNKNOWN state) applies. Large periods may need batch processing (M4). |
| **Exchange rate drift** — rates change between snapshot and approval | LOW | The snapshot freezes rates at execution start. All entries use snapshotted rates. Evidence hash includes rate data — if rates change, evidence mismatch blocks approval. |
| **Depreciation calculation complexity** — Peruvian tax rules have multiple depreciation methods and percentages | MEDIUM | M2 implements the most common method (straight-line) with configurable useful life. Complex depreciation (accelerated, revaluation) is deferred to M4. The depreciation step flags assets with non-standard methods as WARN. |
| **Breaking M1 mission table** — adding columns or changing schema could break M1 | LOW | New columns are additive (snapshot JSONB, correctionOf varchar). No existing columns are modified. Backward-compatible migration. |

### 7.2 Non-Goals

- **This is NOT a general ledger system** — M2 closes periods, it does not replace the existing journal entry CRUD.
- **This is NOT a tax filing system** — M2 calculates tax provisions for the close, it does not generate PDT/PLAME files for SUNAT.
- **This is NOT a multi-currency accounting engine** — M2 handles PEN and USD (the two currencies in the existing schema). Full multi-currency with revaluation is M5.
- **This is NOT a real-time close dashboard** — M2 emits SSE progress events. A dedicated close-monitoring dashboard with charts, comparisons, and history is M3.
- **This is NOT a configurable close policy engine** — M2 uses hardcoded close steps. Company-specific close checklists, custom gate rules, and policy templates are M4.

---

## 8. Definition of Done

M2 is **done** when:

1. **End-to-end close executes**: A user creates a `monthly-close` mission, clicks "Iniciar", and the 10-step pipeline runs to completion producing a `ClosingProposal` with real journal entries, tax impact, and evidence bundle.
2. **Gates are automated**: All 7 readiness gates evaluate against real database state. FAIL on `prior_period_closed` or `period_open` blocks the close.
3. **Proposal is reviewable**: The `AWAITING_APPROVAL` state presents the full evidence bundle with versioned, hash-verified content. Evidence mismatch on approval is rejected.
4. **Apply is atomic**: Approving the proposal posts all closing journal entries, updates the period status to `cerrado_final`, and resolves gates in a single database transaction.
5. **Receipt is verifiable**: The applied close generates a cryptographic receipt using M1's SHA-256 receipt infrastructure. The receipt can be independently verified.
6. **Exceptions are durable**: All issues (low-confidence categorizations, SUNAT discrepancies, unmatched transactions) are captured as typed `AccountingException` objects with severity, suggested action, and blocking status.
7. **Correction missions are possible**: A `correction` intent mission can generate compensating entries that reference the original closing entries. The correction follows the same approve→apply→receipt flow.
8. **Checklists stay in sync**: Mission steps automatically create or update `close_checklist_items` so the manual checklist reflects the automated close progress.
9. **No regressions in M1**: All existing M1 tests pass. The mission state machine, idempotency, concurrency control, SSE streaming, and receipt verification continue to work unchanged.
10. **All tests pass**: Unit tests for every step and deliverable. Integration tests for the full pipeline (happy path, blocked path, partial completion, rollback). No quarantine-worthy failures.

---

## Appendix: Product Decisions (2026-07-30)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approval workflow | **Multi-signer AccountingPR** | Reuse existing N-of-M signatures for audit compliance |
| Blocked close | **BLOCKED until resolved** | Safety first — no partial closes |
| Post-close correction | **Next period adjustment** | Aligned with Peruvian accounting norms |
| FiscalAgent failure | **Block on persistent FAILED** | Data integrity over convenience |
| First period gate | **NOT_APPLICABLE automatic** | Zero friction for new companies |
