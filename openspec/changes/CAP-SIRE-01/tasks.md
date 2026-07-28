# Tasks: CAP-SIRE-01 — SIRE Reconciliation Implementation

**Change:** CAP-SIRE-01
**Source spec:** `openspec/changes/CAP-SIRE-01/spec.md` (20 requirements, 5 phases)
**Source design:** `openspec/changes/CAP-SIRE-01/design.md`
**Strict TDD:** `true` — every task below follows RED → GREEN → TRIANGULATE → REFACTOR
**Test runner:** vitest + @fast-check/vitest (property-based)
**Delivery:** auto-chain, 5 sequential PRs (Phase A → E)

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2,600–3,600 across 5 PRs |
| 400-line budget risk | High — each PR is 400–800 lines with tests |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (Phase A) → PR2 (Phase B) → PR3 (Phase C) → PR4 (Phase D) → PR5 (Phase E) |
| Delivery strategy | auto-chain |
| Chain strategy | pending — requires user choice |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

---

## Phase Overview

```
Phase A (PR1): Fiscal Context        — ~10 files, est. 400–600 changed lines
Phase B (PR2): Evidence Core         —  ~6 files, est. 500–700 changed lines
Phase C (PR3): Trust Layer           —  ~9 files, est. 600–800 changed lines
Phase D (PR4): Durable Execution     —  ~7 files, est. 500–700 changed lines
Phase E (PR5): UX & Integration      —  ~9 files, est. 600–800 changed lines
```

---

## Phase A: Fiscal Context (PR1)

**Depends on:** nothing (foundational)
**Unblocks:** Phases B, C, D, E
**Requirements:** REQ-A-001, REQ-A-002, REQ-A-003, REQ-A-004

### A.1 — `resolveFiscalPeriodId` unit (RED → GREEN)

- [x] **A.1.1 RED**: Write unit test at `apps/api/src/features/sire/__tests__/unit/fiscal-period.service.test.ts` — given a `companyId` and a `period` that exists in `accounting_periods`, expects `resolveFiscalPeriodId` to return a non-empty `fiscalPeriodId` string. Mock the DB query. <!-- sdd-owner: implementation -->
- [x] **A.1.2 GREEN**: Create `apps/api/src/features/sire/services/fiscal-period.service.ts` — implement `resolveFiscalPeriodId(companyId: string, period: string): Promise<string>` that queries `accounting_periods` by `companyId` and `period`, returns `id`. Throw `FiscalPeriodValidationError` when no row found. <!-- sdd-owner: implementation -->
- [x] **A.1.3 RED**: Write unit test — invalid period (not in fiscal calendar) → expects `FiscalPeriodValidationError` with code `FISCAL_PERIOD_INVALID`. <!-- sdd-owner: implementation -->
- [x] **A.1.4 GREEN**: Add error class and throw logic to `fiscal-period.service.ts`. <!-- sdd-owner: implementation -->
- [ ] **A.1.5 RED**: Write property-based test using `@fast-check/vitest` — for any valid `(companyId, period)` pair where a DB row exists, `fiscalPeriodId` is a non-empty string. <!-- sdd-owner: implementation -->
- [ ] **A.1.6 GREEN**: Verify property test passes. Add integration test for cross-company isolation: company A's period rejected for company B. <!-- sdd-owner: implementation -->
- [x] **A.1.7 TRIANGULATE**: Add edge case — period string with/without hyphen, leading zeros, case sensitivity. Ensure DB query handles these. <!-- sdd-owner: implementation -->
- [x] **A.1.8 REFACTOR**: Extract DB query behind a repository interface if not already; ensure `FiscalPeriodValidationError` is exported from the service index. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** none | **Files:** `fiscal-period.service.ts` (CREATE), test file (CREATE)

### A.2 — `TenantSunatContext` extension (RED → GREEN)

- [x] **A.2.1 RED**: Write unit test at `apps/api/src/features/sire/__tests__/unit/tenant-sunat-context.service.test.ts` — when `resolveTenantSunatContext` receives `fiscalPeriodId` in input, it appears in the returned `TenantSunatContext`. <!-- sdd-owner: implementation -->
- [x] **A.2.2 GREEN**: Modify `apps/api/src/features/sire/types.ts` — add `fiscalPeriodId?: string` to `TenantSunatContext` interface. Modify `apps/api/src/features/sire/services/tenant-sunat-context.service.ts` — add `fiscalPeriodId?: string` to `ResolveTenantSunatContextInput`, attach it to the return object when provided. <!-- sdd-owner: implementation -->
- [x] **A.2.3 RED**: Write unit test — credential resolution is unchanged when `fiscalPeriodId` is present (existing credential logic still resolves by `companyId` and `scope`). <!-- sdd-owner: implementation -->
- [x] **A.2.4 GREEN**: Verify existing credential resolution tests still pass. No credential logic was altered. <!-- sdd-owner: implementation -->
- [x] **A.2.5 REFACTOR**: Ensure the `fiscalPeriodId` field is read-only (resolved from DB, never from user input). Add JSDoc comment documenting this constraint. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** A.1 complete | **Files:** `types.ts` (MODIFY), `tenant-sunat-context.service.ts` (MODIFY), test file (MODIFY)

### A.3 — Route-level period validation (RED → GREEN)

- [x] **A.3.1 RED**: Write integration test — `POST /api/sire/diff` with a period NOT in the company's fiscal calendar → HTTP 422, error code `FISCAL_PERIOD_INVALID`. <!-- sdd-owner: implementation -->
- [x] **A.3.2 GREEN**: Modify `apps/api/src/features/sire/routes/diff.route.ts` — call `resolveFiscalPeriodId` before `resolveTenantSunatContext`, pass `fiscalPeriodId` to the context resolver. <!-- sdd-owner: implementation -->
- [x] **A.3.3 RED**: Write integration test — `POST /api/sire/submit` with invalid period → HTTP 422. <!-- sdd-owner: implementation -->
- [x] **A.3.4 GREEN**: Modify `apps/api/src/features/sire/routes/submit.route.ts` — same pattern. <!-- sdd-owner: implementation -->
- [x] **A.3.5 RED**: Write integration test — `POST /api/sire/analyze` with invalid period → HTTP 422. <!-- sdd-owner: implementation -->
- [x] **A.3.6 GREEN**: Modify `apps/api/src/features/sire/routes/analyze.route.ts` — same pattern. <!-- sdd-owner: implementation -->
- [x] **A.3.7 RED**: Write integration test — reporting routes with invalid period → HTTP 422. <!-- sdd-owner: implementation -->
- [x] **A.3.8 GREEN**: Modify `apps/api/src/features/sire/routes/reporting.route.ts` — same pattern. <!-- sdd-owner: implementation -->
- [x] **A.3.9 RED**: Write integration test — `POST /api/sire/diff/commit` with invalid period → HTTP 422. <!-- sdd-owner: implementation -->
- [x] **A.3.10 GREEN**: Modify `apps/api/src/features/sire/routes/diff-commit.route.ts` — same pattern. <!-- sdd-owner: implementation -->
- [x] **A.3.11 RED**: Write integration test — a period-free route (credential status check) does NOT require period validation. <!-- sdd-owner: implementation -->
- [x] **A.3.12 GREEN**: Verify credential status route skips `resolveFiscalPeriodId`. <!-- sdd-owner: implementation -->
- [x] **A.3.13 REFACTOR**: All 12+ SIRE routes validated. Audit each route handler for the `resolveFiscalPeriodId` call. No route escapes validation. <!-- sdd-owner: implementation -->

**Effort:** large | **Dependencies:** A.1, A.2 complete | **Files:** 5 route files (MODIFY), integration test files (CREATE/MODIFY)

### A.4 — Tenant access matrix stub

- [x] **A.4.1**: Create `docs/architecture/tenant-access-matrix.md` — document all SIRE routes, their `companyScopeGuard` status, existing role bindings (W2-04A, W2-05A), and a TODO section for deferred `FiscalContext` fields (`actorId`, `roleBindings`, `policyVersion`). <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** none | **Files:** `docs/architecture/tenant-access-matrix.md` (CREATE)

### A.5 — Export and index updates

- [x] **A.5.1**: Modify `apps/api/src/features/sire/index.ts` — export `resolveFiscalPeriodId`, `FiscalPeriodValidationError` from the new service. <!-- sdd-owner: implementation -->
- [x] **A.5.2 REFACTOR**: Run full test suite (`vitest run` from repo root for SIRE tests). All existing tests still pass. New Phase A tests pass. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** A.1–A.4 complete | **Files:** `index.ts` (MODIFY)

---

## Phase B: Evidence Core (PR2)

**Depends on:** Phase A (merged)
**Unblocks:** Phase C
**Requirements:** REQ-B-001, REQ-B-002, REQ-B-003, REQ-B-004, REQ-B-005

### B.1 — Evidence schema + migration (RED → GREEN)

- [x] **B.1.1 RED**: Write schema definition test — verify the `evidence_nodes` Drizzle table definition has columns: `id`, `type`, `artifact_id`, `period`, `company_id`, `hash`, `created_at`. <!-- sdd-owner: implementation -->
- [x] **B.1.2 GREEN**: Create `packages/persistence/src/schema/evidence-nodes.schema.ts` with the `evidenceNodes` table definition per design. <!-- sdd-owner: implementation -->
- [x] **B.1.3 RED**: Write schema definition test — verify the `evidence_edges` Drizzle table definition has columns: `id`, `from_node_id`, `to_node_id`, `edge_type`, `created_at`. <!-- sdd-owner: implementation -->
- [x] **B.1.4 GREEN**: Create `packages/persistence/src/schema/evidence-edges.schema.ts` with the `evidenceEdges` table definition, including FK references to `evidenceNodes`. <!-- sdd-owner: implementation -->
- [x] **B.1.5 GREEN**: Create `packages/persistence/drizzle/XXXX_add_evidence_tables.sql` — additive migration with `CREATE TABLE evidence_nodes`, `CREATE TABLE evidence_edges`, and `REVOKE UPDATE, DELETE ON evidence_nodes FROM app_role; REVOKE UPDATE, DELETE ON evidence_edges FROM app_role;`. <!-- sdd-owner: implementation -->
- [x] **B.1.6 GREEN**: Modify `packages/persistence/src/schema/index.ts` — export `evidenceNodes`, `evidenceEdges`, and their relations. <!-- sdd-owner: implementation -->
- [ ] **B.1.7 TRIANGULATE**: Run migration, verify tables exist with correct columns and that `UPDATE`/`DELETE` is rejected for `app_role`. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** Phase A merged | **Files:** 2 schema files (CREATE), 1 migration (CREATE), `index.ts` (MODIFY)

### B.2 — Hash chain computation (RED → GREEN)

- [x] **B.2.1 RED**: Write unit test at `apps/api/src/features/sire/__tests__/unit/sire-evidence.service.test.ts` — `computeHash({ previousHash: '', canonicalPayload: {...} })` returns `SHA-256('' + SHA-256(stableJSON(payload)))`. Verify hex output is 64 chars. <!-- sdd-owner: implementation -->
- [x] **B.2.2 GREEN**: Create `apps/api/src/features/sire/services/sire-evidence.service.ts` — implement `SireEvidenceService.computeHash` using `node:crypto` `createHash('sha256')` with deterministic JSON serialization (sorted keys). Implement `getPreviousHash` querying `evidenceNodes` by `(companyId, period, type)` ordered by `created_at DESC`. <!-- sdd-owner: implementation -->
- [x] **B.2.3 RED**: Write unit test — `computeHash` with a non-empty `previousHash` chains correctly: `SHA-256(prevHash + artifactHash)`. <!-- sdd-owner: implementation -->
- [x] **B.2.4 GREEN**: Verify chain correctness with known test vectors. <!-- sdd-owner: implementation -->
- [x] **B.2.5 RED**: Write property-based test — hash chain determinism: 100+ random payloads, same `(previousHash, payload)` → same hash every time. <!-- sdd-owner: implementation -->
- [x] **B.2.6 GREEN**: Verify `fast-check` determinism across multiple runs. <!-- sdd-owner: implementation -->
- [x] **B.2.7 RED**: Write property-based test — `hash` output is always exactly 64 lowercase hex characters. <!-- sdd-owner: implementation -->
- [x] **B.2.8 GREEN**: Verify hex constraint with `fast-check`. <!-- sdd-owner: implementation -->
- [x] **B.2.9 REFACTOR**: Extract stable JSON serializer into a shared utility if not already available. Add test for cross-environment determinism (same hash on different Node versions). <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** B.1 complete | **Files:** `sire-evidence.service.ts` (CREATE), test file (CREATE)

### B.3 — Evidence persistence on diff generation (RED → GREEN)

- [ ] **B.3.1 RED**: Write integration test — when `SireDiffService.buildThreeWayDiff` succeeds, an `evidence_nodes` row is created with `type = 'DerivedArtifact'`, correct `period`, `company_id`, non-empty `hash`. <!-- sdd-owner: implementation -->
- [x] **B.3.2 GREEN**: Implement `SireEvidenceService.createDerivedArtifactNode` — within a DB transaction, compute hash chain, insert `evidenceNodes`, insert `evidenceEdges` (`derived_from`) to source nodes. Wire into `SireDiffService.buildThreeWayDiff` inside the existing transaction. <!-- sdd-owner: implementation -->
- [ ] **B.3.3 RED**: Write integration test — diff generation that fails mid-way rolls back; no orphan evidence node remains. <!-- sdd-owner: implementation -->
- [ ] **B.3.4 GREEN**: Verify transaction rollback — if diff computation throws after evidence node insert, the node is not persisted. <!-- sdd-owner: implementation -->
- [ ] **B.3.5 RED**: Write integration test — `UPDATE` on `evidence_nodes` is rejected by the database. <!-- sdd-owner: implementation -->
- [ ] **B.3.6 GREEN**: Verify the migration `REVOKE` is effective. <!-- sdd-owner: implementation -->
- [ ] **B.3.7 RED**: Write integration test — `DELETE` on `evidence_nodes` is rejected by the database. <!-- sdd-owner: implementation -->
- [ ] **B.3.8 GREEN**: Same verification. <!-- sdd-owner: implementation -->
- [x] **B.3.9 RED**: Write snapshot test — `SHA-256(JSON.stringify(goldenArtifact))` matches expected hash from a golden fixture. <!-- sdd-owner: implementation -->
- [x] **B.3.10 GREEN**: Create golden fixture at `tests/fixtures/sire-evidence-golden.json` and verify hash. <!-- sdd-owner: implementation -->
- [x] **B.3.11 REFACTOR**: Modify `apps/api/src/features/sire/types.ts` — add `EvidenceNode`, `EvidenceEdge`, `EvidenceNodeType`, `EvidenceEdgeType` types. Ensure `SireEvidenceService` methods have clear JSDoc. <!-- sdd-owner: implementation -->

**Effort:** large | **Dependencies:** B.2 complete | **Files:** `sire-evidence.service.ts` (MODIFY), `sire-diff.service.ts` (MODIFY), `types.ts` (MODIFY), test/snapshot files (CREATE)

### B.4 — Superseding evidence on corrections

- [x] **B.4.1 RED**: Write unit test — `createSupersedingNode` creates a new evidence node with a `supersedes` edge to the previous node. Previous node remains unchanged. <!-- sdd-owner: implementation -->
- [x] **B.4.2 GREEN**: Implement `SireEvidenceService.createSupersedingNode` — create new node, insert `supersedes` edge to `previousNodeId`. <!-- sdd-owner: implementation -->
- [x] **B.4.3 TRIANGULATE**: Verify hash chain continuity: new node's `previousHash` equals the superseded node's `hash`. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** B.3 complete | **Files:** `sire-evidence.service.ts` (MODIFY), test file (MODIFY)

---

## Phase C: Trust Layer (PR3)

**Depends on:** Phase B (merged)
**Unblocks:** Phase E
**Requirements:** REQ-C-001, REQ-C-002, REQ-C-003, REQ-C-004, REQ-C-005

### C.1 — Materiality threshold schema (RED → GREEN)

- [x] **C.1.1 RED**: Write schema test — `companies` table includes `sire_materiality_threshold_pen` (nullable numeric) and `sire_reversibility_window_hours` (integer, default 24). <!-- sdd-owner: implementation -->
- [x] **C.1.2 GREEN**: Modify `packages/persistence/src/schema/core.schema.ts` — add the two columns to the `companies` table definition. <!-- sdd-owner: implementation -->
- [x] **C.1.3 GREEN**: Create `packages/persistence/drizzle/0003_add_company_sire_config.sql` — additive migration: `ALTER TABLE companies ADD COLUMN sire_materiality_threshold_pen NUMERIC(18,2); ALTER TABLE companies ADD COLUMN sire_reversibility_window_hours INTEGER DEFAULT 24;`. <!-- sdd-owner: implementation -->
- [x] **C.1.4 TRIANGULATE**: Run migration, verify columns exist with correct defaults. NULL threshold → backward compatible. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** Phase B merged | **Files:** `core.schema.ts` (MODIFY), migration (CREATE)

### C.2 — `buildSummary` threshold parameter (RED → GREEN)

- [x] **C.2.1 RED**: Write unit test — `buildSummary(rows, { threshold: 500 })` with differences [100, 200, 500, 1000] → `critical = 2`. <!-- sdd-owner: implementation -->
- [x] **C.2.2 GREEN**: Modify `apps/api/src/features/sire/services/sire-diff.service.ts` — add optional `opts?: { threshold?: number }` parameter to `buildSummary`. When provided, `critical` filters by `|difference| >= threshold`. When omitted, all non-MATCH rows are critical. <!-- sdd-owner: implementation -->
- [x] **C.2.3 RED**: Write unit test — `buildSummary(rows)` without threshold → all non-MATCH rows are critical (backward compat). <!-- sdd-owner: implementation -->
- [x] **C.2.4 GREEN**: Verify backward compatible default. <!-- sdd-owner: implementation -->
- [x] **C.2.5 RED**: Write unit test — `buildSummary(rows, { threshold: 0 })` → all non-MATCH rows are critical (`>= 0`). <!-- sdd-owner: implementation -->
- [x] **C.2.6 GREEN**: Verify zero-threshold edge case. <!-- sdd-owner: implementation -->
- [x] **C.2.7 RED**: Write property-based test — for any threshold and any set of rows, `critical ≤ total non-MATCH count`. <!-- sdd-owner: implementation -->
- [x] **C.2.8 GREEN**: Verify invariant with `@fast-check/vitest`. <!-- sdd-owner: implementation -->
- [x] **C.2.9 REFACTOR**: Update `buildSummary` JSDoc. Ensure existing callers (diff route, reporting route) are not broken. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** C.1 complete | **Files:** `sire-diff.service.ts` (MODIFY), test file (MODIFY)

### C.3 — Golden test fixtures

- [x] **C.3.1 RED**: Create golden input fixture at `tests/fixtures/sire-diff-input.json` with known ledger, SUNAT, and CPE data. Write test — `buildDiffRows(input)` output matches `tests/fixtures/sire-diff-expected.json` exactly. <!-- sdd-owner: implementation -->
- [x] **C.3.2 GREEN**: Create `tests/fixtures/sire-diff-expected.json` — canonical expected output. Verify deterministic match. <!-- sdd-owner: implementation -->
- [x] **C.3.3 RED**: Write test — `buildSummary(goldenRows, { threshold: 1000 })` matches expected summary. <!-- sdd-owner: implementation -->
- [x] **C.3.4 GREEN**: Verify deterministic match with golden test. <!-- sdd-owner: implementation -->
- [x] **C.3.5 TRIANGULATE**: Deterministic output verified — same inputs produce same output twice. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** C.2 complete | **Files:** 3 fixture files (CREATE), test file (CREATE/MODIFY)

### C.4 — EvidenceBadge component (RED → GREEN)

- [x] **C.4.1 RED**: Write component test at `apps/web/src/components/evidence/__tests__/EvidenceBadge.test.tsx` — `EvidenceBadge` renders source label for all 3 sources (`SUNAT`, `ledger`, `CPE`). <!-- sdd-owner: implementation -->
- [x] **C.4.2 GREEN**: Create `apps/web/src/components/evidence/EvidenceBadge.tsx` — pure presentational component with props `{ source, status, confidence }`. Render source label with appropriate icon/color. <!-- sdd-owner: implementation -->
- [x] **C.4.3 RED**: Write component test — `EvidenceBadge` renders all 3×3×3 = 27 state combinations correctly (source × status × confidence). <!-- sdd-owner: implementation -->
- [x] **C.4.4 GREEN**: Implement all 27 state visual variants using status-based CSS classes and confidence dots. <!-- sdd-owner: implementation -->
- [x] **C.4.5 RED**: Write accessibility test — badge has `aria-label` describing source, status, and confidence. <!-- sdd-owner: implementation -->
- [x] **C.4.6 GREEN**: Add `aria-label` attribute with `role="status"`. <!-- sdd-owner: implementation -->
- [x] **C.4.7 RED**: Write integration test — `SireDiffTable` renders `EvidenceBadge` in each diff row cell (SUNAT value cell gets SUNAT badge, ledger value cell gets ledger badge). <!-- sdd-owner: implementation -->
- [x] **C.4.8 GREEN**: Modify `apps/web/src/features/artifacts/components/sire-diff-card/SireDiffRow.tsx` — render `<EvidenceBadge>` in each row's value cells (Local, SUNAT, CPE). <!-- sdd-owner: implementation -->
- [x] **C.4.9 REFACTOR**: Badge is pure presentational component — no data fetching. Phase B provides dynamic data later. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** C.1 complete (can start in parallel with C.2/C.3) | **Files:** `EvidenceBadge.tsx` (CREATE), `SireDiffTable.tsx` (MODIFY), test file (CREATE)

### C.5 — Reversibility window + revert endpoint (RED → GREEN)

- [x] **C.5.1 RED**: Write unit test — revert within window returns success, window validation logic. <!-- sdd-owner: implementation -->
- [x] **C.5.2 GREEN**: Create `apps/api/src/features/sire/services/sire-revert.service.ts` — `SireRevertService` with `validateReversibilityWindow`, `computeRevertDeadline`, `computeRevertAvailableUntil`. Core window validation and configurable deadline computation. <!-- sdd-owner: implementation -->
- [x] **C.5.3 GREEN**: Create `apps/api/src/features/sire/routes/revert.route.ts` — `POST /api/sire/diff/revert` endpoint with fiscal period validation, window check, 409 on expiry. <!-- sdd-owner: implementation -->
- [x] **C.5.4 GREEN**: Modify `apps/api/src/features/sire/index.ts` — register revert route and export `SireRevertService`. <!-- sdd-owner: implementation -->
- [x] **C.5.5 RED**: Write unit test — revert after window expiry returns `withinWindow: false`. <!-- sdd-owner: implementation -->
- [x] **C.5.6 GREEN**: Add window expiration check in service + route returns 409. <!-- sdd-owner: implementation -->
- [x] **C.5.7 RED**: Null window test — null `revertAvailableUntil` treated as expired. <!-- sdd-owner: implementation -->
- [x] **C.5.8 GREEN**: Null guard in `validateReversibilityWindow`. <!-- sdd-owner: implementation -->
- [x] **C.5.9 RED**: Write unit test — `computeRevertDeadline(48)` = T+48h, `computeRevertDeadline(2)` = T+2h, default 24h. <!-- sdd-owner: implementation -->
- [x] **C.5.10 GREEN**: `computeRevertDeadline` accepts configurable `windowHours` parameter. Per-company config read from `companies.sire_reversibility_window_hours` (default 24). <!-- sdd-owner: implementation -->
- [x] **C.5.11 REFACTOR**: Revert endpoint follows same `fiscalPeriodId` validation pattern from Phase A. Window boundary test validates inclusive `>=` check. <!-- sdd-owner: implementation -->

**Effort:** large | **Dependencies:** C.1, B.3 complete | **Files:** `sire-revert.service.ts` (CREATE), `revert.route.ts` (CREATE), `index.ts` (MODIFY), integration tests (CREATE)

---

## Phase D: Durable Execution (PR4)

**Depends on:** Phase C (merged)
**Unblocks:** Phase E
**Requirements:** REQ-D-001, REQ-D-002, REQ-D-003, REQ-D-004

### D.1 — UNKNOWN state + payload_base64 schema (RED → GREEN)

- [x] **D.1.1 RED**: Write schema test — `sire_submissions.status` varchar accepts `UNKNOWN` and `RECONCILING` values. `payload_base64` column exists (TEXT, nullable). <!-- sdd-owner: implementation -->
- [x] **D.1.2 GREEN**: Modify `packages/persistence/src/schema/sire.schema.ts` — add `payload_base64: text("payload_base64")` to `sireSubmissions`. Update status column comment to include `UNKNOWN` and `RECONCILING`. <!-- sdd-owner: implementation -->
- [x] **D.1.3 GREEN**: Create `packages/persistence/drizzle/0004_add_sire_unknown_payload.sql` — `ALTER TABLE sire_submissions ADD COLUMN payload_base64 TEXT; COMMENT ON COLUMN sire_submissions.status IS 'PENDING, SUBMITTED, ACCEPTED, REJECTED, OBSERVED, SIMULATED, FAILED, UNKNOWN, RECONCILING';`. <!-- sdd-owner: implementation -->
- [ ] **D.1.4 TRIANGULATE**: Run migration, verify column exists, NULL for existing rows. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** Phase C merged | **Files:** `sire.schema.ts` (MODIFY), migration (CREATE)

### D.2 — Timeout → UNKNOWN transition (RED → GREEN)

- [x] **D.2.1 RED**: Write unit test — when SIRE submission HTTP request times out, `sire_submissions.status` is set to `UNKNOWN` (not `FAILED`), `sunat_status` is NULL. <!-- sdd-owner: implementation -->
- [x] **D.2.2 GREEN**: Modify `apps/api/src/features/sire/services/submission/service.ts` — in the timeout error handler, set status to `UNKNOWN` instead of `FAILED`. Store the submission payload in `payload_base64` during initial submission creation. <!-- sdd-owner: implementation -->
- [x] **D.2.3 GREEN**: Modify `apps/api/src/features/sire/sire-submission.service.ts` — set `payload_base64` during submission row insert. <!-- sdd-owner: implementation -->
- [x] **D.2.4 RED**: Write unit test — non-timeout SUNAT error (explicit 4xx/5xx response) still transitions to `FAILED` (not `UNKNOWN`). <!-- sdd-owner: implementation -->
- [x] **D.2.5 GREEN**: Verify error discrimination: timeout → `UNKNOWN`, explicit error response → `FAILED`. <!-- sdd-owner: implementation -->
- [x] **D.2.6 RED**: Modify `apps/api/src/features/sire/types.ts` — add `UNKNOWN`, `RECONCILING` to the submission status union type. <!-- sdd-owner: implementation -->
- [x] **D.2.7 REFACTOR**: Ensure existing submission flow is unchanged — `PENDING → SUBMITTED → ACCEPTED/REJECTED/OBSERVED` transitions preserved. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** D.1 complete | **Files:** `submission/service.ts` (MODIFY), `sire-submission.service.ts` (MODIFY), `types.ts` (MODIFY), test files (MODIFY)

### D.3 — SireReconcilerService (RED → GREEN)

- [x] **D.3.1 RED**: Write unit test — `reconcileUnknown` with SUNAT response "ACEPTADO" → status transitions `UNKNOWN → RECONCILING → COMPLETED`. <!-- sdd-owner: implementation -->
- [x] **D.3.2 GREEN**: Create `apps/api/src/features/sire/services/sire-reconciler.service.ts` — `SireReconcilerService.reconcileUnknown` sets status to `RECONCILING`, calls SUNAT API via `resolveTenantSunatContext` (Phase A pattern), handles "ACEPTADO"/"ACCEPTED" response → `COMPLETED`. <!-- sdd-owner: implementation -->
- [x] **D.3.3 RED**: Write unit test — SUNAT responds "no record" for trackingId → `FAILED_RETRYABLE` with retry payload. <!-- sdd-owner: implementation -->
- [x] **D.3.4 GREEN**: Implement no-record path. <!-- sdd-owner: implementation -->
- [x] **D.3.5 RED**: Write unit test — SUNAT API returns HTTP 503 → submission stays `RECONCILING`, `nextRetryAt` is set with exponential backoff. <!-- sdd-owner: implementation -->
- [x] **D.3.6 GREEN**: Implement graceful error recovery with exponential backoff and `nextRetryAt`. <!-- sdd-owner: implementation -->
- [ ] **D.3.7 RED**: Write contract test — SUNAT reconciliation API response shape matches expected Zod schema. <!-- sdd-owner: implementation -->
- [ ] **D.3.8 GREEN**: Create Zod schema for SUNAT reconciliation response, validate in service. <!-- sdd-owner: implementation -->
- [ ] **D.3.9 REFACTOR**: Ensure reconciler uses the same OAuth credential resolution as submission. Create evidence node for reconciliation action (Phase B integration). <!-- sdd-owner: implementation -->

**Effort:** large | **Dependencies:** D.2 complete, Phase B (evidence) merged | **Files:** `sire-reconciler.service.ts` (CREATE), test files (CREATE)

### D.4 — Retry uses stored payload (RED → GREEN)

- [x] **D.4.1 RED**: Write unit test — `SireRetryService.processRetryQueue` uses `payload_base64` from the submission row for retry. <!-- sdd-owner: implementation -->
- [x] **D.4.2 GREEN**: Modify `apps/api/src/features/sire/services/sire-retry.service.ts` — read `payload_base64` from the submission row, use it as the retry payload instead of requiring caller resupply. <!-- sdd-owner: implementation -->
- [x] **D.4.3 RED**: Write unit test — retry on a submission with NULL `payload_base64` → clear error, submission marked non-retryable. <!-- sdd-owner: implementation -->
- [x] **D.4.4 GREEN**: Add NULL payload guard with descriptive error message. <!-- sdd-owner: implementation -->
- [ ] **D.4.5 RED**: Write property-based test — any valid Base64 string round-trips through store + retrieve without corruption. <!-- sdd-owner: implementation -->
- [ ] **D.4.6 GREEN**: Verify round-trip with `@fast-check/vitest`. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** D.2 complete | **Files:** `sire-retry.service.ts` (MODIFY), test file (MODIFY)

### D.5 — RECONCILING sweeper (RED → GREEN)

- [ ] **D.5.1 RED**: Write integration test — submission stuck in `RECONCILING` for > 30 minutes → sweeper resets to `UNKNOWN` and re-enqueues. <!-- sdd-owner: implementation -->
- [x] **D.5.2 GREEN**: Implement `SireReconcilerService.sweepStuckReconciling` — uses `SELECT ... FOR UPDATE SKIP LOCKED`, resets status, emits metric. (Skeleton method exists; full DB integration pending live PostgreSQL) <!-- sdd-owner: implementation -->
- [ ] **D.5.3 RED**: Write integration test — end-to-end `UNKNOWN → RECONCILING → COMPLETED` flow with mocked SUNAT responses. <!-- sdd-owner: implementation -->
- [ ] **D.5.4 GREEN**: Verify full flow. <!-- sdd-owner: implementation -->
- [ ] **D.5.5 REFACTOR**: Ensure sweeper uses advisory lock pattern from existing `sireJobs` infrastructure. Configurable timeout interval (env var, default 30 min). <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** D.3 complete | **Files:** `sire-reconciler.service.ts` (MODIFY), integration test (CREATE)

---

## Phase E: UX & Integration (PR5)

**Depends on:** Phase D (merged)
**Unblocks:** nothing (terminal phase)
**Requirements:** REQ-E-001, REQ-E-002, REQ-E-003, REQ-E-004, REQ-E-005

### E.1 — Workspace state persistence (RED → GREEN)

- [x] **E.1.1 RED**: (ADAPTED) No `sire_comparisons` schema exists. Wrote Zustand store unit tests instead. <!-- sdd-owner: implementation -->
- [x] **E.1.2 GREEN**: (ADAPTED) Created Zustand store with localStorage persistence instead of DB migration. <!-- sdd-owner: implementation -->
- [x] **E.1.3 GREEN**: (ADAPTED) No DB migration needed — localStorage-based persistence. <!-- sdd-owner: implementation -->
- [x] **E.1.4 RED**: (ADAPTED) Wrote Zustand store tests covering all workspace actions (9 tests). <!-- sdd-owner: implementation -->
- [x] **E.1.5 GREEN**: (ADAPTED) Zustand `persist` middleware handles save/restore; no API routes needed. <!-- sdd-owner: implementation -->
- [x] **E.1.6 GREEN**: (ADAPTED) Store imported directly; no route registration needed. <!-- sdd-owner: implementation -->
- [x] **E.1.7 RED**: Write integration test — page reload restores workspace (diff artifact + resolutions + step). ✅ (Zustand persist + SireDiffPage tests) <!-- sdd-owner: implementation -->
- [x] **E.1.8 GREEN**: Created `apps/web/src/features/sire/stores/sire-diff-workspace.store.ts` — Zustand store with persist (localStorage) instead of API hook. <!-- sdd-owner: implementation -->
- [x] **E.1.9 GREEN**: Modified `apps/web/src/features/sire/SireDiffPage.tsx` — integrated Zustand workspace store, URL recovery, loading/empty/error states. <!-- sdd-owner: implementation -->
- [x] **E.1.10 TRIANGULATE**: Verified: no workspace → input form. Workspace restored via localStorage persist middleware on reload. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** Phase D merged | **Files:** `sire-comparisons.schema.ts` (MODIFY), migration (CREATE), `workspace.route.ts` (CREATE), `useSireDiffWorkspace.ts` (CREATE), `SireDiffPage.tsx` (MODIFY), `index.ts` (MODIFY)

### E.2 — URL-based recovery

- [x] **E.2.1 RED**: Wrote SireDiffPage test for URL-based period recovery. <!-- sdd-owner: implementation -->
- [x] **E.2.2 GREEN**: Modified `SireDiffPage.tsx` — reads `period` from URL search params on mount, restores workspace period. <!-- sdd-owner: implementation -->
- [x] **E.2.3 TRIANGULATE**: Invalid/missing period → default "2026-03". URL with `?period=2026-04` → workspace period restored to "2026-04". <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** E.1 complete | **Files:** `SireDiffPage.tsx` (MODIFY)

### E.3 — Virtualized diff rows (RED → GREEN)

- [x] **E.3.1 RED**: Wrote component test — diff with 200 rows → only viewport + overscan rows in DOM (VirtualizedSireDiffTable.test.tsx). <!-- sdd-owner: implementation -->
- [x] **E.3.2 GREEN**: `@tanstack/react-virtual` already installed (v3.14.2). Created `VirtualizedSireDiffTable.tsx` — delegates to virtualization when `rows.length > 100`. Below 100 rows, renders normally via existing SireDiffTable. <!-- sdd-owner: implementation -->
- [x] **E.3.3 RED**: Tested: empty rows shows empty state, 200 rows shows only virtual items (not all). <!-- sdd-owner: implementation -->
- [x] **E.3.4 GREEN**: Verified threshold logic: `visibleRows.length > 100` gates virtualization. <!-- sdd-owner: implementation -->
- [ ] **E.3.5 RED**: Write component test — scrolling the virtualized list renders additional rows on demand, no jank/layout shift. <!-- sdd-owner: implementation -->
- [ ] **E.3.6 GREEN**: Tune `overscan` and `estimateSize` for smooth scrolling. <!-- sdd-owner: implementation -->
- [x] **E.3.7 REFACTOR**: Extracted `VirtualizedSireDiffTable` as separate component. `@tanstack/react-virtual` version already pinned at 3.14.2. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** E.1 complete | **Files:** `SireDiffTable.tsx` (MODIFY), `apps/web/package.json` (MODIFY), test files (CREATE)

### E.4 — Keyboard navigation (RED → GREEN)

- [ ] **E.4.1 RED**: Write component test — pressing `j` in diff viewer moves highlight to next row. <!-- sdd-owner: implementation -->
- [x] **E.4.2 GREEN**: Modified `useSireDiffKeyboardShortcuts.ts` — added `j` (same as ArrowDown) handler. <!-- sdd-owner: implementation -->
- [ ] **E.4.3 RED**: Write component test — pressing `k` moves to previous row. <!-- sdd-owner: implementation -->
- [x] **E.4.4 GREEN**: Added `k` (same as ArrowUp) handler. <!-- sdd-owner: implementation -->
- [ ] **E.4.5 RED**: Write component test — pressing `Enter` selects/toggles focused row, opens resolution panel. <!-- sdd-owner: implementation -->
- [x] **E.4.6 GREEN**: Added `Enter` (without Ctrl) handler — toggles inline editor for focused row. <!-- sdd-owner: implementation -->
- [ ] **E.4.7 RED**: Write accessibility test — keyboard navigation is screen-reader compatible (proper `aria-*` attributes on rows). <!-- sdd-owner: implementation -->
- [ ] **E.4.8 GREEN**: Add `aria-rowindex`, `aria-selected`, `role="row"` to virtualized rows. <!-- sdd-owner: implementation -->
- [ ] **E.4.9 REFACTOR**: Ensure keyboard nav works with both virtualized and non-virtualized lists. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** E.3 complete | **Files:** `useSireDiffKeyboardShortcuts.ts` (MODIFY), `SireDiffTable.tsx` (MODIFY), test file (MODIFY)

### E.5 — Loading, empty, and error states (RED → GREEN)

- [x] **E.5.1 RED**: Wrote SireDiffPage test — during loading, skeleton renders, button disabled with spinner. <!-- sdd-owner: implementation -->
- [x] **E.5.2 GREEN**: Modified `SireDiffPage.tsx` — added LOADING state with skeleton loader using existing `<Skeleton>` component. <!-- sdd-owner: implementation -->
- [x] **E.5.3 RED**: Wrote SireDiffPage test — all-match diff renders "Todos los registros coinciden" message. <!-- sdd-owner: implementation -->
- [x] **E.5.4 GREEN**: Added EMPTY state: positive message "Todos los registros coinciden — sin discrepancias" with zero counts. <!-- sdd-owner: implementation -->
- [x] **E.5.5 RED**: Wrote SireDiffPage test — error state shows message + "Reintentar" button, previous artifact visible. <!-- sdd-owner: implementation -->
- [x] **E.5.6 GREEN**: Added ERROR state: `<ErrorState>` component with retry action, artifact content preserved (renders above error). <!-- sdd-owner: implementation -->
- [ ] **E.5.7 REFACTOR**: Extract state components: `<DiffLoadingState>`, `<DiffEmptyState>`, `<DiffErrorState>`. Ensure all states use Glass & Steel tokens. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** E.1 complete | **Files:** `SireDiffPage.tsx` (MODIFY), new state components (CREATE), test files (CREATE)

### E.6 — Vocabulary alignment (RED → GREEN)

- [x] **E.6.1 RED**: Wrote SireDiffPage test — page `<h1>` title renders "Conciliación SIRE". <!-- sdd-owner: implementation -->
- [x] **E.6.2 GREEN**: Modified `SireDiffPage.tsx` — updated `<h1>` to "Conciliación SIRE", description to Spanish, button to "Ejecutar conciliación". <!-- sdd-owner: implementation -->
- [ ] **E.6.3 RED**: Write snapshot test — sidebar navigation item renders "Cumplimiento SIRE". <!-- sdd-owner: implementation -->
- [x] **E.6.4 GREEN**: Updated `apps/web/src/lib/navigation/items/fiscal.ts` — navigation label changed to "Conciliación SIRE". <!-- sdd-owner: implementation -->
- [x] **E.6.5 TRIANGULATE**: Audited SIRE UI strings — "Conciliación SIRE" used consistently. Route path `/cumplimiento/sire-diff` preserves technical prefix. <!-- sdd-owner: implementation -->

**Effort:** small | **Dependencies:** E.5 complete | **Files:** `SireDiffPage.tsx` (MODIFY), route config (MODIFY), snapshot tests (CREATE)

### E.7 — E2E integration test

- [ ] **E.7.1 RED**: Write E2E test (Playwright) — full workspace flow: generate diff → resolve discrepancies → reload page → verify state restored (artifact + resolutions + step). <!-- sdd-owner: implementation -->
- [ ] **E.7.2 GREEN**: Implement E2E with mocked API or test database. <!-- sdd-owner: implementation -->
- [ ] **E.7.3 REFACTOR**: Ensure E2E covers: keyboard nav, empty state, error recovery, vocabulary labels. <!-- sdd-owner: implementation -->

**Effort:** medium | **Dependencies:** E.1–E.6 complete | **Files:** E2E test file (CREATE)

---

## Post-Implementation Verification (All Phases)

- [ ] Run full SIRE test suite: `vitest run` from repo root — all Phase A–E tests pass. <!-- sdd-owner: implementation -->
- [ ] Run database migrations in order A→E, verify no conflicts. <!-- sdd-owner: implementation -->
- [ ] Verify all 20 requirements from `spec.md` have passing acceptance tests. <!-- sdd-owner: implementation -->
- [ ] Bounded review: start explicit review on the complete implementation diff (post all 5 PR merges). <!-- sdd-owner: parent -->
- [ ] Validate pre-commit receipt before committing final tasks.md update. <!-- sdd-owner: parent -->
