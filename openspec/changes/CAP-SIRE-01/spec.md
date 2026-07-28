# SIRE Reconciliation Specification

**Change:** CAP-SIRE-01 — SIRE Reconciliation Implementation
**Source:** CAP-SIRE-00 contract freeze `docs/ux/cap-sire-01-contracts.md` v1.0 (immutable)
**Artifact store:** openspec
**Delivery strategy:** auto-chain (5 sequential PRs, phases A→E)

## Purpose

This specification defines the minimum viable SIRE reconciliation subsystem across 5 implementation phases (A–E). It turns the CAP-SIRE-00 audit findings into concrete, testable, phase-ordered requirements covering fiscal context propagation, evidence and provenance infrastructure, trust-layer badges and thresholds, durable execution with UNKNOWN-state recovery, and UX integration with virtualized rendering and vocabulary alignment.

## Scope

### In Scope (8 SDDs, REQUIRED portions only)

| SDD | Domain | Phase |
|-----|--------|-------|
| SDD-010 | Fiscal Context (`fiscalPeriodId`, tenant-access-matrix stub) | A |
| SDD-014 | Evidence & Provenance (nodes, hash chain, append-only, `derived_from`) | B |
| SDD-016 | Diff & Materiality (monetary threshold, per-company config, golden tests) | C |
| SDD-006 + SDD-008 | Trust Layer (L0 badges, reversibility window) | C |
| SDD-020 | Durable Execution (UNKNOWN state, reconciler, payload storage) | D |
| SDD-072 | SIRE Workspace (persisted state, session recovery) | E |
| SDD-034 | Data Grid (virtualized rows, keyboard nav, loading/empty/error) | E |
| SDD-002 | SIRE Vocabulary ("Conciliación SIRE", "Cumplimiento SIRE") | E |

### Out of Scope (DEFERRED, per contract freeze)

Full provenance graph (10 node/edge types), policy-based materiality engine, fencing tokens/heartbeat, L2/L3 approval gates, L1-L3 badge expansion, full grid primitive, multi-period dashboard, full taxonomy migration, complete `FiscalContext` type. All deferred items are assigned to CAP-SIRE-02 through CAP-SIRE-05 in the contract freeze.

---

## Phase A: Fiscal Context (SDD-010)

### REQ-A-001 — Fiscal Period ID in Tenant Context

The system MUST include a verified `fiscalPeriodId` field in the tenant context used by all SIRE routes. The field SHALL be resolved from the company's fiscal calendar in the database, NOT from user-supplied input.

#### Scenario: Period resolved from fiscal calendar

- GIVEN a company with fiscal calendar entry for period "2026-03" mapping to `fiscalPeriodId` "fp-abc-123"
- WHEN any SIRE route receives a request scoped to that company and period "2026-03"
- THEN the resolved tenant context SHALL contain `fiscalPeriodId: "fp-abc-123"`
- AND the period SHALL be validated against the company's fiscal calendar before the request is processed

#### Scenario: Period not in company's fiscal calendar

- GIVEN a company whose fiscal calendar has no entry for period "2027-99"
- WHEN any SIRE route receives a request with period "2027-99"
- THEN the request SHALL be rejected with HTTP 422
- AND the error response SHALL contain code `FISCAL_PERIOD_INVALID`
- AND the error message SHALL reference the unrecognized period

#### Scenario: Cross-company period isolation

- GIVEN company A with fiscal period "2026-03" and company B WITHOUT fiscal period "2026-03"
- WHEN a request scoped to company B attempts to operate on period "2026-03"
- THEN the request SHALL be rejected
- AND company A's fiscal periods SHALL NOT leak into company B's context

### REQ-A-002 — Period Validation on All SIRE Routes

Every SIRE API route MUST validate that the requested period belongs to the authenticated company's fiscal calendar. This validation SHALL be enforced before any business logic executes.

#### Scenario: All 12+ SIRE routes validate fiscal period

- GIVEN the full SIRE route inventory (12+ routes documented in CAP-SIRE-00 D01)
- WHEN any route is invoked with a period parameter
- THEN `fiscalPeriodId` SHALL be resolved and validated
- AND a route without period validation SHALL be treated as a blocking defect

#### Scenario: Period-free routes are exempt

- GIVEN a SIRE route that does not accept a period parameter (e.g., credential status check)
- WHEN that route is invoked
- THEN it SHALL NOT require fiscal period validation
- AND it SHALL still enforce `companyScopeGuard`

### REQ-A-003 — Tenant Access Matrix Stub

The project MUST include a `docs/architecture/tenant-access-matrix.md` stub documenting the existing guard coverage and role-binding structure for SIRE operations.

#### Scenario: Stub documents existing coverage

- GIVEN the project documentation directory
- WHEN the stub is reviewed
- THEN it SHALL document all SIRE routes and their `companyScopeGuard` status
- THEN it SHALL reference existing role bindings (W2-04A, W2-05A)
- THEN it SHALL include a TODO section for deferred `FiscalContext` fields (`actorId`, `roleBindings`, `policyVersion`)

### REQ-A-004 — SUNAT Credential Resolution Preservation

The SUNAT credential resolution via `resolveTenantSunatContext` SHALL be preserved as-is (confirmed correct in CAP-SIRE-00 D03 credential audit). The new `fiscalPeriodId` field SHALL be added to the context without altering credential resolution logic.

#### Scenario: Credential resolution unchanged

- GIVEN the existing `TenantSunatContext` type with `companyId`, `ruc`, and `credential`
- WHEN `fiscalPeriodId` is added to the context
- THEN `resolveTenantSunatContext` SHALL continue to resolve credentials by `companyId` and `scope`
- AND the `fiscalPeriodId` SHALL NOT affect credential lookup

### Phase A — Technical Constraints

- `TenantSunatContext` type is at `apps/api/src/features/sire/types.ts`
- `resolveTenantSunatContext` is at `apps/api/src/features/sire/services/tenant-sunat-context.service.ts`
- `companyScopeGuard` is already applied to all 12+ SIRE routes (verified in CAP-SIRE-00 D03)
- DB migration: add `fiscalPeriodId` resolution logic; the fiscal calendar table structure SHALL be determined during design
- No route restructuring — `/api/sire` prefix remains for CAP-SIRE-01

### Phase A — Dependencies

- Blocks: nothing (foundational phase)
- Unblocks: Phases B, C, D, E

### Phase A — Testing Requirements

- Unit tests for `resolveTenantSunatContext` with `fiscalPeriodId` present in return value
- Unit tests for period validation: valid period, invalid period, missing calendar entry
- Integration test: cross-company period isolation
- Route-level test: every SIRE route rejects a non-fiscal period with HTTP 422
- Property-based test: `fiscalPeriodId` is always a non-empty string when period is valid

---

## Phase B: Evidence & Provenance (SDD-014)

### REQ-B-001 — Evidence Nodes Table

The system MUST include an `evidence_nodes` table with columns: `id` (UUID, PK), `type` (varchar, NOT NULL), `artifact_id` (UUID), `period` (varchar(7), NOT NULL), `company_id` (UUID, NOT NULL), `hash` (varchar(64), NOT NULL), `created_at` (timestamp, NOT NULL).

#### Scenario: DerivedArtifact node created on diff generation

- GIVEN a SIRE three-way diff is generated for company X, period "2026-03"
- WHEN the diff artifact is persisted
- THEN an `evidence_nodes` row SHALL be created with `type = 'DerivedArtifact'`
- AND `artifact_id` SHALL reference the diff artifact
- AND `period` SHALL be "2026-03"
- AND `company_id` SHALL be company X's UUID
- AND `hash` SHALL be `SHA-256(JSON.stringify(artifact))`
- AND `created_at` SHALL be set

### REQ-B-002 — Evidence Edges Table

The system MUST include an `evidence_edges` table with columns: `id` (UUID, PK), `from_node_id` (UUID, FK to `evidence_nodes`, NOT NULL), `to_node_id` (UUID, FK to `evidence_nodes`, NOT NULL), `edge_type` (varchar, NOT NULL), `created_at` (timestamp, NOT NULL).

#### Scenario: derived_from edge links diff to source documents

- GIVEN a diff artifact node (node-A) and source document reference nodes (node-B for ledger, node-C for SUNAT proposal)
- WHEN the diff is generated
- THEN `evidence_edges` rows SHALL be created:
  - `(from: node-A, to: node-B, edge_type: 'derived_from')`
  - `(from: node-A, to: node-C, edge_type: 'derived_from')`

#### Scenario: supersedes edge on commit

- GIVEN an existing diff artifact node (node-v1) and a new committed version (node-v2)
- WHEN the diff is committed (resolution applied)
- THEN an `evidence_edges` row SHALL be created:
  - `(from: node-v2, to: node-v1, edge_type: 'supersedes')`

### REQ-B-003 — Append-Only Constraint

The `evidence_nodes` and `evidence_edges` tables MUST be append-only. No UPDATE or DELETE operations SHALL be permitted on existing rows. Corrections SHALL create new nodes and edges rather than modifying existing ones.

#### Scenario: UPDATE rejected at DB level

- GIVEN an existing evidence node
- WHEN an UPDATE statement is executed against `evidence_nodes`
- THEN the database SHALL reject it
- AND the rejection SHALL be enforced via a trigger or permission revocation (no `UPDATE`/`DELETE` grants on the table for the application role)

#### Scenario: Correction creates new node

- GIVEN a diff artifact that was incorrectly generated (node-v1)
- WHEN the corrected diff is generated
- THEN a new `evidence_nodes` row SHALL be created (node-v1-fixed)
- AND an edge SHALL be created: `(from: node-v1-fixed, to: node-v1, edge_type: 'supersedes')`
- AND node-v1 SHALL remain unchanged

### REQ-B-004 — Hash Chain

Each evidence node's `hash` MUST be computed as `SHA-256(previous_hash + artifact_hash)` where `previous_hash` is the hash of the chronologically previous node for the same `(company_id, period, type)` and `artifact_hash` is `SHA-256(JSON.stringify(canonical_artifact_payload))`.

#### Scenario: First node hash

- GIVEN no previous evidence node exists for company X, period "2026-03", type "DerivedArtifact"
- WHEN the first diff artifact is generated
- THEN `hash` SHALL be `SHA-256('' + artifact_hash)`
- AND `artifact_hash` SHALL be `SHA-256(JSON.stringify(artifact))`

#### Scenario: Chain continues

- GIVEN a previous evidence node with hash "abc123" for the same `(company_id, period, type)`
- WHEN a new diff artifact is generated
- THEN the new node's `hash` SHALL be `SHA-256('abc123' + SHA-256(JSON.stringify(new_artifact)))`

#### Scenario: Hash chain is deterministic

- GIVEN the same artifact payload and the same previous hash
- WHEN the hash is computed twice
- THEN the result SHALL be identical both times
- AND this SHALL be verified by a property-based test (100+ random artifact payloads)

### REQ-B-005 — Evidence Persisted on Diff Generation

When `POST /api/sire/comparison/diff` (or equivalent) generates a diff, the system MUST persist the evidence node, edges, and hash chain atomically within the same transaction.

#### Scenario: Diff creates evidence atomically

- GIVEN a diff is generated successfully
- WHEN the transaction commits
- THEN an `evidence_nodes` row SHALL exist
- AND `evidence_edges` rows SHALL exist linking the node to its source documents
- AND the hash chain SHALL be updated
- AND if any of these operations fails, the entire transaction SHALL roll back (no partial evidence)

### Phase B — Technical Constraints

- Schema package: `packages/persistence/src/schema/evidence.schema.ts` (create new; existing `sire-comparisons.schema.ts` holds `sire_comparisons` and `sire_discrepancy_resolutions` — evidence schema is separate)
- `packages/persistence/src/schema/evidence-links.schema.ts` for edge table
- DB-level append-only enforcement via: `REVOKE UPDATE, DELETE ON evidence_nodes FROM app_role; REVOKE UPDATE, DELETE ON evidence_edges FROM app_role;` — applied in migration
- Hash function: Node.js `crypto.createHash('sha256')` — MUST match across all environments
- `DerivedArtifact` type enum value for `evidence_nodes.type`
- `derived_from` and `supersedes` enum values for `evidence_edges.edge_type`

### Phase B — Dependencies

- Depends on: Phase A (tenant context for company-scoped evidence nodes)
- Unblocks: Phase C (badges reference evidence nodes)

### Phase B — Testing Requirements

- Unit tests: hash chain computation, SHA-256 correctness
- Unit tests: edge creation logic (`derived_from`, `supersedes`)
- Integration tests: diff generation creates evidence row and edges atomically
- Integration tests: UPDATE/DELETE rejected by DB
- Property-based tests: hash chain determinism (100+ random payloads)
- Property-based tests: `hash` is always 64 hex characters
- Snapshot test: `SHA-256(JSON.stringify(canonical_artifact))` produces expected hash for a golden fixture

---

## Phase C: Trust Layer (SDD-016 + SDD-006/008)

### REQ-C-001 — Configurable Monetary Threshold per Company

The `companies` table MUST include a `sire_materiality_threshold_pen` column (nullable `numeric` or `integer`). When NULL, all diff rows SHALL be treated as critical (backward-compatible default). When set, rows with absolute monetary difference below the threshold SHALL be classified as non-critical but still visible in the diff output.

#### Scenario: Threshold enforced

- GIVEN company X has `sire_materiality_threshold_pen = 500`
- WHEN a diff row has `|difference| = 300` (below threshold)
- THEN the row SHALL be classified as non-critical
- AND the row SHALL still appear in the diff output
- AND the summary SHALL NOT count it as critical

#### Scenario: NULL threshold means all rows critical

- GIVEN company Y has `sire_materiality_threshold_pen = NULL`
- WHEN any diff row has a non-MATCH status
- THEN the row SHALL be classified as critical
- AND this SHALL match the existing behavior (backward compatible)

#### Scenario: Exactly at threshold

- GIVEN company Z has `sire_materiality_threshold_pen = 1000`
- WHEN a diff row has `|difference| = 1000`
- THEN the row SHALL be classified as critical (`>=` threshold, not `>`)

### REQ-C-002 — buildSummary Accepts Threshold Parameter

The `buildSummary()` function (in `apps/api/src/features/sire-comparison/`) MUST accept an optional `threshold` parameter. When provided, `critical` count SHALL reflect only rows where `|difference| >= threshold`. When omitted, ALL non-MATCH rows SHALL be counted as critical (backward compatible).

#### Scenario: buildSummary with threshold

- GIVEN diff rows with differences [100, 200, 500, 1000]
- WHEN `buildSummary(rows, { threshold: 500 })` is called
- THEN `summary.critical` SHALL be 2 (rows with difference 500 and 1000)

#### Scenario: buildSummary without threshold

- GIVEN diff rows with differences [100, 200, 500, 1000] and 2 MATCH rows
- WHEN `buildSummary(rows)` is called (no threshold)
- THEN `summary.critical` SHALL be 4 (all non-MATCH rows)

### REQ-C-003 — Golden Test Fixtures for Diff Output

The project MUST include golden test fixtures for `buildSummary()` and `buildDiffRows()` output: given known inputs, the output MUST be deterministic and match the expected fixture.

#### Scenario: Diff output is deterministic

- GIVEN a golden input fixture `__tests__/fixtures/sire-diff-input.json`
- WHEN `buildDiffRows(input)` is called with that fixture
- THEN the output SHALL match `__tests__/fixtures/sire-diff-expected.json` exactly
- AND this SHALL be verified by an automated test that fails on any deviation

#### Scenario: Summary output is deterministic

- GIVEN a golden diff rows fixture
- WHEN `buildSummary(rows, { threshold: 1000 })` is called
- THEN the summary SHALL match the golden summary fixture
- AND `matched`, `mismatched`, `missingOnLedger`, `missingOnSunat`, `critical` counts SHALL all match

### REQ-C-004 — L0 Evidence Badges on Diff Values

Each diff row rendered in the UI MUST display an L0 evidence badge containing: `source` (SUNAT, ledger, CPE), `verification status` (verified, pending, conflict), and `confidence` (high, medium, low).

#### Scenario: Badge visible on diff row

- GIVEN a diff row where the SUNAT value is "1000" and the ledger value is "950"
- WHEN the row is rendered in `SireDiffArtifactCard` or `DiffViewerV3`
- THEN the SUNAT value SHALL display a badge with `source: 'SUNAT'`
- AND the ledger value SHALL display a badge with `source: 'ledger'`
- AND each badge SHALL indicate verification status and confidence level

#### Scenario: Conflict badge when values disagree

- GIVEN a diff row where SUNAT and ledger disagree on a value
- WHEN the badge is rendered
- THEN `verification status` SHALL be `conflict`
- AND `confidence` SHALL reflect the reliability of the source data

### REQ-C-005 — Reversibility Window for ACCEPT_SUNAT

When an ACCEPT_SUNAT resolution is applied (ledger value updated to match SUNAT), the system MUST record a `revert_available_until` timestamp on the resolution. Before that timestamp expires, the resolution MUST be revertible via `POST /api/sire/diff/revert`.

#### Scenario: Revert within window

- GIVEN a resolution was applied at T+0 with a 24-hour reversibility window
- WHEN `POST /api/sire/diff/revert` is called at T+12 hours
- THEN the ledger value SHALL be restored to its pre-resolution state
- AND the resolution SHALL be marked as REVERTED
- AND an evidence node SHALL be created documenting the revert

#### Scenario: Revert after window expired

- GIVEN a resolution was applied at T+0 with a 24-hour reversibility window
- WHEN `POST /api/sire/diff/revert` is called at T+25 hours
- THEN the request SHALL be rejected with HTTP 409
- AND the error SHALL indicate the reversibility window has expired

#### Scenario: Configurable window per company

- GIVEN company A has `reversibility_window_hours = 48` and company B has `reversibility_window_hours = 2`
- WHEN ACCEPT_SUNAT is applied for each company
- THEN company A's `revert_available_until` SHALL be T+48h
- AND company B's `revert_available_until` SHALL be T+2h

### Phase C — Technical Constraints

- DB migration: add `sire_materiality_threshold_pen` column to `companies` table (or to a company-settings extension table)
- DB migration: add `reversibility_window_hours` column to `companies` table (default: 24)
- `buildSummary()` signature change: `buildSummary(rows: DiffRow[], opts?: { threshold?: number }): DiffSummary`
- Badge component: `EvidenceBadge` — new component in `apps/web/src/components/evidence/EvidenceBadge.tsx`
- Badge data type: `{ source: 'SUNAT' | 'ledger' | 'CPE', status: 'verified' | 'pending' | 'conflict', confidence: 'high' | 'medium' | 'low' }`
- Reversibility: `revert_available_until` stored in `sire_discrepancy_resolutions.resolution_data` JSONB field
- Revert endpoint: `POST /api/sire/diff/revert` or extend existing PATCH resolution endpoint

### Phase C — Dependencies

- Depends on: Phase B (evidence nodes for badge references and revert audit trail)
- Unblocks: Phase E (UX integrates badges)

### Phase C — Testing Requirements

- Unit tests: `buildSummary` with threshold, without threshold, zero threshold, negative threshold (edge)
- Unit tests: Badge rendering for all 3 sources × 3 statuses × 3 confidence levels
- Golden tests: `buildDiffRows` determinism, `buildSummary` determinism
- Integration tests: threshold column read from DB, NULL threshold backward compatibility
- Integration tests: reversibility window — revert within window, revert after expiry, revert of already-reverted resolution
- Property-based tests: `critical` count ≤ total non-MATCH count for any threshold
- Accessibility test: badge is screen-reader accessible with `aria-label`

---

## Phase D: Durable Execution (SDD-020)

### REQ-D-001 — UNKNOWN State in Submission Lifecycle

The SIRE submission status enum MUST include an `UNKNOWN` state. When a submission request to SUNAT times out (no response received), the status SHALL transition to `UNKNOWN` instead of `FAILED`.

#### Scenario: Timeout produces UNKNOWN

- GIVEN a SIRE submission is sent to SUNAT
- WHEN the HTTP request times out without a response
- THEN `sire_submissions.status` SHALL be set to `UNKNOWN`
- AND `sire_submissions.sunat_status` SHALL be NULL (no response received)
- AND the submission SHALL be flagged for reconciliation

#### Scenario: Existing statuses unchanged

- GIVEN the current status enum: PENDING, SUBMITTED, ACCEPTED, REJECTED, OBSERVED, SIMULATED, FAILED
- WHEN `UNKNOWN` is added to the enum
- THEN all existing status transitions (PENDING → SUBMITTED → ACCEPTED/REJECTED/OBSERVED) SHALL remain unchanged
- AND FAILED SHALL still be reachable for explicit SUNAT error responses (non-timeout failures)

### REQ-D-002 — SireReconcilerService

The system MUST include a `SireReconcilerService` that queries SUNAT for the actual status of submissions in `UNKNOWN` state. The reconciler SHALL transition `UNKNOWN → RECONCILING → COMPLETED` or `UNKNOWN → RECONCILING → FAILED_RETRYABLE`.

#### Scenario: SUNAT confirms receipt

- GIVEN a submission is in `UNKNOWN` state with a valid `trackingId`
- WHEN `SireReconcilerService.reconcileUnknown()` queries SUNAT
- AND SUNAT responds with status "ACEPTADO" (accepted)
- THEN the submission status SHALL transition: `UNKNOWN → RECONCILING → COMPLETED`
- AND `sunat_status` SHALL be set to the SUNAT response value

#### Scenario: SUNAT has no record

- GIVEN a submission is in `UNKNOWN` state with a trackingId
- WHEN SUNAT responds that no submission exists for that trackingId
- THEN the submission status SHALL transition: `UNKNOWN → RECONCILING → FAILED_RETRYABLE`
- AND the retry payload SHALL be available for resubmission

#### Scenario: Reconciler handles SUNAT API errors gracefully

- GIVEN a submission is in `UNKNOWN` state
- WHEN SUNAT API returns HTTP 503 (service unavailable)
- THEN the submission SHALL remain in `RECONCILING` state
- AND `nextRetryAt` SHALL be set with exponential backoff
- AND the error SHALL be logged with context

### REQ-D-003 — Submission Payload Storage for Retry

The `sire_submissions` table MUST include a `payload_base64` column (TEXT, nullable) storing the original submission payload. `SireRetryService.processRetryQueue()` SHALL use this stored payload for retries instead of requiring the caller to resupply it.

#### Scenario: Payload stored on submission

- GIVEN a SIRE submission is created with payload "base64encodedpayload"
- WHEN the submission row is inserted
- THEN `payload_base64` SHALL contain "base64encodedpayload"

#### Scenario: Retry uses stored payload

- GIVEN a submission in `FAILED_RETRYABLE` state with `payload_base64` set
- WHEN `SireRetryService.processRetryQueue()` processes that submission
- THEN the retry SHALL use the stored `payload_base64`
- AND the caller SHALL NOT be required to provide the payload again

#### Scenario: Payload is NULL for legacy submissions

- GIVEN a submission created before this migration (no `payload_base64`)
- WHEN a retry is attempted
- THEN the retry SHALL fail with a clear error: "No stored payload available for resubmission"
- AND the submission SHALL be marked as non-retryable

### REQ-D-004 — RECONCILING as Transient State

The `RECONCILING` state SHALL be treated as a transient state. No submission SHALL remain in `RECONCILING` indefinitely. A sweeper job SHALL detect submissions stuck in `RECONCILING` for longer than a configurable timeout and re-enqueue them.

#### Scenario: Reconciling timeout

- GIVEN a submission has been in `RECONCILING` state for > 30 minutes
- WHEN the sweeper job runs
- THEN the submission SHALL be reset to `UNKNOWN` and re-enqueued for reconciliation
- AND a metric SHALL be emitted counting stuck reconciliations

### Phase D — Technical Constraints

- Schema: extend `packages/persistence/src/schema/sire.schema.ts` — add `UNKNOWN` and `RECONCILING` to status comment; add `payload_base64` column
- New service: `apps/api/src/features/sire/services/sire-reconciler.service.ts`
- SUNAT status query endpoint: to be determined from SUNAT API documentation during design — the reconciler MUST use the same OAuth credential resolution as the submission service
- The existing `RetryConfig` and `RetryState` in `sire-live-retry-policy.service.ts` and `sire-submission.service.ts` provide retry infrastructure; the reconciler SHALL extend, not replace
- Status enum extension: the `status` column on `sire_submissions` is `varchar(20)` — ensure `UNKNOWN` (7 chars) and `RECONCILING` (11 chars) fit within limit

### Phase D — Dependencies

- Depends on: Phase A (tenant context for scoped reconciliation), Phase B (evidence for reconciler audit trail)
- Unblocks: Phase E (workspace submits and reconciles)

### Phase D — Testing Requirements

- Unit tests: timeout → UNKNOWN transition
- Unit tests: SUNAT confirms receipt → COMPLETED
- Unit tests: SUNAT no record → FAILED_RETRYABLE
- Unit tests: SUNAT API error → RECONCILING with backoff
- Unit tests: retry uses stored `payload_base64`
- Unit tests: retry with NULL payload → clear error, non-retryable
- Integration tests: end-to-end UNKNOWN → RECONCILING → COMPLETED flow
- Integration tests: sweeper detects stuck RECONCILING submissions
- Property-based tests: `payload_base64` round-trip (any valid Base64 string survives store-and-retrieve)
- Contract test: SUNAT reconciliation API response shape matches expected schema

---

## Phase E: UX & Integration (SDD-072 + SDD-034 + SDD-002)

### REQ-E-001 — Persisted Workspace State

The SIRE diff workspace state MUST be persisted to the database. Reloading the page SHALL restore: the current diff artifact, resolution progress, and workspace step.

#### Scenario: Page reload restores workspace

- GIVEN a user has generated a diff, resolved 3 of 10 discrepancies, and is on the "review" step
- WHEN the user reloads the page
- THEN the diff artifact SHALL be reloaded from the database
- AND the 3 resolutions SHALL be restored
- AND the workspace SHALL display the "review" step

#### Scenario: Session-based recovery via URL

- GIVEN a user has generated a diff with artifact ID "artifact-123"
- WHEN the user navigates to `/cumplimiento/sire-diff?artifactId=artifact-123`
- THEN the diff artifact SHALL be loaded from the database
- AND the workspace SHALL be restored to its last saved state

#### Scenario: No workspace exists

- GIVEN no diff has been generated for the current session
- WHEN the user navigates to the SIRE diff page
- THEN the input form SHALL be displayed (period, file uploads)
- AND no artifact SHALL be shown

### REQ-E-002 — Virtualized Diff Rows

When a diff contains more than 100 rows, the row rendering MUST use `@tanstack/react-virtual` for windowed virtualization. Rows outside the viewport SHALL NOT be rendered to the DOM.

#### Scenario: Large diff renders smoothly

- GIVEN a diff with 500 rows
- WHEN the diff is displayed
- THEN only the rows visible in the viewport (plus a small overscan buffer) SHALL be in the DOM
- AND scrolling SHALL render additional rows on demand
- AND the page SHALL not exhibit jank or layout shift during scroll

#### Scenario: Small diff renders without virtualization

- GIVEN a diff with 20 rows
- WHEN the diff is displayed
- THEN all 20 rows SHALL be rendered to the DOM
- AND virtualization overhead SHALL NOT be applied

### REQ-E-003 — Keyboard Navigation

The diff viewer MUST support keyboard navigation: `j`/`↓` to move to the next row, `k`/`↑` to move to the previous row, `Enter` to select/toggle the focused row.

#### Scenario: Keyboard navigation in diff

- GIVEN a diff is displayed with 50 rows
- WHEN the user presses `j` five times
- THEN the highlight SHALL move from row 1 to row 6
- AND the focused row SHALL be scrolled into view if needed

#### Scenario: Enter selects a row

- GIVEN a diff row is focused via keyboard
- WHEN the user presses `Enter`
- THEN the row SHALL be selected/toggled
- AND the resolution panel SHALL open for that row

### REQ-E-004 — Loading, Empty, and Error States

`SireDiffPage` MUST render distinct states for loading, empty, and error conditions.

#### Scenario: Loading state

- GIVEN the user has clicked "Run three-way diff"
- WHEN the diff is being computed
- THEN a skeleton loader SHALL be displayed (not a blank page)
- AND the "Run three-way diff" button SHALL be disabled with a spinner

#### Scenario: Empty state

- GIVEN a diff returns zero discrepancies (all records match)
- WHEN the diff is displayed
- THEN an empty state SHALL be shown: "All records match — no discrepancies"
- AND the summary SHALL show `mismatched: 0`, `missingOnLedger: 0`, `missingOnSunat: 0`
- AND the state SHALL NOT be an error — it is a valid, positive result

#### Scenario: Error state

- GIVEN the diff API returns an error (network failure, server error)
- WHEN the error occurs
- THEN an error message SHALL be displayed with a "Retry" button
- AND the previous diff artifact SHALL remain visible (not cleared on error)

### REQ-E-005 — SIRE Vocabulary Alignment

All SIRE UI labels MUST use the canonical vocabulary: "Conciliación SIRE" for reconciliation views, "Cumplimiento SIRE" for compliance views.

#### Scenario: Page title uses canonical term

- GIVEN the user is on the SIRE diff page
- WHEN the page title is rendered
- THEN it SHALL display "Conciliación SIRE" (or the equivalent canonical term)
- AND NOT "SIRE Diff" (current title)

#### Scenario: Sidebar navigation reflects canonical terms

- GIVEN the application sidebar
- WHEN the SIRE navigation item is rendered
- THEN it SHALL display "Cumplimiento SIRE"
- AND it SHALL link to the correct route

### Phase E — Technical Constraints

- Workspace persistence: leverage existing `sire_comparisons` table (already has `companyId`, `period`, `rows`, `summary`) and `sire_discrepancy_resolutions` table
- Workspace step tracking: add a `workspace_step` field (or store in JSONB metadata) to track: context → sync → match → classify → resolve → diff → review → submit → reconcile
- URL-based recovery: use `useSearchParams` from `@tanstack/react-router` to read `artifactId` query parameter
- Virtualization: install `@tanstack/react-virtual` (add to `apps/web/package.json`)
- Keyboard shortcuts: `useSireDiffKeyboardShortcuts` already exists at `apps/web/src/features/artifacts/components/sire-diff-card/useSireDiffKeyboardShortcuts.ts` — extend for the virtualized row list
- Vocabulary: update `<h1>` in `SireDiffPage.tsx`, sidebar labels in route config, and any hardcoded "SIRE Diff" strings

### Phase E — Dependencies

- Depends on: Phase B (evidence for workspace recovery), Phase C (badges and materiality for row rendering), Phase D (submission and reconciliation for workspace steps)
- Unblocks: nothing (terminal phase)

### Phase E — Testing Requirements

- Integration tests: page reload restores workspace state
- Integration tests: URL-based recovery (`?artifactId=X`)
- Component tests: virtualized list renders only visible rows (check DOM node count)
- Component tests: keyboard navigation (`j`, `k`, `Enter`)
- Component tests: loading skeleton, empty state, error state with retry
- Accessibility tests: keyboard navigation is screen-reader compatible
- Snapshot tests: canonical vocabulary labels in page title, sidebar, and empty state
- E2E test: full workspace flow — generate diff → resolve → reload → verify state restored

---

## Cross-Phase Requirements

### REQ-X-001 — Strict TDD Compliance

All implementation MUST follow strict TDD as configured in `openspec/config.yaml` (`strict_tdd: true`). No production code SHALL be written before a failing test exists for it.

#### Scenario: Red-Green-Refactor per requirement

- GIVEN a requirement from this spec
- WHEN implementation begins
- THEN a failing test SHALL be written first
- AND the test SHALL fail for the expected reason
- AND production code SHALL be written only to make the test pass
- AND refactoring SHALL occur only with passing tests

### REQ-X-002 — DB Migrations Are Additive

All database migrations across all phases SHALL be additive. No existing column, table, or constraint SHALL be dropped or renamed. This prevents conflicts with existing SIRE tables.

#### Scenario: Migration adds columns only

- GIVEN the existing `sire_submissions` table
- WHEN Phase D migration runs
- THEN `payload_base64` SHALL be added as a new nullable column
- AND no existing columns SHALL be modified or dropped
- AND existing rows SHALL remain valid (NULL `payload_base64` is acceptable)

### REQ-X-003 — No Route Restructuring

No SIRE route SHALL be renamed or moved for CAP-SIRE-01. The `/api/sire` prefix remains authoritative. Route taxonomy migration is deferred to CAP-SIRE-05.

#### Scenario: All routes retain current paths

- GIVEN the route inventory from CAP-SIRE-00 D01 (15 routes)
- WHEN CAP-SIRE-01 implementation is complete
- THEN all 15 routes SHALL retain their current method, path, and prefix
- AND new routes (e.g., `/api/sire/diff/revert`) SHALL use the `/api/sire` prefix

### REQ-X-004 — Phase Ordering Is Enforced

Each phase SHALL be implemented and delivered as a separate PR in strict A→B→C→D→E order. Phase C (trust layer) MAY partially overlap with Phase B (evidence core) for badge component development while evidence schema stabilizes.

#### Scenario: Sequential PR delivery

- GIVEN Phase A is complete and merged
- WHEN Phase B begins
- THEN Phase B SHALL branch from the post-Phase-A main
- AND Phase B SHALL NOT include Phase C, D, or E changes

---

## Dependency Graph

```
Phase A (SDD-010) — Fiscal Context
  └──→ Phase B (SDD-014) — Evidence Core
        └──→ Phase C (SDD-016 + 006/008) — Trust Layer
              └──→ Phase D (SDD-020) — Durable Execution
                    └──→ Phase E (SDD-072 + 034 + 002) — UX & Integration
```

Phase B and Phase C may overlap partially (badge component work can begin while evidence schema stabilizes), but Phase C MUST NOT merge before Phase B.

---

## Acceptance Criteria Summary

| Phase | Requirement | Key Acceptance Criterion |
|-------|------------|--------------------------|
| A | REQ-A-001 | `fiscalPeriodId` resolved from DB, not user input |
| A | REQ-A-002 | All 12+ SIRE routes validate period against fiscal calendar |
| A | REQ-A-003 | `tenant-access-matrix.md` stub created |
| B | REQ-B-001 | `evidence_nodes` row created on diff generation |
| B | REQ-B-003 | UPDATE/DELETE rejected at DB level on evidence tables |
| B | REQ-B-004 | Hash chain: `SHA-256(prev + artifact_hash)` is deterministic |
| C | REQ-C-001 | Monetary threshold from `companies` table controls critical count |
| C | REQ-C-003 | Golden test fixtures produce deterministic diff output |
| C | REQ-C-004 | L0 badges display source, status, confidence on every diff row |
| C | REQ-C-005 | Revert within window succeeds; revert after window returns 409 |
| D | REQ-D-001 | Timeout → UNKNOWN (not FAILED) |
| D | REQ-D-002 | Reconciler queries SUNAT for actual status |
| D | REQ-D-003 | Retry uses stored `payload_base64` |
| E | REQ-E-001 | Page reload restores workspace (artifact + resolutions + step) |
| E | REQ-E-002 | >100 rows uses `@tanstack/react-virtual` |
| E | REQ-E-003 | `j`/`k`/`Enter` keyboard navigation works |
| E | REQ-E-004 | Loading skeleton, empty state, error state with retry |
| E | REQ-E-005 | UI labels: "Conciliación SIRE", "Cumplimiento SIRE" |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hash chain breaks if JSON serialization order differs across environments | Low | High | Use deterministic JSON serializer (`json-stable-stringify` or sorted keys) |
| `@tanstack/react-virtual` version conflict with existing dependencies | Low | Medium | Pin version; test in isolation before integrating |
| SUNAT reconciliation API contract changes between design and implementation | Medium | High | Mock SUNAT responses in tests; configurable endpoint |
| DB migration for `sire_materiality_threshold_pen` conflicts with other company columns | Low | Low | Additive migration; nullable column |
| Workspace state recovery breaks if artifact JSON schema changes | Medium | Medium | Version the workspace state; add schema migration for stored artifacts |
| `RECONCILING` sweeper conflicts with manual reconciliation | Medium | Medium | Use advisory lock or `SELECT ... FOR UPDATE SKIP LOCKED` |
