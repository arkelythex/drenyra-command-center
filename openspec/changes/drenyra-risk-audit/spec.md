# Risk, Audit & Internal Controls Specification

## Purpose

Define the requirements for Drenyra's fiscal risk, audit, and internal controls domain. Every fiscal decision MUST be traceable by hash-chain, every compliance rule MUST be enforceable by policy engine, and every risk MUST be visible in a matrix an auditor or CFO can act on. This specification formalizes capabilities CAP-RISK-01 through CAP-RISK-13 (excluding CAP-RISK-12, owned by `drenyra-sunat`).

---

## Requirements

### Requirement: Immutable Audit Trail with Hash-Chain Verification

The system MUST maintain an immutable, cryptographically verifiable audit trail for all fiscal operations. The hash chain SHALL link every audit event to its predecessor using SHA-256 over deterministically normalized JSON payloads.

The system MUST provide a chain-verification endpoint that walks the full hash chain for a given scope and detects gaps or tampering. When verification fails, the system MUST emit a structured tamper-detection alert within the same request.

The system MUST support bulk SUNAT-compatible export of audit events as UBL-like XML for a given fiscal period.

The system MUST use a single shared domain package (`audit-ledger`) for all hash-chain operations. No parallel domain implementations SHALL exist in feature slices.

#### Scenario: Chain verification succeeds

- GIVEN an audit trail with 50 linked events for scope `company/1234`
- WHEN `GET /audit/verify-chain/company/1234` is called
- THEN the response SHALL return `{ valid: true, chainLength: 50, firstEventId: "...", lastEventId: "..." }`
- AND each event's `previousHash` SHALL match the computed SHA-256 of its predecessor

#### Scenario: Chain tampering detected

- GIVEN an audit trail where event #27 has been modified after creation
- WHEN `GET /audit/verify-chain/company/1234` is called
- THEN the response SHALL return `{ valid: false, brokenAt: 27, expectedHash: "...", actualHash: "..." }`
- AND a structured tamper-detection alert SHALL be emitted with severity CRITICAL

#### Scenario: SUNAT bulk export

- GIVEN audit events for company `1234` in fiscal period `2026-07`
- WHEN `GET /audit/export/sunat?period=2026-07&companyId=1234` is called
- THEN the response SHALL return UBL-like XML containing all audit events for that period
- AND the XML SHALL include hash-chain verification evidence for each event

#### Scenario: Single domain package

- GIVEN the `agent-audit-trail` API feature and the `governance-audit` feature
- WHEN audit events are recorded by either feature
- THEN both MUST use the shared `packages/domain/src/audit-ledger/` domain package
- AND no feature SHALL define its own `HashChain` or `computeAuditHash` implementation

---

### Requirement: Governance Audit Log Integration

The governance audit log MUST link its artifact events into the shared hash-chain. Every governance artifact change (creation, update, deletion, approval) SHALL produce an auditable event with a hash-chain entry.

#### Scenario: Governance event in hash-chain

- GIVEN a governance artifact is approved
- WHEN the governance audit log records the approval event
- THEN the event SHALL be linked into the shared hash-chain with scope `governance/{artifactId}`
- AND `GET /audit/verify-chain/governance/{artifactId}` SHALL include the governance event

---

### Requirement: Compliance Domain Model

The system MUST define a shared compliance domain model with `ComplianceRule`, `ComplianceCheck`, and `ComplianceFinding` as value objects and entities. Every compliance feature (WEB, API, PSE) SHALL consume this domain model.

The compliance API routes MUST be standardized under a single `/api/compliance` prefix with proper CQRS separation (commands vs queries).

The system MUST provide a compliance dashboard API that returns an aggregated view of compliance status across all fiscal obligations.

#### Scenario: Compliance dashboard aggregation

- GIVEN compliance checks have been executed for IGV, SIRE, and bancarización obligations
- WHEN `GET /api/compliance/dashboard?companyId=1234` is called
- THEN the response SHALL include status per obligation type
- AND each obligation SHALL report `{ compliant: boolean, lastCheck: ISO8601, findings: number, severity: "low"|"medium"|"high"|"critical" }`

#### Scenario: CQRS compliance routes

- GIVEN a compliance check command
- WHEN `POST /api/compliance/checks` is called with a valid command body
- THEN the route SHALL be classified as a command (writes)
- AND `GET /api/compliance/checks?companyId=1234` SHALL be classified as a query (reads)
- AND no route SHALL mix command and query responsibilities

#### Scenario: Shared domain model consumption

- GIVEN the WEB compliance module (79 files) and the API compliance module (17 files)
- WHEN a compliance finding is recorded by either module
- THEN both MUST use the shared `ComplianceFinding` value object from the domain package
- AND the domain package SHALL define the canonical shape, not individual feature slices

---

### Requirement: Deprecated Agent Cleanup (Phase 1)

The system MUST remove or consolidate deprecated agent copies. Deprecated copies of `compliance-agent.ts` and `pre-audit-job.ts` found outside the canonical infrastructure agent paths SHALL be eliminated.

All retained infrastructure agents (`compliance-agent.ts`, `pre-audit-job.ts`) MUST be enhanced with audit logging of their own decisions, policy-based gating hooks, and structured output schemas for downstream consumption.

#### Scenario: Deprecated copy removal

- GIVEN a deprecated copy at `compliance/agent.ts` that duplicates `packages/infrastructure/src/agents/compliance-agent.ts`
- WHEN Phase 1 cleanup executes
- THEN the deprecated copy SHALL be removed
- AND all imports SHALL reference only the canonical agent path
- AND no runtime behavior SHALL regress

#### Scenario: Agent audit logging

- GIVEN the compliance agent makes a SUNAT compliance determination
- WHEN the determination is computed
- THEN the agent SHALL record its decision in the shared audit trail with scope `agent/compliance/{runId}`
- AND the audit event SHALL include the model used, input summary hash, and output determination

#### Scenario: Agent policy gating

- GIVEN the pre-audit job is about to execute a simulation for a company
- WHEN the job starts
- THEN it SHALL evaluate applicable policies via the policy engine
- AND if a policy action is "block", the job SHALL abort with a structured reason

---

### Requirement: Internal Controls Framework

The system MUST implement an internal controls framework with `SegregationRule`, `FourEyesApproval`, and `ControlPoint` domain entities.

The system MUST provide segregation-of-duties checking via `POST /controls/check-segregation`. This endpoint SHALL verify that a proposed operation does not violate segregation rules for the requesting user.

The system MUST provide four-eyes approval workflow via `POST /controls/request-approval` and `GET /controls/status/:entity`. Sensitive fiscal operations SHALL require approval from a second authorized user before execution.

Controls SHALL be non-blocking advisory by default. Blocking mode MUST be opt-in per tenant.

#### Scenario: Segregation check passes

- GIVEN user A (role: `fiscal-analyst`) attempts to create an invoice
- AND the segregation rules allow `fiscal-analyst` to create invoices
- WHEN `POST /controls/check-segregation` is called with `{ userId: "A", action: "create-invoice", companyId: "1234" }`
- THEN the response SHALL return `{ allowed: true }`

#### Scenario: Segregation check blocks

- GIVEN user A (role: `fiscal-analyst`) attempts to approve their own invoice
- AND the segregation rules forbid self-approval
- WHEN `POST /controls/check-segregation` is called
- THEN the response SHALL return `{ allowed: false, reason: "Self-approval violates segregation rule SR-001", ruleId: "SR-001" }`

#### Scenario: Four-eyes approval workflow

- GIVEN a sensitive fiscal operation requires approval
- WHEN `POST /controls/request-approval` is called with `{ entityType: "invoice", entityId: "INV-456", requestedBy: "user-A" }`
- THEN an approval request SHALL be created with status `pending`
- AND `GET /controls/status/invoice/INV-456` SHALL show `{ approvalsRequired: 2, approvalsReceived: 0, status: "pending" }`
- AND when a second authorized user approves, status SHALL change to `approved`

#### Scenario: Blocking mode per tenant

- GIVEN tenant `company/9999` has opted into blocking controls
- AND tenant `company/1234` has advisory-only controls (default)
- WHEN a segregation violation occurs for `company/9999`
- THEN the operation SHALL be blocked
- WHEN the same violation occurs for `company/1234`
- THEN the operation SHALL proceed with a WARNING-level audit event

---

### Requirement: Fiscal Risk Matrix

The system MUST implement a fiscal risk matrix with domain entities `RiskCategory`, `RiskAssessment`, and `RiskScore`. Risk dimensions SHALL include SUNAT exposure, IGV variance, SIRE discrepancies, and bancarización gaps.

The system MUST provide a risk heatmap via `GET /risk/heatmap` that renders risk scores across all dimensions for a given company.

The system MUST recalculate risk scores automatically when underlying data sources (SIRE diff, PSE validation, compliance findings) are updated.

#### Scenario: Risk assessment with fiscal dimensions

- GIVEN company `1234` has SIRE discrepancies of 15%, IGV variance of 3.2%, and no bancarización gaps
- WHEN `POST /risk/assess` is called with `{ companyId: "1234" }`
- THEN the response SHALL include scores per dimension: `{ sireDiscrepancy: { score: 65, level: "medium" }, igvVariance: { score: 30, level: "low" }, bancarizacionGap: { score: 0, level: "none" } }`
- AND a composite risk score SHALL be computed from weighted dimensions

#### Scenario: Risk heatmap

- GIVEN risk assessments exist for companies `1234`, `5678`, and `9012`
- WHEN `GET /risk/heatmap?portfolioId=abc` is called
- THEN the response SHALL return a matrix of companies × risk dimensions
- AND each cell SHALL include score and level for interactive heatmap rendering

#### Scenario: Automatic recalculation

- GIVEN a SIRE comparison completes and new discrepancies are detected for company `1234`
- WHEN the SIRE diff results are persisted
- THEN the risk matrix SHALL recalculate the `sireDiscrepancy` dimension for company `1234`
- AND the composite risk score SHALL be updated within 60 seconds of the triggering event

---

### Requirement: Policy Enforcement Engine

The system MUST implement a policy enforcement engine where policies are data, not code. Adding a new SUNAT threshold SHALL NOT require a code deploy.

The system MUST support `Policy`, `PolicyRule`, `PolicyEvaluation`, and `PolicyAction` (allow, block, warn, require-approval) as domain entities.

The system MUST provide `POST /policies/evaluate` to evaluate applicable policies against a given context, `POST /policies` to register new policies, and `GET /policies` to list all active policies.

Policy definitions SHALL use structured JSON (not a DSL) with conditions, thresholds, and actions.

#### Scenario: Policy evaluation — allow

- GIVEN a policy exists: "IGV credit must be below 18% of declared revenue" with action `warn` above threshold
- WHEN `POST /policies/evaluate` is called with `{ policyContext: "invoice-validation", companyId: "1234", data: { igvCredit: 5000, declaredRevenue: 100000 } }`
- THEN the response SHALL include `{ policyId: "...", action: "allow", evaluatedAt: "..." }`
- AND no warning SHALL be emitted (5% < 18%)

#### Scenario: Policy evaluation — warn

- GIVEN the same policy exists
- WHEN `POST /policies/evaluate` is called with `{ ..., data: { igvCredit: 25000, declaredRevenue: 100000 } }`
- THEN the response SHALL include `{ policyId: "...", action: "warn", message: "IGV credit (25%) exceeds threshold (18%)", ... }`

#### Scenario: Policy evaluation — block

- GIVEN a policy exists: "SIRE discrepancies above 10% require approval" with action `block`
- WHEN `POST /policies/evaluate` is called with `{ ..., data: { sireDiscrepancyPct: 15 } }`
- THEN the response SHALL include `{ action: "block", ... }`

#### Scenario: Policy as data — no deploy required

- GIVEN a new SUNAT regulation changes the IGV credit threshold from 18% to 15%
- WHEN an authorized user calls `POST /policies` with the updated threshold
- THEN the new threshold SHALL take effect immediately for all subsequent evaluations
- AND no code deploy or application restart SHALL be required
- AND the policy change itself SHALL be recorded in the audit trail

#### Scenario: Policy registration

- GIVEN a compliance officer wants to add a new policy
- WHEN `POST /policies` is called with a valid policy definition
- THEN the policy SHALL be stored and immediately active
- AND `GET /policies` SHALL return the new policy in the active list
- AND the response SHALL include the policy's unique ID

---

### Requirement: Control Tower Risk and Control Widgets

The control tower MUST display risk matrix widgets and internal control status. The control tower SHALL consume the shared risk and controls domain, not duplicate it.

The control tower SHALL surface real-time control status: pending approvals, segregation violations, and control execution history.

#### Scenario: Control tower shows risk widgets

- GIVEN risk assessments exist for a company with active portfolio
- WHEN the control tower loads its dashboard
- THEN it SHALL render risk heatmap widgets sourced from `GET /risk/heatmap`
- AND it SHALL render compliance status widgets sourced from `GET /api/compliance/dashboard`

#### Scenario: Control tower shows approval queue

- GIVEN three four-eyes approval requests are pending for different entities
- WHEN the control tower loads
- THEN it SHALL display an approval queue widget showing all three pending items
- AND each item SHALL include entity type, entity ID, requestor, and age

---

### Requirement: Audit Report Generation

The system MUST generate automated audit reports with fiscal-period, per-agent, and per-client templates. Reports SHALL be exportable as PDF (priority) and XLSX (secondary).

The system MUST include hash-chain verification evidence in every generated audit report.

The system SHALL support scheduled report generation via `POST /audit/reports/generate` with optional cron-like scheduling.

#### Scenario: Fiscal-period audit report

- GIVEN audit events exist for period `2026-07` for company `1234`
- WHEN `POST /audit/reports/generate` is called with `{ template: "fiscal-period", period: "2026-07", companyId: "1234", format: "pdf" }`
- THEN a PDF SHALL be generated containing all audit events for that period
- AND the PDF SHALL include a hash-chain verification section showing chain validity
- AND `GET /audit/reports/{reportId}` SHALL return the report with status `completed` and a download URL

#### Scenario: Scheduled report generation

- GIVEN a scheduled report is configured for monthly fiscal-period reports
- WHEN the scheduled time arrives
- THEN the report SHALL be generated automatically
- AND the completed report SHALL be available via `GET /audit/reports/{reportId}`
- AND a notification SHALL be emitted when generation completes

---

### Requirement: Compliance Runbooks

The system MUST provide compliance runbooks as structured workflows. A runbook SHALL consist of ordered `RunbookStep` entities, each capable of collecting `EvidenceItem` records.

The system MUST ship pre-built runbooks for: IGV declaration, SIRE submission, bancarización compliance, and representation expenses.

The system SHALL provide `POST /runbooks/:id/execute` to step through a runbook and `POST /runbooks/:id/evidence` to attach evidence to a step.

#### Scenario: Execute IGV declaration runbook

- GIVEN the pre-built IGV declaration runbook exists with steps: (1) verify purchase registry, (2) verify sales registry, (3) reconcile IGV credit, (4) confirm declaration values
- WHEN `POST /runbooks/igv-declaration/execute` is called for company `1234`
- THEN the system SHALL return the first incomplete step
- AND each step completion SHALL be recorded in the audit trail
- AND evidence SHALL be attachable to each step via `POST /runbooks/igv-declaration/evidence`

#### Scenario: Runbook completion

- GIVEN all steps of a runbook have been completed with evidence
- WHEN the final step is marked complete
- THEN the runbook status SHALL transition to `completed`
- AND a completion event SHALL be recorded in the audit trail
- AND the runbook execution SHALL be included in audit report generation

#### Scenario: Pre-built runbook availability

- GIVEN the system is deployed
- WHEN `GET /runbooks` is called
- THEN the response SHALL include at least 4 runbooks: `igv-declaration`, `sire-submission`, `bancarizacion-compliance`, `representation-expenses`
- AND each runbook SHALL have documented steps with descriptions

---

### Requirement: Security Incident Response

The system MUST implement a security incident lifecycle: declare, assign, close, and generate post-mortem.

The system SHALL automatically declare incidents when: hash-chain verification fails, anomaly detection threshold is exceeded, or policy violation severity reaches CRITICAL.

The system SHALL provide `POST /incidents` for manual declaration, `GET /incidents` for listing, and `PATCH /incidents/:id` for status transitions.

#### Scenario: Automatic incident from chain failure

- GIVEN hash-chain verification fails for scope `company/1234`
- WHEN the verification endpoint returns `{ valid: false }`
- THEN an incident SHALL be automatically declared with severity CRITICAL
- AND the incident SHALL reference the broken chain event and scope
- AND `GET /incidents` SHALL include the new incident

#### Scenario: Manual incident declaration

- GIVEN a compliance officer detects unusual activity
- WHEN `POST /incidents` is called with `{ title: "Suspicious SIRE pattern", severity: "high", description: "..." }`
- THEN an incident SHALL be created with status `open`
- AND the incident SHALL be assignable via `PATCH /incidents/:id { assigneeId: "user-B" }`

#### Scenario: Incident lifecycle to post-mortem

- GIVEN an incident has been assigned, investigated, and resolved
- WHEN `PATCH /incidents/:id { status: "closed", resolution: "..." }` is called
- THEN a post-mortem SHALL be generated automatically
- AND the post-mortem SHALL include: timeline, root cause, impact assessment, and preventive measures
- AND the incident and post-mortem SHALL be recorded in the audit trail

---

### Requirement: Cross-Cutting Audit and Policy Integration

All fiscal operations (invoice creation, SIRE submission, close checklist) SHALL integrate as control points. Each control point SHALL: (1) check segregation before execution, (2) evaluate applicable policies, (3) record the decision in the audit trail.

The policy engine SHALL be the single evaluation point for all compliance rules. No feature SHALL hardcode compliance thresholds outside the policy engine.

#### Scenario: Invoice creation as control point

- GIVEN a user creates an invoice via the fiscal system
- WHEN the invoice creation request is received
- THEN segregation SHALL be checked before processing
- AND applicable policies SHALL be evaluated
- AND the audit trail SHALL record: `{ action: "create-invoice", segregation: "allowed", policies: [...], hash: "..." }`

#### Scenario: No hardcoded compliance rules

- GIVEN the codebase after Phase 2C completion
- WHEN a grep for hardcoded IGV thresholds (e.g., literal `18` or `0.18` in compliance logic) is performed
- THEN no compliance-specific thresholds SHALL exist outside policy definitions
- AND all threshold values SHALL be resolvable to a `PolicyRule` entity
