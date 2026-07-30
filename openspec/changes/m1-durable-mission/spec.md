# M1 — Durable Monthly Close Mission — Technical Specification

**Status:** Draft
**Date:** 2026-07-30
**Parent proposal:** `openspec/changes/m1-durable-mission/proposal.md`

## 1. packages/mission-domain/

The `mission-domain` package is the single source of truth for mission state, transitions, errors, contracts, events, and receipts. It MUST be consumed by `apps/web`, `apps/api`, and any future CLI or test harness.

### 1.1 mission-status.ts — 11-State Machine

The system MUST export `AccountingMissionStatus` with exactly 11 states: DRAFT, QUEUED, RUNNING, BLOCKED, AWAITING_APPROVAL, APPROVED, REJECTED, REVISION_REQUESTED, COMPLETED, FAILED, UNKNOWN.

VALID_TRANSITIONS:
- DRAFT → QUEUED
- QUEUED → RUNNING, FAILED
- RUNNING → BLOCKED, AWAITING_APPROVAL, COMPLETED, FAILED, UNKNOWN
- BLOCKED → RUNNING, FAILED
- AWAITING_APPROVAL → APPROVED, REJECTED, RUNNING
- APPROVED → COMPLETED, FAILED
- REJECTED → REVISION_REQUESTED
- REVISION_REQUESTED → QUEUED
- COMPLETED → (none)
- FAILED → (none)
- UNKNOWN → RUNNING, FAILED, COMPLETED (recovery)

TERMINAL_STATES = { COMPLETED, FAILED }. REJECTED is NOT terminal.

Functions: transition(), isRunnable(), isAwaitingApproval(), isTerminal().

### 1.2 mission-transitions.ts

validateTransition() — throws MissionError(INVALID_TRANSITION) on invalid.
guardTerminal() — throws MissionError(TERMINAL_STATE_GUARD, 409).
reconcileTransition() — validates UNKNOWN state and resolution.
isValidRecoveryPath() — true only for UNKNOWN to RUNNING/FAILED/COMPLETED.

### 1.3 mission-errors.ts

MissionErrorCode enum with codes: INVALID_TRANSITION, VERSION_CONFLICT, IDEMPOTENCY_CONFLICT, TENANT_MISMATCH, MISSION_NOT_FOUND, ALREADY_EXECUTING, TERMINAL_STATE_GUARD, RECEIPT_VERIFICATION, SSE_CONNECTION_LOST, HARNESS_TIMEOUT, UNAUTHORIZED, FORBIDDEN.

MissionError extends Error with code, statusCode (default 400), details.
isMissionError() type guard.

### 1.4 mission-contracts.ts

Types: RunIntentCommand, ApproveCommand, RejectCommand (reason REQUIRED), ReconcileCommand, MissionStep, MissionProposal (new evidenceHash field), MissionRejection, MissionBlocker, MissionSnapshot, HarnessError.

### 1.5 mission-events.ts

MissionEventType enum: STATE_TRANSITION, PROGRESS_UPDATE, BLOCKER_ADDED, BLOCKER_RESOLVED, PROPOSAL_CREATED, APPROVAL_DECIDED, COMPLETED, FAILED, TIMEOUT, UNKNOWN, RECONCILED, KEEPALIVE.

MissionEvent: id, missionId, sequence, eventType, snapshot (full MissionSnapshot), createdAt.

SSE: data: {json}\n\n, heartbeat :keepalive\n\n.
parseSSEEvent(), isKeepalive().

### 1.6 mission-receipt.ts

ReceiptContent: missionId, companyId, actorId, decision, proposalVersion, evidenceHash, previousStatus, newStatus, payloadHash, timestamp.

generateReceiptHash() — canonical sort by key, SHA-256 hex.
verifyReceiptIntegrity() — recompute and compare.

---

## 2. API Specification

All routes are scoped under `/api/v1/missions` and use `companyScopeGuard({ allowHeaderFallback: false })`.

### 2.1 Routes

#### POST /api/v1/missions — Create Mission

Creates a new mission in DRAFT state. Body: `RunIntentCommand`. Returns 201 with MissionSnapshot (version 1).

Errors: 409 IDEMPOTENCY_CONFLICT (key reused with different payload), 400 validation.

#### GET /api/v1/missions/:id — Get Mission Snapshot

Polling/reconnection endpoint. Returns canonical MissionSnapshot. Supports `Last-Event-ID` header for SSE catchup.

Errors: 404 MISSION_NOT_FOUND, 403 TENANT_MISMATCH.

#### POST /api/v1/missions/:id/execute — Execute Mission (SSE Stream)

Transitions from runnable state to QUEUED → RUNNING. Returns `Content-Type: text/event-stream`.

Requires: `X-Idempotency-Key`, `Last-Event-ID` (for resume). Body: `{ expectedMissionVersion }`.

Idempotency: same key + same payload → replay events from mission_events. Same key + different payload → 409.

Errors: 409 VERSION_CONFLICT, 409 IDEMPOTENCY_CONFLICT, 409 ALREADY_EXECUTING, 400 INVALID_TRANSITION, 409 TERMINAL_STATE_GUARD.

#### POST /api/v1/missions/:id/approve — Approve Proposal

Transitions AWAITING_APPROVAL → APPROVED. Generates receipt with SHA-256 hash. Returns `{ missionId, status, version, receiptId, receiptHash }`.

Requires: `X-Idempotency-Key`. Body: `{ proposalId, proposalVersion, idempotencyKey, expectedMissionVersion }`.

Errors: 409 VERSION_CONFLICT, 409 INVALID_TRANSITION, 409 IDEMPOTENCY_CONFLICT.

#### POST /api/v1/missions/:id/reject — Reject Proposal

Transitions AWAITING_APPROVAL → REJECTED. `reason` is REQUIRED and non-empty. Returns receipt.

Errors: 400 (reason required), 409 VERSION_CONFLICT, 409 INVALID_TRANSITION.

#### POST /api/v1/missions/:id/reconcile — Reconcile UNKNOWN State

Resolves mission stuck in UNKNOWN. Body: `{ resolution, reason, idempotencyKey, expectedMissionVersion }`. Resolution must be RUNNING, FAILED, or COMPLETED.

Errors: 400 INVALID_TRANSITION (not UNKNOWN), 400 (invalid resolution), 409 VERSION_CONFLICT.

### 2.2 Idempotency Middleware

Reads `X-Idempotency-Key` header. Computes SHA-256 of canonical request body (sorted keys).

- Same key + same payload_hash → return cached response (SSE replay for execute, cached JSON for others)
- Same key + different payload_hash → 409 IDEMPOTENCY_CONFLICT
- No match → atomically INSERT + execute within same transaction

Idempotency records have `expires_at = NOW() + 7 days`.

### 2.3 Concurrency Middleware

Every mutating endpoint includes `expectedMissionVersion`. UPDATE uses:

```sql
UPDATE accounting_missions
SET version = version + 1, ...
WHERE id = $missionId AND version = $expectedMissionVersion
RETURNING version
```

0 affected rows → 409 VERSION_CONFLICT with current version in response.

### 2.4 SSE Protocol

- Content-Type: text/event-stream, Cache-Control: no-cache
- Each event: `data: {sequence, eventType, snapshot}

` (single-line JSON, full MissionSnapshot)
- Heartbeat every 15s: `:keepalive

`
- Client sends `Last-Event-ID: N` to resume. Server queries `mission_events WHERE sequence > N`, sends catchup, then subscribes via PostgreSQL LISTEN/NOTIFY on channel `mission_events_channel`
- Fallback: polling every 1s if LISTEN/NOTIFY unavailable
- Connection close: cleanup LISTEN, do NOT change mission state
- 60s without reconnect: mission continues, snapshot available via GET

### 2.5 Company Scope Guard

All routes use `companyScopeGuard({ allowHeaderFallback: false })`. Every query scoped by `company_id`. Tenant isolation: verify `companyContext.companyId === mission.companyId` (403 otherwise). Approve/reject: verify `companyContext.userId === actorId` (403 otherwise).

---

## 3. Database Schema (Drizzle)

Schema file: `packages/persistence/src/schema/mission.schema.ts`. Follows existing Drizzle patterns from `monthly-close.schema.ts`.

### 3.1 accounting_missions

```typescript
export const accountingMissions = pgTable(
  "accounting_missions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id).notNull(),
    fiscalPeriod: varchar("fiscal_period", { length: 7 }).notNull(), // YYYY-MM
    intent: varchar("intent", { length: 30 }).$type<MissionIntent>().notNull(),
    status: varchar("status", { length: 25 }).$type<MissionStatus>().default("DRAFT").notNull(),
    version: integer("version").default(1).notNull(),
    progress: real("progress").default(0).notNull(),
    input: jsonb("input").$type<{ instruction: string }>(),
    proposal: jsonb("proposal").$type<MissionProposal>(),
    rejection: jsonb("rejection").$type<MissionRejection>(),
    receiptId: uuid("receipt_id"),
    receiptHash: text("receipt_hash"),
    lastEventSequence: integer("last_event_sequence").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyFiscalIntentUnq: uniqueIndex("acct_missions_company_period_intent_unq")
      .on(table.companyId, table.fiscalPeriod, table.intent),
    companyStatusIdx: index("acct_missions_company_status_idx")
      .on(table.companyId, table.status),
    statusIdx: index("acct_missions_status_idx").on(table.status),
  }),
);
```

Unique constraint: one mission per (companyId, fiscalPeriod, intent).

### 3.2 mission_idempotency

```typescript
export const missionIdempotency = pgTable(
  "mission_idempotency",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id).notNull(),
    commandType: varchar("command_type", { length: 30 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    payloadHash: text("payload_hash").notNull(),
    missionId: uuid("mission_id"),
    executionStatus: varchar("execution_status", { length: 20 })
      .$type<"EXECUTING" | "COMPLETED" | "FAILED">().notNull(),
    response: jsonb("response"),
    responseStatusCode: integer("response_status_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    companyKeyUnq: uniqueIndex("mission_idempotency_company_key_unq")
      .on(table.companyId, table.idempotencyKey),
    expiresAtIdx: index("mission_idempotency_expires_at_idx").on(table.expiresAt),
  }),
);
```

### 3.3 mission_events

```typescript
export const missionEvents = pgTable(
  "mission_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id")
      .references(() => accountingMissions.id, { onDelete: "cascade" }).notNull(),
    sequence: integer("sequence").notNull(),
    eventType: varchar("event_type", { length: 30 }).notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    missionSequenceUnq: uniqueIndex("mission_events_mission_sequence_unq")
      .on(table.missionId, table.sequence),
    missionSequenceIdx: index("mission_events_mission_sequence_idx")
      .on(table.missionId, table.sequence),
  }),
);
```

Sequence assigned atomically: `COALESCE(MAX(sequence), 0) + 1` within transaction.

### 3.4 mission_receipts

```typescript
export const missionReceipts = pgTable(
  "mission_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    missionId: uuid("mission_id").references(() => accountingMissions.id).notNull(),
    companyId: uuid("company_id").references(() => companies.id).notNull(),
    actorId: varchar("actor_id", { length: 255 }).notNull(),
    decision: varchar("decision", { length: 10 }).$type<"APPROVE" | "REJECT">().notNull(),
    proposalVersion: integer("proposal_version").notNull(),
    evidenceHash: text("evidence_hash").notNull(),
    previousStatus: varchar("previous_status", { length: 25 }).$type<MissionStatus>().notNull(),
    newStatus: varchar("new_status", { length: 25 }).$type<MissionStatus>().notNull(),
    payloadHash: text("payload_hash").notNull(),
    receiptHash: text("receipt_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    missionIdIdx: index("mission_receipts_mission_id_idx").on(table.missionId),
    companyIdIdx: index("mission_receipts_company_id_idx").on(table.companyId),
    receiptHashUnq: uniqueIndex("mission_receipts_hash_unq").on(table.receiptHash),
  }),
);
```

Receipts are immutable (never updated). receiptHash unique index guarantees no duplicates.

---

## 4. Frontend Refactor Specification

Current: `MissionWorkspace.tsx` (385 lines, monolithic), `useAccountingMission.ts` (187 lines), `accounting-mission.service.ts` (single file).

### 4.1 Component Split (10 subcomponents)

| Component | File | Responsibility |
|-----------|------|----------------|
| MissionHeader | `components/mission/MissionHeader.tsx` | Status icon, phase label, simulation badge, title |
| MissionStateView | `components/mission/MissionStateView.tsx` | Delegates to appropriate subcomponent per state |
| MissionProgress | `components/mission/MissionProgress.tsx` | Progress bar, steps list, blockers section |
| MissionBlockedState | `components/mission/MissionBlockedState.tsx` | Blockers display with severity-aware styling |
| MissionUnknownState | `components/mission/MissionUnknownState.tsx` | Reconciliation dialog with resolution buttons |
| MissionApprovalGate | `components/mission/MissionApprovalGate.tsx` | Proposal summary, evidence, risk, approve/reject |
| MissionEvidenceBundle | `components/mission/MissionEvidenceBundle.tsx` | Evidence list with version indicator (immutable) |
| MissionReceipt | `components/mission/MissionReceipt.tsx` | Receipt ID with copy-to-clipboard |
| MissionActions | `components/mission/MissionActions.tsx` | Contextual buttons: Start, Reset, Revise |
| MissionWorkspace | `components/MissionWorkspace.tsx` | Orchestrator — composes all subcomponents |

All subcomponents receive props only (no hook calls). MissionWorkspace instantiates `useAccountingMission` and passes derived state down.

### 4.2 Hook Split (reducer + 5 focused hooks)

**useMissionReducer** — `useReducer` with typed actions:
- MISSION_EVENT_RECEIVED { snapshot }
- APPROVAL_COMPLETED { receiptId }
- REJECTION_COMPLETED { reason, rejectedBy, proposalVersion }
- REVISION_REQUESTED
- ERROR_OCCURRED { error, status }
- RECONNECT_SUCCEEDED { snapshot }
- RECONNECT_FAILED { error }
- RESET

**useMissionSnapshot(missionId)** — polls GET /missions/:id on mount, returns snapshot + reconnect.

**useMissionExecution()** — manages SSE stream via executeRunIntent AsyncGenerator, provides abort().

**useMissionEventStream(missionId, fromSequence)** — SSE resume with auto-reconnect (exponential backoff: 1s, 2s, 4s, 8s, max 30s), sequence deduplication, heartbeat handling.

**useMissionDecision()** — approve/reject with idempotency keys, returns receiptId.

**useMissionRecovery()** — reconcile() for UNKNOWN resolution.

### 4.3 Service Split (6 files)

| File | Purpose |
|------|---------|
| `mission-client.ts` | fetch wrapper: auth headers, JSON parse, HarnessError on non-2xx |
| `http-mission-transport.ts` | Real HTTP: createMission, getMission, approveMission, rejectMission, reconcileMission |
| `mock-mission-transport.ts` | Mock generator: includes UNKNOWN state simulation |
| `sse-mission-stream.ts` | SSE parsing, sequence dedup, reconnection with Last-Event-ID |
| `mission-errors.ts` | mapAPIErrorToHarnessError, isHarnessError, getErrorMessage (Spanish) |
| `mission-contracts.ts` | Re-export barrel from @drenyra/mission-domain |

---

## 5. Test Matrix

### 5.1 Unit Tests (packages/mission-domain/src/__tests__/)

**mission-status.test.ts** (33 tests):
- Every valid transition tested both ways (20 tests: DRAFT→QUEUED, QUEUED→RUNNING, QUEUED→FAILED, RUNNING→{BLOCKED,AWAITING_APPROVAL,COMPLETED,FAILED,UNKNOWN}, BLOCKED→{RUNNING,FAILED}, AWAITING_APPROVAL→{APPROVED,REJECTED,RUNNING}, APPROVED→{COMPLETED,FAILED}, REJECTED→REVISION_REQUESTED, REVISION_REQUESTED→QUEUED, UNKNOWN→{RUNNING,FAILED,COMPLETED})
- Invalid transitions throw (12 tests: DRAFT→AWAITING_APPROVAL, DRAFT→COMPLETED, DRAFT→APPROVED, COMPLETED→any, FAILED→any, REJECTED→APPROVED, REJECTED→COMPLETED, QUEUED→COMPLETED, AWAITING_APPROVAL→COMPLETED, UNKNOWN→DRAFT)
- Predicates (10 tests: isRunnable x5 states, isAwaitingApproval x2 states, isTerminal x4 states)

**mission-transitions.test.ts** (12 tests):
- validateTransition valid/invalid, guardTerminal on terminal/non-terminal, reconcileTransition all 3 valid paths, reconcile from non-UNKNOWN, reconcile with invalid resolution, isValidRecoveryPath valid/invalid

**mission-receipt.test.ts** (6 tests):
- Deterministic hash, different content different hash, field-order independence, verifyIntegrity valid/tampered, serialization round-trip

**mission-contracts.test.ts** (3 tests):
- MissionSnapshot serialization, RunIntentCommand required fields, RejectCommand has required reason

**mission-events.test.ts** (6 tests):
- parseSSEEvent valid/heartbeat/empty/malformed, isKeepalive heartbeat/data

### 5.2 Integration Tests (API)

**State Machine Enforcement** (12 tests):
- Create → DRAFT (201), Execute DRAFT → QUEUED→RUNNING, Execute COMPLETED → 409, Execute FAILED → 409, Execute RUNNING → 409, Approve AWAITING_APPROVAL → APPROVED, Approve DRAFT → 409, Reject AWAITING_APPROVAL → REJECTED, Reject without reason → 400, Reconcile UNKNOWN→RUNNING, Reconcile DRAFT → 400, Full lifecycle DRAFT→...→COMPLETED

**Idempotency** (5 tests):
- Execute same key twice → same result, same key different body → 409, Approve same key twice → same receiptId, Create same key twice → same missionId, Expired key → new record

**Concurrency** (4 tests):
- Approve correct version → 200, stale version → 409, concurrent approves → one wins, execute after version change → 409

**SSE Protocol** (6 tests):
- Heartbeat every 15s, monotonic sequences, resume from Last-Event-ID, no duplicate events on reconnect, full snapshot per event, reconnect receives missed events

**Tenant Isolation** (4 tests):
- GET cross-company → 403/404, Approve cross-company → 403, Execute cross-company body → 403, Reconcile cross-company → 403

### 5.3 Security Tests (10 tests)

- No auth → 401, Invalid token → 401, Cross-tenant access → 403, companyId mismatch → 403, RUC manipulation → 400/403, Approval without role → 403, Receipt cross-tenant → 403/404, Idempotency key cross-company → separate scope, SQL injection in missionId → parameterized, XSS in reason field → escaped

### 5.4 Browser Tests (Playwright, 10 tests)

- Workspace opens without auto-execute, Click starts mission once, Reload during RUNNING recovers, Two tabs don't duplicate, Rejection requires reason, Simulation badge visible, UNKNOWN allows reconciliation, Browser back safe, SSE reconnect after network interruption, Receipt ID copy to clipboard

---

## Appendix A: Deprecation Notes

### A.1 Frontend mission-status.ts
`apps/web/src/features/workspace/model/mission-status.ts` SHALL be deprecated after PR1 publishes `@drenyra/mission-domain`. Frontend SHALL import from shared package. File removed in PR3.

### A.2 isTerminal(REJECTED) Behavior Change
Currently returns `true` in frontend. Canonical domain returns `false`. UI handles REJECTED state independently of domain predicate.

### A.3 RejectCommand Split
Current `ApproveCommand` uses `decision: "APPROVE" | "REJECT"` with optional `reason`. Canonical domain splits into separate `ApproveCommand` and `RejectCommand`, with `RejectCommand.reason` REQUIRED.

---

## Appendix B: Quarantine Register Contract

File: `docs/testing/quarantine-register.md`. Columns: Test ID, File, Reason, Quarantined date, Deadline, Owner. Every quarantined test MUST have a deadline within M1 milestone. Tests exceeding deadline SHALL be fixed or deleted — never left indefinitely.
