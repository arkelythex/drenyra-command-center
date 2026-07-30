# M1 — Durable Monthly Close Mission — Implementation Tasks

**Status:** Planned | **Date:** 2026-07-30

## Review Workload Forecast

Estimated changed lines: about 1900 across 3 PRs
400-line budget risk: High
Chained PRs recommended: Yes
Suggested split: PR1 then PR2 then PR3
Delivery strategy: auto-chain
Chain strategy: feature-branch-chain

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

## PR1: Domain + Database (11 tasks)

### TASK-1.1
**Complexity:** M
**Description:** Create packages/mission-domain/ package scaffolding
**Files:** packages/mission-domain/package.json, packages/mission-domain/tsconfig.json
**Acceptance:** package.json exports src/index.ts, tsconfig extends root

<!-- sdd-owner: implementation -->

### TASK-1.2
**Complexity:** L
**Description:** Create mission-status.ts canonical state machine
**Files:** packages/mission-domain/src/mission-status.ts
**Acceptance:** 11 states, VALID_TRANSITIONS, TERMINAL_STATES, transition/isRunnable/isAwaitingApproval/isTerminal

<!-- sdd-owner: implementation -->

### TASK-1.3
**Complexity:** M
**Description:** Create mission-transitions.ts — validated transition logic with guards
**Files:** packages/mission-domain/src/mission-transitions.ts
**Acceptance:** validateTransition, guardTerminal (throws TERMINAL_STATE_GUARD), reconcileTransition, isValidRecoveryPath

<!-- sdd-owner: implementation -->

### TASK-1.4
**Complexity:** S
**Description:** Create mission-errors.ts — typed error classes with error codes
**Files:** packages/mission-domain/src/mission-errors.ts
**Acceptance:** MissionErrorCode enum with 13 codes, MissionError class, isMissionError guard

<!-- sdd-owner: implementation -->

### TASK-1.5
**Complexity:** M
**Description:** Create mission-contracts.ts — all shared TypeScript types
**Files:** packages/mission-domain/src/mission-contracts.ts
**Acceptance:** MissionIntent, RunIntentCommand, ApproveCommand, RejectCommand (reason required), ReconcileCommand, MissionStep, MissionProposal, MissionRejection, MissionBlocker, MissionSnapshot

<!-- sdd-owner: implementation -->

### TASK-1.6
**Complexity:** M
**Description:** Create mission-events.ts — SSE event types and protocol helpers
**Files:** packages/mission-domain/src/mission-events.ts
**Acceptance:** MissionEventType enum 12 types, MissionEvent, parseSSEEvent, isKeepalive

<!-- sdd-owner: implementation -->

### TASK-1.7
**Complexity:** M
**Description:** Create mission-receipt.ts — receipt generation, verification, evidence hashing
**Files:** packages/mission-domain/src/mission-receipt.ts
**Acceptance:** ReceiptContent, generateReceiptHash, verifyReceiptIntegrity, computeEvidenceHash. Deterministic SHA-256.

<!-- sdd-owner: implementation -->

### TASK-1.8
**Complexity:** L
**Description:** Create Drizzle migration for 4 new tables
**Files:** packages/infrastructure/drizzle/0030_missions.sql
**Acceptance:** Creates accounting_missions, mission_idempotency, mission_events, mission_receipts with all constraints. Migration 0030.

<!-- sdd-owner: implementation -->

### TASK-1.9
**Complexity:** L
**Description:** Create Drizzle schema file and update barrel exports
**Files (create):** packages/persistence/src/schema/mission.schema.ts
**Files (modify):** packages/persistence/src/schema/index.ts
**Acceptance:** 4 table definitions plus 3 relations. Progress integer basis points. Barrel re-exports all.

<!-- sdd-owner: implementation -->

### TASK-1.10
**Complexity:** M
**Description:** Create unit tests — 60 tests across 5 files
**Files:** packages/mission-domain/src/__tests__/ (5 files)
**Acceptance:** All pass. isTerminal(REJECTED) tests false.

<!-- sdd-owner: implementation -->

### TASK-1.11
**Complexity:** S
**Description:** Update root tsconfig.json paths for mission-domain
**Files (modify):** tsconfig.json
**Acceptance:** @drenyra/mission-domain in paths and references. tsc resolves.

<!-- sdd-owner: implementation -->

### Post-PR1 Gate
**Description:** Merge PR1 to feature/m1-durable-mission before PR2
**Acceptance:** All 11 tasks verified, tests pass, typecheck passes

<!-- sdd-owner: parent -->

## PR2: API + Backend Enforcement (12 tasks)

### TASK-2.1
**Complexity:** S
**Description:** Create apps/api/src/features/missions/ directory structure
**Files:** index.ts, schema/, middleware/, sse/ subdirectories
**Dependencies:** PR1 merged
**Acceptance:** Structure matches monthly-close pattern

<!-- sdd-owner: implementation -->

### TASK-2.2
**Complexity:** M
**Description:** Elysia validation schemas for all missions endpoints
**Files:** apps/api/src/features/missions/schema/mission.schema.ts
**Acceptance:** 5 schemas: Create, Execute, Approve (with evidenceHash), Reject (reason required), Reconcile

<!-- sdd-owner: implementation -->

### TASK-2.3
**Complexity:** L
**Description:** Idempotency middleware — atomic key+payload resolution
**Files:** apps/api/src/features/missions/middleware/idempotency.middleware.ts
**Acceptance:** X-Idempotency-Key header, SHA-256 payload hash, 3-way resolution, FOR UPDATE lock, 7-day expiry

<!-- sdd-owner: implementation -->

### TASK-2.4
**Complexity:** M
**Description:** Concurrency middleware — optimistic locking
**Files:** apps/api/src/features/missions/middleware/concurrency.middleware.ts
**Acceptance:** UPDATE SET version = version + 1 WHERE version matches. Zero rows = VERSION_CONFLICT.

<!-- sdd-owner: implementation -->

### TASK-2.5
**Complexity:** M
**Description:** MissionEventStore — append-only event log
**Files:** apps/api/src/features/missions/sse/mission-event-store.ts
**Acceptance:** appendEvent with atomic MAX sequence, getEventsSince, getEvent

<!-- sdd-owner: implementation -->

### TASK-2.6
**Complexity:** L
**Description:** SSE stream handler with catchup + subscribe + heartbeat
**Files:** apps/api/src/features/missions/sse/mission-sse.stream.ts
**Acceptance:** CATCHUP from Last-Event-ID, SUBSCRIBE 1s polling, heartbeat 15s, disconnect does NOT change state

<!-- sdd-owner: implementation -->

### TASK-2.7
**Complexity:** XL
**Description:** Missions service — business logic with state enforcement
**Files:** apps/api/src/features/missions/missions.service.ts
**Acceptance:** createMission, executeMission, getMission (tenant check), approveMission (evidence versioning + EVIDENCE_MISMATCH), rejectMission (reason required), reconcileMission. All use optimisticUpdate and company scoping.

<!-- sdd-owner: implementation -->

### TASK-2.8
**Complexity:** M
**Description:** Missions controller — request handling with try/catch
**Files:** apps/api/src/features/missions/missions.controller.ts
**Acceptance:** Class-based. Maps MissionError codes to HTTP status per design Appendix B.

<!-- sdd-owner: implementation -->

### TASK-2.9
**Complexity:** M
**Description:** Missions routes — Elysia route definitions
**Files:** apps/api/src/features/missions/missions.routes.ts
**Acceptance:** 6 routes under /api/v1/missions. companyScopeGuard. Idempotency on POST routes.

<!-- sdd-owner: implementation -->

### TASK-2.10
**Complexity:** S
**Description:** Missions module factory for app registration
**Files:** apps/api/src/features/missions/missions.module.ts
**Acceptance:** createMissionsModule factory + default export. Follows monthly-close pattern.

<!-- sdd-owner: implementation -->

### TASK-2.11
**Complexity:** L
**Description:** Integration tests — 31 tests across 5 files
**Files:** apps/api/src/features/missions/__tests__/integration/ (5 files)
**Acceptance:** State machine 12, idempotency 5, concurrency 4, SSE 6, tenant isolation 4. Uses createTransactionHooks.

<!-- sdd-owner: implementation -->

### TASK-2.12
**Complexity:** M
**Description:** Security tests — auth, tenant, injection, XSS (10 tests)
**Files:** apps/api/src/features/missions/__tests__/security/ (2 files)
**Acceptance:** Real company context switching for tenant isolation validation.

<!-- sdd-owner: implementation -->

### Post-PR2 Gate
**Description:** Merge PR2 to feature/m1-durable-mission before PR3
**Acceptance:** All 12 tasks verified, 41+ tests pass, typecheck passes

<!-- sdd-owner: parent -->

## PR3: Frontend Refactor (19 tasks)

### TASK-3.1
**Complexity:** S
**Description:** Install @drenyra/mission-domain dependency in apps/web
**Files (modify):** apps/web/package.json
**Dependencies:** PR1 merged, PR2 merged

<!-- sdd-owner: implementation -->

### TASK-3.2
**Complexity:** M
**Description:** Create MissionHeader component
**Files:** apps/web/src/features/workspace/components/mission/MissionHeader.tsx
**Acceptance:** Props-only. Status icon via lucide-react. Simulation badge. Spanish labels.

<!-- sdd-owner: implementation -->

### TASK-3.3
**Complexity:** M
**Description:** Create MissionStateView state router
**Files:** apps/web/src/features/workspace/components/mission/MissionStateView.tsx
**Acceptance:** Switch on status renders correct subcomponent per design 9.1.

<!-- sdd-owner: implementation -->

### TASK-3.4
**Complexity:** M
**Description:** Create MissionProgress component
**Files:** apps/web/src/features/workspace/components/mission/MissionProgress.tsx
**Acceptance:** Props-only. Progress bar bps/hundred. Steps with status icons.

<!-- sdd-owner: implementation -->

### TASK-3.5
**Complexity:** S
**Description:** Create MissionBlockedState component
**Files:** apps/web/src/features/workspace/components/mission/MissionBlockedState.tsx
**Acceptance:** Props-only. Severity badges. Retry button.

<!-- sdd-owner: implementation -->

### TASK-3.6
**Complexity:** M
**Description:** Create MissionUnknownState reconciliation dialog
**Files:** apps/web/src/features/workspace/components/mission/MissionUnknownState.tsx
**Acceptance:** Props-only. 3 resolution buttons. Reason textarea required.

<!-- sdd-owner: implementation -->

### TASK-3.7
**Complexity:** M
**Description:** Create MissionApprovalGate component
**Files:** apps/web/src/features/workspace/components/mission/MissionApprovalGate.tsx
**Acceptance:** Props-only. Risk badge, evidence bundle, approve/reject buttons.

<!-- sdd-owner: implementation -->

### TASK-3.8
**Complexity:** S
**Description:** Create MissionEvidenceBundle component
**Files:** apps/web/src/features/workspace/components/mission/MissionEvidenceBundle.tsx
**Acceptance:** Props-only. Evidence items. Version indicator. Inmutable badge.

<!-- sdd-owner: implementation -->

### TASK-3.9
**Complexity:** S
**Description:** Create MissionReceipt component
**Files:** apps/web/src/features/workspace/components/mission/MissionReceipt.tsx
**Acceptance:** Props-only. Monospace receiptId. Copy to clipboard.

<!-- sdd-owner: implementation -->

### TASK-3.10
**Complexity:** M
**Description:** Create MissionActions component
**Files:** apps/web/src/features/workspace/components/mission/MissionActions.tsx
**Acceptance:** Props-only. Contextual buttons: Iniciar, Solicitar revision, Nueva mision.

<!-- sdd-owner: implementation -->
<!-- sdd-owner: implementation -->

### TASK-3.11
**Complexity:** L
**Description:** Create useMissionReducer typed reducer
**Files:** apps/web/src/features/workspace/hooks/useMissionReducer.ts
**Acceptance:** MissionState, MissionAction 9 types, missionReducer, INITIAL_STATE. Matches design.

<!-- sdd-owner: implementation -->

### TASK-3.12
**Complexity:** XL
**Description:** Create 5 focused hooks
**Files:** apps/web/src/features/workspace/hooks/ (5 files)
**Acceptance:** Snapshot polls GET. Execution manages SSE. Event stream backoff with dedup. Decision uses idempotency keys. Recovery calls reconcile.

<!-- sdd-owner: implementation -->

### TASK-3.13
**Complexity:** L
**Description:** Refactor useAccountingMission to use reducer plus hooks
**Files (modify):** apps/web/src/features/workspace/hooks/useAccountingMission.ts
**Acceptance:** Uses useReducer. Imports from shared package.

<!-- sdd-owner: implementation -->

### TASK-3.14
**Complexity:** L
**Description:** Split service into 6 transport files
**Files (create):** 6 files in services/
**Files (modify):** accounting-mission.service.ts deprecated
**Acceptance:** Single-responsibility files. All imports use shared package.

<!-- sdd-owner: implementation -->

### TASK-3.15
**Complexity:** L
**Description:** Refactor MissionWorkspace to orchestrate subcomponents
**Files (modify):** apps/web/src/features/workspace/components/MissionWorkspace.tsx
**Acceptance:** Composes subcomponents. No inline switch on status. Reduced from 385 to 80 lines.

<!-- sdd-owner: implementation -->

### TASK-3.16
**Complexity:** S
**Description:** Deprecate local mission-status.ts
**Files (modify):** apps/web/src/features/workspace/model/mission-status.ts
**Acceptance:** Deprecation comment. Re-exports from shared package.

<!-- sdd-owner: implementation -->

### TASK-3.17
**Complexity:** M
**Description:** Unit tests for hooks and components
**Files:** apps/web/src/features/workspace/__tests__/ (7 files)
**Acceptance:** Reducer tests all actions. Hook tests with mock. Component tests.

<!-- sdd-owner: implementation -->

### TASK-3.18
**Complexity:** M
**Description:** Playwright E2E tests
**Files:** apps/web/e2e/missions/ (4 spec files)
**Acceptance:** 10 tests. All pass against running API.

<!-- sdd-owner: implementation -->

### TASK-3.19
**Complexity:** S
**Description:** Create quarantine register
**Files:** docs/testing/quarantine-register.md
**Acceptance:** Table with 6 columns. Footer with deadline rule.

<!-- sdd-owner: implementation -->

### Post-PR3 Gate
**Description:** Merge PR3 to feature branch then main
**Acceptance:** All 19 tasks verified. All tests pass. mission-domain is single source of truth.

<!-- sdd-owner: parent -->
