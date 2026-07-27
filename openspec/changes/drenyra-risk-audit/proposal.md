# SDD Proposal: Risk, Audit & Internal Controls

**Change:** `drenyra-risk-audit`
**Created:** 2026-07-25
**Status:** Proposal
**Domain:** Risk, Audit & Internal Controls (CAP-RISK-01 through CAP-RISK-13)
**Scope:** New capability area — consolidates and extends 5 partial + 7 unimplemented capabilities

---

## Executive Summary

Drenyra handles Peruvian fiscal data where auditability is a **regulatory requirement**, not a nice-to-have. Today we have ~150 files of audit/compliance code built ad-hoc across 6 modules — none of it formalized under SDD, much of it untested, and seven critical capabilities (risk matrix, internal controls, policy engine, audit reports, compliance runbooks, incident response) simply don't exist.

This proposal formalizes the entire Risk, Audit & Internal Controls domain. Phase 1 consolidates and hardens what exists (audit trail + compliance). Phase 2 builds the missing structural capabilities (internal controls, risk matrix, policy engine). Phase 3 delivers the operational surface (reports, runbooks, incident response).

**Target:** "Every fiscal decision is traceable by hash-chain, every compliance rule is enforceable by policy engine, and every risk is visible in a matrix an auditor or CFO can act on."

---

## Problem

### 1. Audit trail is functional but fragile

- `agent-audit-trail` (30 files, 8 tests) has a well-designed domain layer (HashChain VO, deterministic JSON normalization, SHA-256 hashing) and plugin architecture (BCP reconciliation plugin as proof of concept)
- But: no formal SDD, no chain-verification endpoint, no tamper-detection alerting, no bulk export for SUNAT, tests only cover schema hardening and one unit file
- `governance-audit` (7 files, 2 tests) logs artifact events but sits in a separate silo with no hash-chain linking
- The `api/audit` WEB module (8 files, 0 tests) is a thin read-only event viewer

### 2. Compliance monitoring is the largest surface but deepest tech debt

- WEB compliance: 79 files, only 8 tests (10% coverage). Includes XState machines for SIRE reconciliation, CPE validator UI, compliance dashboards, country-pack routes, accounting jobs — a massive surface with no architectural guardrails
- API compliance: 17 files, 9 tests. Mix of routes (country-pack, SIRE demo export, accounting jobs) under a "compliance" tag but no domain model, no policy engine, no rule definitions
- PSE compliance: 5 files, 3 tests. Well-tested proactive validation (PLE/PDT/SIRE consistency) with parallel sub-agent execution. The best-engineered compliance module, but isolated

### 3. Seven capabilities are entirely unimplemented

| Capability                              | Business impact of absence                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| CAP-RISK-06: Fiscal risk matrix         | No structured way to assess, rank, or monitor fiscal risks per client. Auditors and CFOs have no heatmap. |
| CAP-RISK-07: Internal controls          | No segregation of duties, no 4-eyes approval, no control framework for fiscal operations.                 |
| CAP-RISK-09: Policy enforcement engine  | Every compliance rule is hardcoded. Adding a new SUNAT rule requires a code change and deploy.            |
| CAP-RISK-10: Audit report generation    | No automated audit reports (PDF/structured). Auditors must manually query logs.                           |
| CAP-RISK-11: Compliance runbooks        | No evidence collection workflows, no documented procedures per fiscal obligation.                         |
| CAP-RISK-13: Security incident response | No formal incident response process, no playbooks, no post-mortem templates for fiscal incidents.         |

### 4. Domain fragmentation

The domain layer has a solid `audit-ledger` package (3 files, well-tested) with `HashChain`, `computeAuditHash`, `normalizeJson`. But the API `agent-audit-trail` created its own parallel domain (entity, factory, hash.service, value-objects) instead of using the shared domain package. This duplication weakens the hash-chain integrity guarantee.

### 5. Infrastructure agents exist but are ungoverned

- `compliance-agent.ts` — SUNAT compliance analysis using AI models (Claude Opus). Deprecated copies exist in `compliance/agent.ts`.
- `pre-audit-job.ts` — Pre-audit simulation and nightly batch. Deprecated copies exist in `pre-audit/job.ts`.
- Both lack: audit logging of their own decisions, policy-based gating, structured output schemas for downstream consumption.

---

## Solution

### Architecture principle

**One domain, one truth.** All audit, risk, and compliance modules share a single domain package (`packages/domain/src/audit-ledger/` expanded, or a new `packages/domain/src/risk/` bounded context). API features consume this domain; no parallel domain implementations.

### Phase 1 — Consolidation & Hardening (formalize what exists)

**1A: Formalize agent-audit-trail as SDD**

- Unify the two domain implementations (API's parallel domain → shared `audit-ledger` package)
- Add chain-verification endpoint: `GET /audit/verify-chain/:scope` that walks the hash chain and detects gaps/tampering
- Add tamper-detection alerting: when chain verification fails, emit structured alert
- Add bulk SUNAT export: `GET /audit/export/sunat?period=YYYY-MM` → UBL-like XML (existing `xml-exporter.ts` is a template, make it a real exporter with DB-backed data)
- Increase test coverage: domain is well-tested; add integration tests for chain verification, import/export, and plugin execution
- **Target:** L3 (executable) maturity — hash-chain auditable end-to-end

**1B: Formalize compliance monitoring as SDD**

- Extract compliance domain model: `ComplianceRule`, `ComplianceCheck`, `ComplianceFinding` as value objects/entities
- Document the 79-file WEB surface: categorize into pages, components, machines, hooks, API clients
- Standardize API compliance routes under a single `/api/compliance` prefix with proper CQRS (commands vs queries)
- Add compliance dashboard API: aggregate view of compliance status across obligations
- PSE compliance: keep as-is (good shape), but add integration test for the parallel sub-agent flow
- **Target:** L3 maturity — compliance surface documented, domain-modeled, and tested

### Phase 2 — Structural Capabilities (build the missing foundation)

**2A: Internal controls framework (CAP-RISK-07)**

- Domain: `SegregationRule`, `FourEyesApproval`, `ControlPoint` entities
- Application: `CheckSegregation`, `RequestApproval`, `RecordControlExecution` use cases
- API: `POST /controls/check-segregation`, `POST /controls/request-approval`, `GET /controls/status/:entity`
- WEB: control matrix dashboard, approval queue widget
- Integration: hook into fiscal operations (invoice creation, SIRE submission, close checklist) as control points
- **Key design constraint:** controls are non-blocking advisory by default; blocking mode is opt-in per tenant

**2B: Fiscal risk matrix (CAP-RISK-06)**

- Domain: `RiskCategory`, `RiskAssessment`, `RiskScore` with fiscal-specific dimensions (SUNAT exposure, IGV variance, SIRE discrepancies, bancarización gaps)
- Application: `AssessRisk`, `RecalculateRiskMatrix`, `GetRiskHeatmap`
- API: `GET /risk/matrix/:companyId`, `POST /risk/assess`, `GET /risk/heatmap`
- WEB: interactive heatmap with drill-down per category, trend charts
- **Data sources:** plug into existing SIRE diff, PSE validation, compliance findings

**2C: Policy enforcement engine (CAP-RISK-09)**

- Domain: `Policy`, `PolicyRule`, `PolicyEvaluation`, `PolicyAction` (allow/block/warn/require-approval)
- Application: `EvaluatePolicy`, `RegisterPolicy`, `GetApplicablePolicies`
- API: `POST /policies/evaluate`, `POST /policies`, `GET /policies`
- Policy definition format: structured JSON (not DSL) — conditions, thresholds, actions
- Integration points: CPE validation, SIRE submission, invoice creation, agent decisions
- **Design principle:** policies are data, not code. Adding a new SUNAT threshold should NOT require a deploy.

### Phase 3 — Operational Surface (reports, runbooks, incident response)

**3A: Audit report generation (CAP-RISK-10)**

- Application: `GenerateAuditReport` with templates (fiscal-period, per-agent, per-client)
- Export formats: PDF (priority), XLSX (secondary)
- API: `POST /audit/reports/generate`, `GET /audit/reports/:id`
- WEB: report builder UI, download links, scheduled generation

**3B: Compliance runbooks (CAP-RISK-11)**

- Domain: `Runbook`, `RunbookStep`, `EvidenceItem`
- Application: `ExecuteRunbook`, `CollectEvidence`, `CompleteRunbook`
- API: `GET /runbooks`, `POST /runbooks/:id/execute`, `POST /runbooks/:id/evidence`
- Pre-built runbooks for: IGV declaration, SIRE submission, bancarización compliance, representation expenses

**3C: Security incident response (CAP-RISK-13)**

- Domain: `Incident`, `IncidentSeverity`, `IncidentResponse`, `PostMortem`
- Application: `DeclareIncident`, `AssignResponse`, `CloseIncident`, `GeneratePostMortem`
- API: `POST /incidents`, `GET /incidents`, `PATCH /incidents/:id`
- Triggers: chain verification failure, anomaly detection alert, policy violation above threshold

---

## Affected Areas

| Layer          | Module                                     | Change type                                        |
| -------------- | ------------------------------------------ | -------------------------------------------------- |
| Domain         | `packages/domain/src/audit-ledger/`        | Expand: add verification, export, risk entities    |
| Domain         | `packages/domain/src/risk/`                | **New** bounded context                            |
| Application    | `packages/application/src/risk/`           | **New** use cases                                  |
| API            | `apps/api/src/features/agent-audit-trail/` | Refactor: use shared domain, add endpoints         |
| API            | `apps/api/src/features/compliance/`        | Refactor: extract domain, standardize              |
| API            | `apps/api/src/features/governance-audit/`  | Integrate: link to shared hash-chain               |
| API            | `apps/api/src/features/pse-compliance/`    | Minimal: add integration tests                     |
| API            | `apps/api/src/features/risk/`              | **New** feature slice                              |
| WEB            | `apps/web/src/features/compliance/`        | Document, refactor where needed                    |
| WEB            | `apps/web/src/features/audit/`             | Expand: chain viewer, report viewer                |
| WEB            | `apps/web/src/features/risk/`              | **New** feature slice                              |
| WEB            | `apps/web/src/features/control-tower/`     | Enhance: risk widgets, control status              |
| Infrastructure | `packages/infrastructure/src/agents/`      | Cleanup deprecated copies; add audit logging       |
| Persistence    | `packages/persistence/src/schema/`         | New tables for risk, controls, policies, incidents |

---

## Capability Coverage

| Capability                              | Phase          | Current state                          | Target state                  |
| --------------------------------------- | -------------- | -------------------------------------- | ----------------------------- |
| CAP-RISK-01: Immutable audit trail      | Phase 1A       | 🟡 partial (30 files, 2 domain copies) | ✅ L3 executable              |
| CAP-RISK-02: Governance audit log       | Phase 1A       | 🟡 partial (7 files)                   | ✅ L3, linked to hash-chain   |
| CAP-RISK-03: Compliance monitoring      | Phase 1B       | 🟡 partial (96 files combined)         | ✅ L3, domain-modeled         |
| CAP-RISK-04: PSE compliance             | Phase 1B       | 🟡 partial (5 files, well-tested)      | ✅ L3, integration-tested     |
| CAP-RISK-05: Control tower              | Phase 2A       | 🟡 partial (4 files + domain)          | ✅ L3, risk + control widgets |
| CAP-RISK-06: Fiscal risk matrix         | Phase 2B       | ◌ not implemented                      | ✅ L2 architecture → L3       |
| CAP-RISK-07: Internal controls          | Phase 2A       | ◌ not implemented                      | ✅ L2 architecture → L3       |
| CAP-RISK-08: Anomaly detection          | Phase 2B       | 🟡 partial (AI agents)                 | ✅ L3, policy-integrated      |
| CAP-RISK-09: Policy enforcement engine  | Phase 2C       | ◌ not implemented                      | ✅ L3, data-driven rules      |
| CAP-RISK-10: Audit report generation    | Phase 3A       | ◌ not implemented                      | ✅ L3                         |
| CAP-RISK-11: Compliance runbooks        | Phase 3B       | ◌ not implemented                      | ✅ L2 → L3                    |
| CAP-RISK-12: SUNAT compliance           | (existing SDD) | 🟡 partial (`drenyra-sunat`)           | Not in scope                  |
| CAP-RISK-13: Security incident response | Phase 3C       | ◌ not implemented                      | ✅ L2                         |

---

## Risks

| Risk                                                   | Severity | Mitigation                                                                        |
| ------------------------------------------------------ | -------- | --------------------------------------------------------------------------------- |
| Scope creep — 13 capabilities is ambitious             | HIGH     | Phased delivery; Phase 1 is low-risk consolidation of existing code               |
| Domain duplication reintroduced during refactor        | MEDIUM   | Shared domain package as architectural gate; review lens catches duplication      |
| WEB compliance (79 files) refactor destabilizes UI     | HIGH     | Phase 1B is documentation + domain extraction, not full refactor; UI stays stable |
| Policy engine becomes a framework-building rabbit hole | MEDIUM   | Start with 5 hardcoded policies, add policy-as-data only when those 5 are stable  |
| Chained PRs across 3 phases blow review budget         | MEDIUM   | Phase 1 PRs are small refactors; Phase 2/3 each get their own review cycle        |
| CAP-RISK-12 (SUNAT) overlap                            | LOW      | Explicitly out of scope; `drenyra-sunat` owns compliance verification             |

---

## Non-Goals

- **CAP-RISK-12 (SUNAT compliance verification)**: Owned by `drenyra-sunat` SDD. This proposal consumes its outputs (SIRE comparison results, validation status) but does not build SUNAT integration.
- **Real-time anomaly detection pipeline**: CAP-RISK-08 exists as AI agents today. This proposal integrates them into policy evaluation, but a real-time streaming anomaly system is out of scope.
- **SOC 2 / ISO 27001 certification**: The internal controls framework enables audit-readiness but certification itself is a business process, not a code deliverable.
- **Full role-based access control refactor**: Internal controls need RBAC awareness but the RBAC system itself (CAP-FOUND-02, no SDD) is a separate concern.

---

## Rollback

Each phase produces independent PRs. Phase 1 changes are additive (new endpoints, domain extraction) and reversible. Phase 2 domain entities are new tables — no migration rollback needed if they're additive. Phase 3 reports and runbooks are read-only consumers; they can be disabled without affecting core fiscal operations.

---

## Success Criteria

1. **Phase 1A**: Hash-chain verified end-to-end with `GET /audit/verify-chain` returning `{ valid: true, chainLength: N }` in integration tests. Tamper-detection alert fires within the same request when chain breaks.
2. **Phase 1B**: Compliance domain model extracted and 100% of compliance routes documented with API tags. Test coverage ≥ 60% for compliance WEB (from ~10%).
3. **Phase 2A**: Segregation check and 4-eyes approval executable via API. Control matrix visible in control tower.
4. **Phase 2B**: Risk heatmap renders with real data from ≥ 3 fiscal dimensions (SIRE, IGV, PSE).
5. **Phase 2C**: Adding a new compliance rule is a `POST /policies` call, not a code deploy. Proven with ≥ 5 policy types.
6. **Phase 3A**: Audit report generation produces a valid PDF with hash-chain verification evidence.
7. **Phase 3B**: At least 3 runbooks executable via API with evidence collection.
8. **Phase 3C**: Incident lifecycle (declare → assign → close → post-mortem) functional.

---

## Delivery Strategy Note

Given the estimated scope (~2,500–3,500 changed lines across 3 phases), this proposal recommends `auto-chain` with `stacked-to-main` chain strategy. Phase 1 can be a single PR (consolidation, low risk). Phase 2 will likely need chained PRs (2–3) due to new domain entities + API + WEB. Phase 3 can be a single PR (read-heavy, additive).

---

## Next Recommended

`sdd-spec` — formalize capability-by-capability acceptance criteria before design.
