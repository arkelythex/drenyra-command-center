# SDD Tasks: Risk, Audit & Internal Controls

**Change:** `drenyra-risk-audit`
**Created:** 2026-07-26
**Status:** Tasks
**Depends on:** `spec`, `design`

---

## Review Workload Forecast

| Field                   | Value                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estimated changed lines | 1800–2700 (all phases)                                                                                                                                                        |
| 400-line budget risk    | High                                                                                                                                                                          |
| Chained PRs recommended | Yes                                                                                                                                                                           |
| Suggested split         | PR 1 (Phase 1: 400–600L) → PR 2 (Phase 2A: Controls, 250–350L) → PR 3 (Phase 2B: Risk Matrix, 350–450L) → PR 4 (Phase 2C: Policy Engine, 200–370L) → PR 5 (Phase 3: 600–900L) |
| Delivery strategy       | auto-chain                                                                                                                                                                    |
| Chain strategy          | stacked-to-main                                                                                                                                                               |

```
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

---

## Phase 1 PR: Consolidation & Hardening

**Estimated lines:** 400–600 | **Files:** ~25 new/modified | **Risk:** LOW (additive domain, no UI refactor)

---

### Phase 1A — Hash Chain Unification

**Estimated lines:** ~200–300 | **Files:** ~10

---

#### 1A.1 — RED: write verifyChain unit tests

- [ ] Create `packages/domain/src/audit-ledger/__tests__/verify-chain.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should return valid for a chain of 3 events with correct hashes`
  - Test: `should detect tampering at event index N and return brokenAt, expectedHash, actualHash`
  - Test: `should accept a single-event chain as valid`
  - Test: `should reject an empty events array`
  - Test: `should handle prevHash=null as Genesis event at position 0`
- Acceptance: 5+ test cases, all red initially. Uses `computeAuditHash` and `HashChain` from the existing shared domain.
- Files: `packages/domain/src/audit-ledger/__tests__/verify-chain.test.ts`
- Depends on: nothing (existing domain is source of truth)
- Est. lines: ~100

---

#### 1A.2 — GREEN: implement verifyChain in shared domain

- [ ] Create `packages/domain/src/audit-ledger/verify-chain.ts` with: <!-- sdd-owner: implementation -->
  - `ChainVerificationResult` interface: `{ valid, chainLength, brokenAt?, expectedHash?, actualHash?, firstEventId?, lastEventId? }`
  - `verifyChain(events: AuditEvent[]): Promise<ChainVerificationResult>` — walk chain, re-compute hash per event, compare stored `chainHash` against computed hash
  - Uses existing `computeAuditHash` and `HashChain` from `audit-ledger/`
- Acceptance: all 1A.1 tests pass. Chain verification correct for valid, tampered, and edge-case inputs.
- Files: `packages/domain/src/audit-ledger/verify-chain.ts`
- Depends on: 1A.1 (RED tests)
- Est. lines: ~60

---

#### 1A.3 — RED: write AuditEvent entity tests

- [ ] Create `packages/domain/src/audit-ledger/__tests__/audit-event.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should reconstitute a valid AuditEvent from props`
  - Test: `should require id, scope, payload, chainHash, createdAt`
  - Test: `should accept prevHash null as Genesis`
  - Test: `should validate chainHash against HashChain.create regex (/^[0-9a-f]{64}$/)`
- Files: `packages/domain/src/audit-ledger/__tests__/audit-event.test.ts`
- Depends on: 1A.2 (verifyChain exists to link against)
- Est. lines: ~60

---

#### 1A.4 — GREEN: implement AuditEvent entity

- [ ] Create `packages/domain/src/audit-ledger/audit-event.ts` with `AuditEvent` class/entity using existing domain patterns. <!-- sdd-owner: implementation -->
  - Props: `id`, `scope`, `payload`, `chainHash`, `prevHash`, `createdAt`
  - Validate `chainHash` via `HashChain.create`
  - `prevHash` nullable for Genesis events
- Files: `packages/domain/src/audit-ledger/audit-event.ts`
- Depends on: 1A.3 (RED tests)
- Est. lines: ~40

---

#### 1A.5 — GREEN: add HashableData interface and computeHashFromData convenience wrapper

- [ ] Create `packages/domain/src/audit-ledger/hashable-data.ts` with `HashableData` interface: `{ id, createdAt, inputs, outputs, prevHash }`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/audit-ledger/compute-hash-from-data.ts` with `computeHashFromData(data: HashableData): Promise<string>` — pipe-join `id|createdAt|normalizeJson(inputs)|normalizeJson(outputs)|prevHash??'GENESIS'`, delegate to shared `computeAuditHash`.
- Acceptance: produces identical hashes to the API's current `hash.service.ts` `computeHash` for equivalent `HashableData` input.
- Files: `packages/domain/src/audit-ledger/hashable-data.ts`, `packages/domain/src/audit-ledger/compute-hash-from-data.ts`
- Depends on: 1A.4 (AuditEvent exists; shared domain extended)
- Est. lines: ~50

---

#### 1A.6 — REFACTOR: extend shared domain barrel exports

- [ ] Update `packages/domain/src/audit-ledger/index.ts` to export: `HashableData` (type), `computeHashFromData`, `AuditEvent`, `AuditEventProps`, `verifyChain`, `ChainVerificationResult`. <!-- sdd-owner: implementation -->
- Acceptance: all new symbols are importable from `@drenyra/domain`. Existing exports unchanged.
- Files: `packages/domain/src/audit-ledger/index.ts`
- Depends on: 1A.5 (all new modules exist)
- Est. lines: ~10

---

#### 1A.7 — REFACTOR: migrate agent-audit-trail API feature to shared domain

- [ ] Replace imports in `apps/api/src/features/agent-audit-trail/domain/factory.ts`: `computeHash` → `computeHashFromData` from `@drenyra/domain`; `HashChain` from `./value-objects/hash-chain.vo` → `HashChain` from `@drenyra/domain`. <!-- sdd-owner: implementation -->
- [ ] Replace import in `apps/api/src/features/agent-audit-trail/domain/entity.ts`: `HashChain` → from `@drenyra/domain`.
- [ ] Replace imports in `apps/api/src/features/agent-audit-trail/infrastructure/repository.ts`: `HashChain` → from `@drenyra/domain`.
- [ ] Update `domain/index.ts` barrel: remove deleted exports, re-export from shared domain where needed.
- [ ] **DELETE** `apps/api/src/features/agent-audit-trail/domain/hash.service.ts`
- [ ] **DELETE** `apps/api/src/features/agent-audit-trail/domain/value-objects/hash-chain.vo.ts`
- Acceptance: `AgentDecisionLog` factory produces identical entities before/after migration (snapshot test). All existing agent-audit-trail tests pass with no changes.
- Files: 6 modified + 2 deleted paths listed above
- Depends on: 1A.6 (shared exports available)
- Est. lines: ~50 (modifications + deletions)

---

#### 1A.8 — GREEN: add chain verification endpoint to agent-audit-trail API

- [ ] Refactor `apps/api/src/features/agent-audit-trail/application/queries/verify-chain.query.ts`: replace `verifyHash` from local domain with `verifyChain` from `@drenyra/domain`. <!-- sdd-owner: implementation -->
- [ ] Add routes to `apps/api/src/features/agent-audit-trail/api/routes.ts`:
  - `GET /audit/verify-chain/:scope` → query DB for all audit events in scope (ordered by createdAt), run `verifyChain`, return `ChainVerificationResult`
  - `GET /audit/verify-chain/company/:companyId` → scope-based alias for `company/{companyId}`
- Acceptance: `GET /audit/verify-chain/company/1234` returns `{ valid: true, chainLength: N }`. Broken chain returns `{ valid: false, brokenAt, expectedHash, actualHash }`.
- Files: `apps/api/src/features/agent-audit-trail/application/queries/verify-chain.query.ts`, `apps/api/src/features/agent-audit-trail/api/routes.ts`
- Depends on: 1A.7 (API feature uses shared domain)
- Est. lines: ~60

---

#### 1A.9 — GREEN: implement tamper-detection alerting

- [ ] Create `packages/infrastructure/src/alerting/tamper-alert.ts` with `emitTamperAlert(params)` — on verification failure, persist to `audit_alerts` table with `{ scope, brokenAt, expectedHash, actualHash, severity: 'CRITICAL', timestamp }`. <!-- sdd-owner: implementation -->
- [ ] Wire into verify-chain query: call `emitTamperAlert` when `verifyChain` returns `valid: false`.
- Acceptance: tampered chain triggers a persisted alert. Alert is queryable via DB.
- Files: `packages/infrastructure/src/alerting/tamper-alert.ts`, modification in verify-chain query route
- Depends on: 1A.8 (chain verification endpoint exists)
- Est. lines: ~40

---

#### 1A.10 — GREEN: implement SUNAT bulk export (UBL-like XML)

- [ ] Replace template code in `apps/api/src/features/agent-audit-trail/api/xml-exporter.ts` with real UBL-like XML export from DB-backed audit events, filtered by `period` and `companyId`. <!-- sdd-owner: implementation -->
- [ ] Add route: `GET /audit/export/sunat?period=YYYY-MM&companyId={id}`
- XML must include per-event: `id`, `scope`, `payload`, `chainHash`, `prevHash`, `createdAt`, and a `<HashEvidence>` block with chain position.
- Acceptance: export produces valid XML for a real period. Schema includes hash-chain evidence.
- Files: `apps/api/src/features/agent-audit-trail/api/xml-exporter.ts` (modify), route added in routes.ts
- Depends on: 1A.9 (alerting wired; infrastructure ready)
- Est. lines: ~80

---

#### 1A.11 — TRIANGULATE: governance audit hash-chain integration

- [ ] Modify `apps/api/src/features/governance-audit/artifact-event-audit.service.ts`: after inserting into `auth_audit_logs`, also record a hash-chain event via shared `computeAuditHash` into `audit_events` table with scope `governance/{artifactId}`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/governance-audit/__tests__/hash-chain-link.test.ts`: verify governance events appear in `verify-chain` output.
- Acceptance: governance artifact changes produce hash-chain events. `GET /audit/verify-chain/governance/{artifactId}` includes governance events.
- Files: `apps/api/src/features/governance-audit/artifact-event-audit.service.ts` (modify), `apps/api/src/features/governance-audit/__tests__/hash-chain-link.test.ts` (new)
- Depends on: 1A.8 (verify-chain endpoint), 1A.4 (AuditEvent entity)
- Est. lines: ~60

---

#### 1A.12 — GREEN: database schema for audit_events and audit_alerts

- [ ] Create `packages/persistence/src/schema/audit-events.schema.ts` Drizzle schema: `id`, `scope`, `payload` (jsonb), `chainHash`, `prevHash`, `createdAt`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/persistence/src/schema/audit-alerts.schema.ts` Drizzle schema: `id`, `scope`, `brokenAt`, `expectedHash`, `actualHash`, `severity`, `timestamp`, `resolvedAt?`.
- Acceptance: migrations run cleanly. Tables created.
- Files: `packages/persistence/src/schema/audit-events.schema.ts`, `packages/persistence/src/schema/audit-alerts.schema.ts`
- Depends on: 1A.4 (AuditEvent entity defines shape)
- Est. lines: ~40

---

#### 1A.13 — TRIANGULATE: migration integrity test

- [ ] Create `apps/api/src/features/agent-audit-trail/__tests__/migration.test.ts`: <!-- sdd-owner: implementation -->
  - Test: factory produces identical `AgentDecisionLog` before/after migration with snapshot
  - Test: `computeHashFromData` produces identical hash to old `hash.service.ts` for equivalent input
  - Test: `verifyChain` runs successfully on existing audit events in test DB
- Files: `apps/api/src/features/agent-audit-trail/__tests__/migration.test.ts`
- Depends on: 1A.7 (migration complete)
- Est. lines: ~60

---

### Phase 1B — Compliance Domain Model & Documentation

**Estimated lines:** ~150–200 | **Files:** ~14

---

#### 1B.1 — RED: write ComplianceRule VO tests

- [ ] Create `packages/domain/src/compliance/__tests__/compliance-rule.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should create a valid ComplianceRule with code, description, obligationType, severity`
  - Test: `should reject obligationType outside known enum`
- Files: `packages/domain/src/compliance/__tests__/compliance-rule.test.ts`
- Depends on: nothing (new bounded context)
- Est. lines: ~40

---

#### 1B.2 — GREEN: implement ComplianceRule VO

- [ ] Create `packages/domain/src/compliance/compliance-rule.ts` with `ComplianceRule` value object: `{ id, code, description, obligationType: 'IGV'|'SIRE'|'BANCARIZACION'|'REPRESENTACION', severity: 'low'|'medium'|'high'|'critical' }`. <!-- sdd-owner: implementation -->
- Files: `packages/domain/src/compliance/compliance-rule.ts`
- Depends on: 1B.1
- Est. lines: ~30

---

#### 1B.3 — RED: write ComplianceCheck and ComplianceFinding entity tests

- [ ] Create `packages/domain/src/compliance/__tests__/compliance-check.test.ts` and `compliance-finding.test.ts`. <!-- sdd-owner: implementation -->
  - Test: ComplianceCheck links to ComplianceRule, has companyId, executedAt, status
  - Test: ComplianceFinding links to ComplianceCheck, has severity, message, optional resolvedAt
- Files: `packages/domain/src/compliance/__tests__/compliance-check.test.ts`, `packages/domain/src/compliance/__tests__/compliance-finding.test.ts`
- Depends on: 1B.2
- Est. lines: ~50

---

#### 1B.4 — GREEN: implement ComplianceCheck, ComplianceFinding, ComplianceStatus

- [ ] Create `packages/domain/src/compliance/compliance-check.ts` — entity with `{ id, ruleId, companyId, executedAt, status }`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/compliance/compliance-finding.ts` — entity with `{ id, checkId, severity, message, resolvedAt? }`.
- [ ] Create `packages/domain/src/compliance/compliance-status.ts` — VO with `{ compliant: boolean, lastCheck, findings, severity }`.
- [ ] Create `packages/domain/src/compliance/index.ts` barrel exports.
- Files: `packages/domain/src/compliance/compliance-check.ts`, `packages/domain/src/compliance/compliance-finding.ts`, `packages/domain/src/compliance/compliance-status.ts`, `packages/domain/src/compliance/index.ts`
- Depends on: 1B.3
- Est. lines: ~60

---

#### 1B.5 — GREEN: compliance application use cases

- [ ] Create `packages/application/src/compliance/record-check.command.ts` — command use case for recording a compliance check. <!-- sdd-owner: implementation -->
- [ ] Create `packages/application/src/compliance/get-dashboard.query.ts` — query use case aggregating compliance status per obligation type and company.
- [ ] Create `packages/application/src/compliance/list-checks.query.ts` — query use case listing compliance checks with optional filters.
- Acceptance: each use case follows existing CQRS application patterns. Dashboard returns `{ obligations: { [type]: ComplianceStatus } }`.
- Files: `packages/application/src/compliance/record-check.command.ts`, `packages/application/src/compliance/get-dashboard.query.ts`, `packages/application/src/compliance/list-checks.query.ts`
- Depends on: 1B.4
- Est. lines: ~80

---

#### 1B.6 — GREEN: standardize API compliance routes under /api/compliance

- [ ] Create `apps/api/src/features/compliance/commands/record-check.ts` — `POST /api/compliance/checks` command route. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/compliance/queries/list-checks.ts` — `GET /api/compliance/checks` query route.
- [ ] Create `apps/api/src/features/compliance/queries/dashboard.ts` — `GET /api/compliance/dashboard` query route.
- [ ] Update `apps/api/src/features/compliance/index.ts` to register routes under `/api/compliance` prefix with CQRS separation.
- Acceptance: standard ElysiaJS vertical-slice routes. Command routes are POST, query routes are GET. No mixed responsibilities.
- Files: 4 files as listed above
- Depends on: 1B.5
- Est. lines: ~60

---

#### 1B.7 — GREEN: PSE compliance integration tests

- [ ] Create `apps/api/src/features/compliance/pse/__tests__/integration.test.ts`: <!-- sdd-owner: implementation -->
  - Test: `should execute PLE, PDT, and SIRE checks concurrently`
  - Test: `should aggregate results from all sub-agents`
  - Test: `should handle partial failures gracefully (one sub-agent fails, others succeed)`
- Files: `apps/api/src/features/compliance/pse/__tests__/integration.test.ts`
- Depends on: 1B.4 (compliance entities exist for result modeling)
- Est. lines: ~60

---

#### 1B.8 — DOCUMENT: WEB compliance catalog

- [ ] Create `apps/web/src/features/compliance/CATALOG.md` with a file-by-file inventory table following the design doc categories: <!-- sdd-owner: implementation -->
  - XState Machines (6), Hooks (12), Page Components (8), Shared Components (18), API Clients (5), Types/Constants (10), Routes (4), Dashboard Widgets (8), Country Pack UI (5), Accounting Jobs UI (3)
  - Each entry: filename, purpose, dependencies, test status, risk level
  - Summary stats: total files, tested files count, coverage %
- Acceptance: CATALOG.md exists with complete inventory. No files are refactored. No code changes.
- Files: `apps/web/src/features/compliance/CATALOG.md`
- Depends on: nothing (documentation-only, parallel to code work)
- Est. lines: ~100

---

### Phase 1C — Deprecated Agent Cleanup

**Estimated lines:** ~50–70 | **Files:** ~4

---

#### 1C.1 — VERIFY: confirm no imports of deprecated agents

- [ ] Search codebase (grep) for imports of `compliance/agent` or `pre-audit/job`. Verify zero results. <!-- sdd-owner: implementation -->
- Acceptance: no file imports from deprecated paths. Report findings if any imports found (blocking — fix before proceeding).
- Depends on: nothing
- Est. lines: ~0 (verification only)

---

#### 1C.2 — DELETE: remove deprecated agent copies

- [ ] Delete `packages/infrastructure/src/agents/compliance/agent.ts`. <!-- sdd-owner: implementation -->
- [ ] Delete `packages/infrastructure/src/agents/pre-audit/job.ts`.
- [ ] Remove empty `compliance/` and `pre-audit/` directories if empty after deletion.
- Acceptance: files removed. Build passes. No import errors.
- Depends on: 1C.1 (zero imports confirmed)
- Est. lines: ~0 (deletions only)

---

#### 1C.3 — GREEN: add audit logging to canonical compliance-agent

- [ ] Modify `packages/infrastructure/src/agents/compliance-agent.ts`: after compliance determination, record decision in shared audit trail via `computeAuditHash` with scope `agent/compliance/{runId}`, including `model`, `inputSummary`, and `output`. <!-- sdd-owner: implementation -->
- Acceptance: every compliance agent run produces an audit event in `audit_events` table.
- Files: `packages/infrastructure/src/agents/compliance-agent.ts` (modify)
- Depends on: 1A.6 (shared domain exports available), 1C.2
- Est. lines: ~25

---

#### 1C.4 — GREEN: add audit logging + policy hook to canonical pre-audit-job

- [ ] Modify `packages/infrastructure/src/agents/pre-audit-job.ts`: add audit logging (same pattern as 1C.3) with scope `agent/pre-audit/{runId}`. <!-- sdd-owner: implementation -->
- [ ] Add stub `evaluateAgentPolicy` hook — in Phase 1 returns `{ action: 'allow' }`. Import path: `@drenyra/application/risk` (to be created in Phase 2C). If module doesn't exist yet, use an inline stub with a `// TODO: Phase 2C` comment.
- Acceptance: audit events recorded per pre-audit run. Policy hook wired but non-blocking (always allow).
- Files: `packages/infrastructure/src/agents/pre-audit-job.ts` (modify)
- Depends on: 1A.6, 1C.2
- Est. lines: ~35

---

### Phase 1 — Cross-Cutting Verification

---

#### P1-VERIFY — run full test suite and typecheck

- [ ] Run `bun run typecheck && bun run test` from project root. All existing tests must pass. No new type errors. <!-- sdd-owner: implementation -->
- [ ] Verify: `GET /audit/verify-chain/company/1234` returns `{ valid: true }` on test data.
- [ ] Verify: governance audit events appear in chain verification for a governance artifact.
- [ ] Verify: `GET /audit/export/sunat?period=2026-07&companyId=1234` returns valid XML.
- Depends on: all Phase 1A, 1B, 1C tasks complete
- Est. lines: ~0

---

#### P1-REVIEW — bounded review gate

- [ ] Start or reuse bounded review. <!-- sdd-owner: parent -->
- [ ] Run `gentle-ai review validate --gate pre-commit --cwd <repo> --lineage <lineage>` before commit.
- Depends on: P1-VERIFY (tests green)

---

## Phase 2 PR 2.1: Internal Controls Framework

**Estimated lines:** 250–350 | **Files:** ~12 | **PR chain position:** 2 of 5

---

#### 2A.1 — RED: write SegregationRule domain tests

- [ ] Create `packages/domain/src/risk/__tests__/segregation-rule.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should create rule with code, action, conflictingRoles, mode`
  - Test: `should accept advisory mode (non-blocking)`
  - Test: `should accept blocking mode`
  - Test: `should reject empty conflictingRoles array`
- Files: `packages/domain/src/risk/__tests__/segregation-rule.test.ts`
- Depends on: Phase 1 complete
- Est. lines: ~50

---

#### 2A.2 — GREEN: implement SegregationRule, ControlPoint, FourEyesApproval domain entities

- [ ] Create `packages/domain/src/risk/segregation-rule.ts` — VO: `{ id, code, action, conflictingRoles, mode }`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/risk/control-point.ts` — entity: `{ id, entityType, entityId, controlType, executedAt, result }`.
- [ ] Create `packages/domain/src/risk/four-eyes-approval.ts` — entity: `{ id, entityType, entityId, requestedBy, approvedBy?, status, requestedAt, resolvedAt? }`.
- [ ] Create `packages/domain/src/risk/index.ts` barrel.
- Files: 4 files as listed above
- Depends on: 2A.1
- Est. lines: ~70

---

#### 2A.3 — GREEN: application use cases for internal controls

- [ ] Create `packages/application/src/risk/check-segregation.query.ts` — query: given userId, action, and companyId, check segregation rules, return `{ allowed, reason?, ruleId? }`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/application/src/risk/request-approval.command.ts` — command: create four-eyes approval request for entity.
- Acceptance: segregation check correctly identifies role conflicts from the matrix in the design doc.
- Files: `packages/application/src/risk/check-segregation.query.ts`, `packages/application/src/risk/request-approval.command.ts`
- Depends on: 2A.2
- Est. lines: ~80

---

#### 2A.4 — GREEN: API routes for internal controls

- [ ] Create `apps/api/src/features/risk/commands/check-segregation.ts` — `POST /controls/check-segregation`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/risk/commands/request-approval.ts` — `POST /controls/request-approval`.
- [ ] Create `apps/api/src/features/risk/queries/control-status.ts` — `GET /controls/status/:entityType/:entityId`.
- [ ] Create `apps/api/src/features/risk/index.ts` feature slice entry.
- [ ] Create `apps/api/src/features/risk/schemas.ts` Zod schemas.
- Acceptance: all routes functional. CQRS separation maintained.
- Files: 5 files as listed above
- Depends on: 2A.3
- Est. lines: ~80

---

#### 2A.5 — GREEN: database schema for controls tables

- [ ] Create `packages/persistence/src/schema/segregation-rules.schema.ts`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/persistence/src/schema/control-points.schema.ts`.
- [ ] Create `packages/persistence/src/schema/approval-requests.schema.ts`.
- Acceptance: migrations run cleanly.
- Files: 3 schema files
- Depends on: 2A.2
- Est. lines: ~50

---

#### 2A.6 — TRIANGULATE: internal controls integration test

- [ ] Create `apps/api/src/features/risk/__tests__/controls-integration.test.ts`: <!-- sdd-owner: implementation -->
  - Test: `should allow fiscal-analyst to create invoice (no conflict)`
  - Test: `should block fiscal-analyst from self-approving invoice`
  - Test: `should allow advisory mode — operation proceeds with warning`
  - Test: `should block in blocking mode for tenant with blocking enabled`
- Files: `apps/api/src/features/risk/__tests__/controls-integration.test.ts`
- Depends on: 2A.4
- Est. lines: ~70

---

## Phase 2 PR 2.2: Fiscal Risk Matrix

**Estimated lines:** 350–450 | **Files:** ~14 | **PR chain position:** 3 of 5

---

#### 2B.1 — RED: write RiskCategory and RiskAssessment domain tests

- [ ] Create `packages/domain/src/risk/__tests__/risk-category.test.ts` and `risk-assessment.test.ts`. <!-- sdd-owner: implementation -->
  - Test: RiskCategory with name, weight (0–1), dataSources
  - Test: weights sum validation across categories
  - Test: RiskAssessment with dimensionScores, compositeScore calculation
  - Test: risk levels map correctly (low 0–20, medium 21–50, high 51–75, critical 76–100)
- Files: `packages/domain/src/risk/__tests__/risk-category.test.ts`, `packages/domain/src/risk/__tests__/risk-assessment.test.ts`
- Depends on: Phase 2A complete ("PR 2.1 merged")
- Est. lines: ~70

---

#### 2B.2 — GREEN: implement RiskCategory, RiskAssessment, RiskScore domain entities

- [ ] Create `packages/domain/src/risk/risk-category.ts` — VO: `{ id, name, weight, dataSources }`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/risk/risk-assessment.ts` — entity: `{ id, companyId, period, dimensionScores: DimensionScore[], compositeScore, level, calculatedAt }` with `computeCompositeScore()` method.
- [ ] Create `packages/domain/src/risk/risk-score.ts` — `DimensionScore` and `RiskLevel` types.
- [ ] Update `packages/domain/src/risk/index.ts`.
- Acceptance: composite score = Σ(dimension.score × dimension.weight). Levels per design spec.
- Files: 4 files
- Depends on: 2B.1
- Est. lines: ~70

---

#### 2B.3 — GREEN: application use cases for risk matrix

- [ ] Create `packages/application/src/risk/assess-risk.command.ts` — computes risk assessment from data sources (SIRE diff, PSE, compliance findings) for a company × period. <!-- sdd-owner: implementation -->
- [ ] Create `packages/application/src/risk/get-heatmap.query.ts` — returns `{ companies: [{ companyId, companyName, compositeScore, level, dimensions }] }` for a portfolio.
- Files: `packages/application/src/risk/assess-risk.command.ts`, `packages/application/src/risk/get-heatmap.query.ts`
- Depends on: 2B.2
- Est. lines: ~100

---

#### 2B.4 — GREEN: API routes for risk matrix

- [ ] Create `apps/api/src/features/risk/commands/assess-risk.ts` — `POST /risk/assess`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/risk/queries/heatmap.ts` — `GET /risk/heatmap`.
- [ ] Create `apps/api/src/features/risk/queries/matrix.ts` — `GET /risk/matrix/:companyId`.
- [ ] Update `apps/api/src/features/risk/schemas.ts` with risk-specific Zod schemas.
- Acceptance: `POST /risk/assess { companyId, period }` returns assessment. `GET /risk/heatmap?portfolioId=abc` returns heatmap data.
- Files: 4 files
- Depends on: 2B.3
- Est. lines: ~70

---

#### 2B.5 — GREEN: database schema for risk tables

- [ ] Create `packages/persistence/src/schema/risk-assessments.schema.ts`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/persistence/src/schema/risk-categories.schema.ts`.
- Files: 2 schema files
- Depends on: 2B.2
- Est. lines: ~40

---

#### 2B.6 — TRIANGULATE: risk matrix integration test

- [ ] Create `apps/api/src/features/risk/__tests__/risk-matrix.test.ts`: <!-- sdd-owner: implementation -->
  - Test: `should calculate composite risk score from weighted dimensions`
  - Test: `should return correct risk level for boundary scores (0, 20, 21, 50, 51, 75, 76, 100)`
  - Test: `heatmap returns all companies in portfolio with dimension breakdown`
- Files: `apps/api/src/features/risk/__tests__/risk-matrix.test.ts`
- Depends on: 2B.4
- Est. lines: ~60

---

#### 2B.7 — GREEN: automatic recalculation triggers (event listeners)

- [ ] Create event listener(s) that recalculate risk when SIRE diff completes, PSE validation runs, or a compliance finding is recorded. <!-- sdd-owner: implementation -->
- [ ] Use existing Drenyra event bus / listener pattern.
- [ ] Ensure recalculation completes within 60 seconds of trigger.
- Acceptance: updating SIRE diff data → risk assessment recalculates for affected company within 60s.
- Files: event listener(s) in `packages/application/src/risk/` or appropriate infrastructure path
- Depends on: 2B.3
- Est. lines: ~50

---

## Phase 2 PR 2.3: Policy Enforcement Engine

**Estimated lines:** 200–370 | **Files:** ~12 | **PR chain position:** 4 of 5

---

#### 2C.1 — RED: write Policy and PolicyRule domain tests

- [ ] Create `packages/domain/src/risk/__tests__/policy.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should create a Policy with name, description, context, priority, enabled, rules`
  - Test: `should create a PolicyRule with field, operator, value, action, message`
  - Test: `should support all 10 operators: eq, neq, gt, gte, lt, lte, in, nin, between, exists, regex`
  - Test: `should evaluate simple condition: { field: "igvCreditPct", operator: "gt", value: 18 }` → true when 25, false when 10
  - Test: `should evaluate composite AND: all conditions must be true`
  - Test: `should evaluate composite OR: any condition true is sufficient`
  - Test: `should return highest severity action: block > warn > allow`
  - Test: `should interpolate message template: "IGV credit ({{igvCreditPct}}%) exceeds threshold"`
- Files: `packages/domain/src/risk/__tests__/policy.test.ts`
- Depends on: Phase 2B complete ("PR 2.2 merged")
- Est. lines: ~120

---

#### 2C.2 — GREEN: implement Policy, PolicyRule, PolicyEvaluation, evaluateCondition

- [ ] Create `packages/domain/src/risk/policy.ts` — `Policy` entity with rules array. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/risk/policy-rule.ts` — `PolicyRule` with condition (json), action, message.
- [ ] Create `packages/domain/src/risk/policy-evaluation.ts` — `PolicyEvaluation` entity: `{ id, policyId, context, inputData, result, matchedRules, evaluatedAt }`.
- [ ] Create `packages/domain/src/risk/evaluate-condition.ts` — pure function `evaluateCondition(condition, data): boolean` supporting all 10 operators + composite AND/OR.
- [ ] Create `packages/domain/src/risk/evaluate-policy.ts` — `evaluatePolicy(policy, data): PolicyEvaluationResult` — walk rules, collect matches, return highest severity action.
- [ ] Update `packages/domain/src/risk/index.ts`.
- Acceptance: all 2C.1 tests pass. Policy evaluation is deterministic.
- Files: 6 files
- Depends on: 2C.1
- Est. lines: ~150

---

#### 2C.3 — GREEN: application use cases for policy engine

- [ ] Create `packages/application/src/risk/evaluate-policy.query.ts` — evaluates all enabled policies in a context against input data. Returns aggregated result. <!-- sdd-owner: implementation -->
- [ ] Create `packages/application/src/risk/register-policy.command.ts` — registers a new policy with audit trail event.
- [ ] Create `packages/application/src/risk/list-policies.query.ts` — lists active policies.
- Files: `packages/application/src/risk/evaluate-policy.query.ts`, `packages/application/src/risk/register-policy.command.ts`, `packages/application/src/risk/list-policies.query.ts`
- Depends on: 2C.2
- Est. lines: ~70

---

#### 2C.4 — GREEN: API routes for policy engine

- [ ] Create `apps/api/src/features/risk/commands/evaluate-policy.ts` — `POST /policies/evaluate`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/risk/commands/register-policy.ts` — `POST /policies`.
- [ ] Create `apps/api/src/features/risk/queries/list-policies.ts` — `GET /policies`.
- [ ] Update schemas for policy-related Zod validation.
- Acceptance: `POST /policies/evaluate` returns correct action. Policy CRUD writes audit events.
- Files: 4 files
- Depends on: 2C.3
- Est. lines: ~70

---

#### 2C.5 — GREEN: database schema for policy tables

- [ ] Create `packages/persistence/src/schema/policies.schema.ts`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/persistence/src/schema/policy-rules.schema.ts`.
- [ ] Create `packages/persistence/src/schema/policy-evaluations.schema.ts`.
- Files: 3 schema files
- Depends on: 2C.2
- Est. lines: ~50

---

#### 2C.6 — TRIANGULATE: policy engine integration test

- [ ] Create `apps/api/src/features/risk/__tests__/policy-engine.test.ts`: <!-- sdd-owner: implementation -->
  - Test: `should allow when IGV credit is below threshold (5% < 18%)`
  - Test: `should warn when IGV credit exceeds threshold (25% > 18%)`
  - Test: `should block when IGV credit exceeds critical threshold (35% > 30%)`
  - Test: `should immediately activate new policy after POST /policies`
  - Test: `should record audit event on policy create/update/delete`
  - Test: `should support composite OR condition`
  - Test: `should support between operator for range checks`
- Files: `apps/api/src/features/risk/__tests__/policy-engine.test.ts`
- Depends on: 2C.4
- Est. lines: ~90

---

#### 2C.7 — REFACTOR: seed 5 initial policies for Phase 2C

- [ ] Create migration or seed file with 5 initial policies: <!-- sdd-owner: implementation -->
  1. IGV credit < 18% (warn)
  2. IGV credit > 30% (block)
  3. SIRE discrepancies > 10% (require-approval)
  4. Monthly revenue > 500k + IGV credit > 15% (composite AND, warn)
  5. Representation expenses > 40% of revenue (warn)
- Acceptance: after seed, `GET /policies` returns 5 policies.
- Files: seed migration or `packages/persistence/src/seeds/policies.seed.ts`
- Depends on: 2C.5
- Est. lines: ~40

---

## Phase 3 PR: Operational Surface

**Estimated lines:** 600–900 | **Files:** ~35 | **PR chain position:** 5 of 5

---

### Phase 3A — Audit Report Generation

**Estimated lines:** ~200–300 | **Files:** ~10

---

#### 3A.1 — RED: write AuditReport domain tests

- [ ] Create `packages/domain/src/risk/__tests__/audit-report.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should create AuditReport with template, companyId, format, status`
  - Test: `should validate template enum: fiscal-period | per-agent | per-client | compliance`
  - Test: `should include hashChainEvidence in report entity`
- Files: `packages/domain/src/risk/__tests__/audit-report.test.ts`
- Depends on: Phase 2C complete ("PR 2.3 merged")
- Est. lines: ~40

---

#### 3A.2 — GREEN: implement AuditReport domain entity

- [ ] Create `packages/domain/src/risk/audit-report.ts` — entity: `{ id, template, companyId, period?, format, status, fileUrl?, hashChainEvidence, createdAt, scheduledAt? }`. <!-- sdd-owner: implementation -->
- [ ] Update barrel exports.
- Files: `packages/domain/src/risk/audit-report.ts`, update `packages/domain/src/risk/index.ts`
- Depends on: 3A.1
- Est. lines: ~30

---

#### 3A.3 — GREEN: application use case for report generation

- [ ] Create `packages/application/src/audit/generate-report.command.ts` — collects audit events, verifies chain, renders PDF, stores report. <!-- sdd-owner: implementation -->
- Files: `packages/application/src/audit/generate-report.command.ts`
- Depends on: 3A.2
- Est. lines: ~80

---

#### 3A.4 — GREEN: PDF generation pipeline (fiscal-period template)

- [ ] Create PDF template rendering for the `fiscal-period` template using the Drenyra PDF generation tooling (or `pdfkit`/`puppeteer` if no existing generator). Sections per design: header, chain verification evidence, event summary table, detailed events, compliance status, risk assessment, footer. <!-- sdd-owner: implementation -->
- Files: `packages/infrastructure/src/reporting/pdf-generator.ts` (or similar)
- Depends on: 3A.3
- Est. lines: ~100

---

#### 3A.5 — GREEN: API routes for audit reports

- [ ] Create route: `POST /audit/reports/generate` — trigger report generation, return `{ reportId, status: 'pending' }`. <!-- sdd-owner: implementation -->
- [ ] Create route: `GET /audit/reports/:id` — return report with status and download URL.
- [ ] Add routes to existing or new feature slice.
- Acceptance: `POST` triggers async generation. `GET` returns status `completed` with download URL once ready.
- Files: API routes in `apps/api/src/features/risk/` or `apps/api/src/features/audit/`
- Depends on: 3A.4
- Est. lines: ~50

---

#### 3A.6 — GREEN: database schema for audit_reports

- [ ] Create `packages/persistence/src/schema/audit-reports.schema.ts`. <!-- sdd-owner: implementation -->
- Files: 1 schema file
- Depends on: 3A.2
- Est. lines: ~25

---

### Phase 3B — Compliance Runbooks

**Estimated lines:** ~200–300 | **Files:** ~10

---

#### 3B.1 — RED: write Runbook, RunbookStep, EvidenceItem domain tests

- [ ] Create `packages/domain/src/risk/__tests__/runbook.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should create Runbook with name, description, obligationType, ordered steps`
  - Test: `should enforce step order uniqueness`
  - Test: `should create EvidenceItem linked to step with type, fileUrl?, notes`
  - Test: `should transition step status: pending → in_progress → completed`
- Files: `packages/domain/src/risk/__tests__/runbook.test.ts`
- Depends on: 3A complete
- Est. lines: ~60

---

#### 3B.2 — GREEN: implement Runbook, RunbookStep, EvidenceItem domain entities

- [ ] Create `packages/domain/src/risk/runbook.ts` — entity with steps array. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/risk/runbook-step.ts` — entity with `{ id, runbookId, order, title, description, status }`.
- [ ] Create `packages/domain/src/risk/evidence-item.ts` — entity with `{ id, stepId, type, fileUrl?, notes, collectedAt, collectedBy }`.
- [ ] Update barrel.
- Files: 4 files
- Depends on: 3B.1
- Est. lines: ~70

---

#### 3B.3 — GREEN: application use case for runbook execution

- [ ] Create `packages/application/src/compliance/execute-runbook.command.ts` — returns next incomplete step, records completion in audit trail. <!-- sdd-owner: implementation -->
- Files: `packages/application/src/compliance/execute-runbook.command.ts`
- Depends on: 3B.2
- Est. lines: ~60

---

#### 3B.4 — GREEN: API routes for runbooks

- [ ] Create route: `GET /runbooks` — list all available runbooks. <!-- sdd-owner: implementation -->
- [ ] Create route: `POST /runbooks/:id/execute` — step through runbook, return current step.
- [ ] Create route: `POST /runbooks/:id/evidence` — attach evidence to a step.
- Acceptance: pre-built runbooks appear in list. Step-by-step execution works. Evidence is attachable.
- Files: API routes in `apps/api/src/features/risk/`
- Depends on: 3B.3
- Est. lines: ~60

---

#### 3B.5 — GREEN: database schema for runbook tables

- [ ] Create `packages/persistence/src/schema/runbooks.schema.ts`, `runbook-steps.schema.ts`, `evidence-items.schema.ts`. <!-- sdd-owner: implementation -->
- Files: 3 schema files
- Depends on: 3B.2
- Est. lines: ~45

---

#### 3B.6 — GREEN: seed 4 pre-built runbooks

- [ ] Create seed for 4 pre-built runbooks with documented steps: `igv-declaration`, `sire-submission`, `bancarizacion-compliance`, `representation-expenses`. <!-- sdd-owner: implementation -->
- Acceptance: `GET /runbooks` returns 4 runbooks with documented steps and descriptions.
- Files: `packages/persistence/src/seeds/runbooks.seed.ts`
- Depends on: 3B.5
- Est. lines: ~60

---

### Phase 3C — Incident Response

**Estimated lines:** ~200–300 | **Files:** ~10

---

#### 3C.1 — RED: write Incident and PostMortem domain tests

- [ ] Create `packages/domain/src/risk/__tests__/incident.test.ts`. <!-- sdd-owner: implementation -->
  - Test: `should create Incident with title, severity, status, source`
  - Test: `should validate severity enum: low | medium | high | critical`
  - Test: `should validate source enum: chain_failure | anomaly_detection | policy_violation | manual`
  - Test: `should transition status following lifecycle: open → investigating → resolved → closed`
  - Test: `should allow reopen from resolved → investigating`
  - Test: `should create PostMortem linked to incident with timeline, rootCause, impactAssessment, preventiveMeasures`
- Files: `packages/domain/src/risk/__tests__/incident.test.ts`
- Depends on: 3B complete
- Est. lines: ~70

---

#### 3C.2 — GREEN: implement Incident and PostMortem domain entities

- [ ] Create `packages/domain/src/risk/incident.ts` — entity with status transitions. <!-- sdd-owner: implementation -->
- [ ] Create `packages/domain/src/risk/post-mortem.ts` — entity: `{ id, incidentId, timeline, rootCause, impactAssessment, preventiveMeasures, generatedAt }`.
- [ ] Update barrel.
- Files: 3 files
- Depends on: 3C.1
- Est. lines: ~60

---

#### 3C.3 — GREEN: automatic incident declaration from chain failure

- [ ] Wire chain verification failure → auto-declare incident: when `verifyChain` returns `valid: false`, create Incident with severity `critical`, source `chain_failure`, referencing the broken scope. <!-- sdd-owner: implementation -->
- [ ] Wire anomaly detection threshold > 0.9 → auto-declare incident with severity `high`, source `anomaly_detection`.
- Acceptance: broken chain immediately creates an open incident. `GET /incidents` includes auto-declared incidents.
- Files: modify verify-chain query, add incident declaration in infrastructure
- Depends on: 3C.2, 1A.8 (verify-chain endpoint)
- Est. lines: ~40

---

#### 3C.4 — GREEN: application use cases for incident management

- [ ] Create `packages/application/src/risk/declare-incident.command.ts` — supports both auto and manual declaration. <!-- sdd-owner: implementation -->
- [ ] Create `packages/application/src/risk/list-incidents.query.ts`.
- [ ] Create `packages/application/src/risk/update-incident.command.ts` — status transitions + assignment.
- Files: `packages/application/src/risk/declare-incident.command.ts`, `packages/application/src/risk/list-incidents.query.ts`, `packages/application/src/risk/update-incident.command.ts`
- Depends on: 3C.2
- Est. lines: ~80

---

#### 3C.5 — GREEN: API routes for incident response

- [ ] Create route: `POST /incidents` — manual incident declaration. <!-- sdd-owner: implementation -->
- [ ] Create route: `GET /incidents` — list incidents with optional filter by status/severity.
- [ ] Create route: `PATCH /incidents/:id` — update status, assignee, resolution.
- Acceptance: full lifecycle functional: declare → assign → investigate → resolve → close → post-mortem generated.
- Files: API routes in `apps/api/src/features/risk/`
- Depends on: 3C.4
- Est. lines: ~60

---

#### 3C.6 — GREEN: database schema for incident tables

- [ ] Create `packages/persistence/src/schema/incidents.schema.ts`, `post-mortems.schema.ts`. <!-- sdd-owner: implementation -->
- Files: 2 schema files
- Depends on: 3C.2
- Est. lines: ~35

---

#### 3C.7 — GREEN: PostMortem auto-generation on incident close

- [ ] When incident transitions to `closed`, auto-generate PostMortem with timeline, root cause placeholder, impact assessment placeholder, and preventive measures placeholder. <!-- sdd-owner: implementation -->
- [ ] Record both incident and post-mortem in audit trail.
- Acceptance: closing an incident creates a post-mortem. Post-mortem is linked to incident.
- Files: modify `update-incident.command.ts`
- Depends on: 3C.5
- Est. lines: ~30

---

### Phase 3 — Cross-Cutting Verification

---

#### P3-VERIFY — run full test suite and typecheck

- [ ] Run `bun run typecheck && bun run test` from project root. All existing + new tests must pass. <!-- sdd-owner: implementation -->
- [ ] Verify: audit report PDF generated with hash-chain evidence.
- [ ] Verify: runbook `igv-declaration` executable through all 4 steps.
- [ ] Verify: incident lifecycle (open → closed → post-mortem) functional.
- [ ] Verify: auto-declared incident from chain failure.
- Depends on: all Phase 3 tasks complete
- Est. lines: ~0

---

#### P3-REVIEW — bounded review gate

- [ ] Start or reuse bounded review. <!-- sdd-owner: parent -->
- [ ] Run `gentle-ai review validate --gate pre-commit --cwd <repo> --lineage <lineage>` before commit.
- Depends on: P3-VERIFY (tests green)

---

## Task Summary

| Phase              | PR         | Tasks  | Est. lines    | Files    | Risk       |
| ------------------ | ---------- | ------ | ------------- | -------- | ---------- |
| 1A (Hash Chain)    | PR 1       | 13     | ~720          | ~22      | LOW        |
| 1B (Compliance)    | PR 1       | 8      | ~440          | ~14      | LOW        |
| 1C (Agent Cleanup) | PR 1       | 4      | ~60           | ~4       | LOW        |
| **Phase 1 total**  | **PR 1**   | **25** | **400–600**   | **~35**  | **LOW**    |
| 2A (Controls)      | PR 2       | 6      | ~400          | ~12      | MEDIUM     |
| 2B (Risk Matrix)   | PR 3       | 7      | ~460          | ~14      | MEDIUM     |
| 2C (Policy Engine) | PR 4       | 7      | ~590          | ~12      | MEDIUM     |
| **Phase 2 total**  | **PR 2–4** | **20** | **800–1200**  | **~38**  | **MEDIUM** |
| 3A (Reports)       | PR 5       | 6      | ~325          | ~10      | LOW        |
| 3B (Runbooks)      | PR 5       | 6      | ~355          | ~10      | LOW        |
| 3C (Incidents)     | PR 5       | 7      | ~375          | ~10      | LOW        |
| **Phase 3 total**  | **PR 5**   | **19** | **600–900**   | **~30**  | **LOW**    |
| **Grand total**    | **5 PRs**  | **64** | **1800–2700** | **~103** |            |

---

## Dependency Summary

```
PR 1 (Phase 1: Consolidation)
  │
  └──► PR 2 (Phase 2A: Internal Controls)
         │
         └──► PR 3 (Phase 2B: Risk Matrix)
                │
                └──► PR 4 (Phase 2C: Policy Engine)
                       │
                       └──► PR 5 (Phase 3: Operational Surface)
```

All PRs merge to `main` in order (stacked-to-main). Each PR is independently reviewable with passing tests.
