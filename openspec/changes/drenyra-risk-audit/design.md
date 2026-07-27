# SDD Design: Risk, Audit & Internal Controls

**Change:** `drenyra-risk-audit`
**Created:** 2026-07-25
**Status:** Design
**Domain:** Risk, Audit & Internal Controls (CAP-RISK-01 through CAP-RISK-13)
**Depends on:** `proposal`, `spec`

---

## Executive Summary

This design formalizes the Risk, Audit & Internal Controls domain across three phases. Phase 1 unifies the duplicated hash chain, documents compliance, and cleans up deprecated agents. Phase 2 builds the missing structural capabilities (risk matrix, internal controls, policy engine). Phase 3 delivers the operational surface (reports, runbooks, incident response).

The architecture follows the existing Drenyra pattern: **Domain package → Application use cases → API feature slices → WEB feature slices**, with the shared domain package as the architectural gate that prevents parallel domain implementations.

---

## Phase 1: Consolidation & Hardening

### 1A — Hash Chain Unification

#### Current State (Problem)

Two independent `HashChain` + `normalizeJson` + hashing implementations exist:

```
┌─────────────────────────────────┐  ┌──────────────────────────────────────┐
│ packages/domain/src/            │  │ apps/api/src/features/              │
│   audit-ledger/                 │  │   agent-audit-trail/domain/         │
│                                 │  │                                      │
│ HashChain (isValidSha256 regex) │  │ HashChain (length check only)       │
│ computeAuditHash(payload, prev) │  │ computeHash(HashableData)           │
│ normalizeJson                   │  │ normalizeJson (inline, identical)   │
│ ──────────────────────────      │  │ AgentDecisionLog entity             │
│ Tests: 3 files, well-tested     │  │ AgentContext VO                     │
│                                 │  │ DecisionData VO                     │
│                                 │  │ Tests: 1 file (schema hardening)    │
└─────────────────────────────────┘  └──────────────────────────────────────┘
```

**Key divergences:**

- Domain `HashChain.create()` validates with `/^[0-9a-f]{64}$/` (lowercase hex). API's only checks `length !== 64`.
- Domain `computeAuditHash` takes raw payload + prevHash. API's `computeHash` takes a `HashableData` interface with id/createdAt/inputs/outputs/prevHash, joins with `|`.
- API duplicate re-exports `normalizeJson` inline inside `hash.service.ts` instead of importing from the shared domain.

#### Target State

```
┌──────────────────────────────────────────────────────┐
│ packages/domain/src/audit-ledger/  (SINGLE SOURCE)   │
│                                                      │
│ HashChain (isValidSha256)          ← shared VO       │
│ computeAuditHash(payload, prevHash) ← shared hasher  │
│ normalizeJson                      ← shared normalizer│
│ HashableData interface (NEW)       ← convenience     │
│ AuditEvent entity (NEW)            ← domain entity   │
│ verifyChain(events[]): Result      ← NEW              │
│                                                      │
│ Tests: hash-chain, normalize-json, compute-audit-hash,│
│        verify-chain (NEW)                            │
└──────────────┬───────────────────────────────────────┘
               │ import { HashChain, computeAuditHash,
               │          normalizeJson, AuditEvent,
               │          verifyChain } from "@drenyra/domain"
               ▼
┌──────────────────────────────────────────────────────┐
│ apps/api/src/features/agent-audit-trail/domain/      │
│                                                      │
│ AgentDecisionLog entity  ← uses shared HashChain VO  │
│ AgentContext VO           ← stays (API-specific)     │
│ DecisionData VO           ← stays (API-specific)     │
│ createAgentDecisionLog()  ← uses shared computeAuditHash│
│                                                      │
│ DELETED: hash.service.ts, hash-chain.vo.ts           │
│          (duplicate normalizeJson removed)           │
└──────────────────────────────────────────────────────┘
```

#### Migration Plan

**Step 1: Extend shared domain** (`packages/domain/src/audit-ledger/`)

Add to the shared package:

```typescript
// NEW: packages/domain/src/audit-ledger/hashable-data.ts
export interface HashableData {
  id: string
  createdAt: Date
  inputs: unknown
  outputs: unknown
  prevHash: string | null
}

// NEW: packages/domain/src/audit-ledger/compute-hash-from-data.ts
import { computeAuditHash } from './compute-audit-hash'
import { normalizeJson } from './normalize-json'

export async function computeHashFromData(data: HashableData): Promise<string> {
  const payload = [
    data.id,
    data.createdAt.toISOString(),
    normalizeJson(data.inputs),
    normalizeJson(data.outputs),
    data.prevHash ?? 'GENESIS',
  ].join('|')
  // Reuse existing computeAuditHash — it normalizes internally,
  // but we pre-normalize for the pipe format the API expects
  return computeAuditHash({ payload }, data.prevHash)
}
```

Wait — the simpler approach: the shared domain's `computeAuditHash` already does `normalizeJson(payload) + (prevHash ?? "GENESIS")`. The API's `computeHash` does a pipe-joined string as the payload. The cleanest migration is to **make the API factory use the shared domain's `computeAuditHash`** directly with a composed payload, and add a `computeHashFromData` convenience wrapper.

```typescript
// NEW in packages/domain/src/audit-ledger/index.ts
export { computeHashFromData } from './compute-hash-from-data'
export type { HashableData } from './hashable-data'
```

Also add `AuditEvent` entity and `verifyChain`:

```typescript
// NEW: packages/domain/src/audit-ledger/audit-event.ts
export interface AuditEventProps {
  id: string
  scope: string
  payload: Record<string, unknown>
  chainHash: string
  prevHash: string | null
  createdAt: Date
}

export class AuditEvent {
  // ...reconstitute, validate, etc.
}

// NEW: packages/domain/src/audit-ledger/verify-chain.ts
export interface ChainVerificationResult {
  valid: boolean
  chainLength: number
  brokenAt?: number
  expectedHash?: string
  actualHash?: string
  firstEventId?: string
  lastEventId?: string
}

export async function verifyChain(
  events: AuditEvent[]
): Promise<ChainVerificationResult> {
  // Walk chain, re-hash each event, compare
}
```

**Step 2: Refactor API feature** (`apps/api/src/features/agent-audit-trail/`)

1. `domain/factory.ts`: Replace `import { computeHash } from "./hash.service"` with `import { computeHashFromData } from "@drenyra/domain"`. Replace `import { HashChain } from "./value-objects/hash-chain.vo"` with `import { HashChain } from "@drenyra/domain"`.

2. `domain/entity.ts`: Replace `import type { HashChain } from "./value-objects/hash-chain.vo"` with `import type { HashChain } from "@drenyra/domain"`.

3. `infrastructure/repository.ts`: Replace `import { ..., HashChain } from "../domain"` with `import { HashChain } from "@drenyra/domain"`.

4. **DELETE**: `domain/hash.service.ts` (duplicate hashing + normalizeJson)
5. **DELETE**: `domain/value-objects/hash-chain.vo.ts` (duplicate HashChain VO)

6. `application/queries/verify-chain.query.ts`: Replace `import { verifyHash } from "../../domain"` with `import { computeHashFromData } from "@drenyra/domain"` and use the domain's new `verifyChain` function.

7. Update `domain/index.ts` barrel to remove deleted exports and re-export from domain.

**Step 3: Link governance audit to hash chain**

`apps/api/src/features/governance-audit/artifact-event-audit.service.ts` currently inserts into `authAuditLogs` with `randomUUID()` — no hash chain.

Add a new function that also records into the shared audit trail:

```typescript
// In governance-audit service:
import { computeAuditHash, HashChain } from '@drenyra/domain'

// After inserting into auth_audit_logs, also record a hash-chain event:
const prevHash = await auditRepo.getLastHash(scope)
const hash = await computeAuditHash(
  { type: 'GOVERNANCE', ...eventData },
  prevHash
)
await auditRepo.saveHashChainEvent({ scope, hash, prevHash, eventData })
```

**Step 4: Add chain verification endpoint**

Add to `agent-audit-trail/api/routes.ts` (or a new route file):

```
GET /audit/verify-chain/:scope → verifies the full chain for that scope
GET /audit/verify-chain/company/:companyId → scope-based verification
```

**Step 5: Add tamper-detection alerting**

When verification fails, emit a structured event:

```typescript
// In verify-chain query, on failure:
import { emitTamperAlert } from '../alerts/tamper-alert'

if (!result.valid) {
  await emitTamperAlert({
    scope,
    brokenAt: result.brokenAt,
    expectedHash: result.expectedHash,
    actualHash: result.actualHash,
    severity: 'CRITICAL',
    timestamp: new Date(),
  })
}
```

The tamper alert is stored in a new `audit_alerts` table and optionally triggers an incident (Phase 3C).

**Step 6: Add SUNAT bulk export**

Extend the existing `xml-exporter.ts` (currently a template) to produce real UBL-like XML from DB-backed audit events, filtered by fiscal period.

#### Rollback Safety

All Phase 1A changes are **additive at the domain level** (new exports, no deletions). The API refactor is a **drop-in replacement** — same factory interface, same entity shape. The deleted files are dead code (no other consumers). Rollback is `git revert`.

#### Verification

- Shared domain tests pass (existing 3 test files + new verify-chain tests)
- API factory produces identical `AgentDecisionLog` entities before/after migration
- `GET /audit/verify-chain/company/1234` returns `{ valid: true, chainLength: N }`
- Governance audit events appear in chain verification results

---

### 1B — Compliance Domain Model & Documentation

#### Current State

- **WEB compliance**: 79 files, ~10% test coverage. Mix of XState machines, hooks, components, API clients across SIRE reconciliation, CPE validation, dashboards.
- **API compliance**: 17 files, mixed routes under `/api/compliance` tag, no domain model.
- **PSE compliance**: 5 files, well-tested, parallel sub-agent execution.

#### Target Architecture

```
packages/domain/src/compliance/          ← NEW bounded context
├── compliance-rule.ts        Value Object: ComplianceRule
├── compliance-check.ts       Entity: ComplianceCheck
├── compliance-finding.ts     Entity: ComplianceFinding
├── compliance-status.ts      Value Object: ComplianceStatus
├── index.ts                  Barrel exports

packages/application/src/compliance/     ← NEW use cases
├── record-finding.command.ts
├── get-compliance-dashboard.query.ts
├── list-compliance-checks.query.ts

apps/api/src/features/compliance/       ← Refactor
├── index.ts                  Standardized under /api/compliance
├── commands/
│   └── record-check.ts       POST /api/compliance/checks (command)
├── queries/
│   ├── list-checks.ts        GET /api/compliance/checks (query)
│   └── dashboard.ts          GET /api/compliance/dashboard (query)
├── pse/                      PSE compliance (keep, add integration tests)
└── schemas.ts                Shared Zod schemas

apps/web/src/features/compliance/       ← DOCUMENT, don't refactor
├── CATALOG.md               ← NEW: file-by-file inventory
├── components/               (79 files — documented, not restructured)
├── hooks/
├── machines/
└── ...
```

#### WEB Compliance Documentation (CATALOG.md)

The 79-file WEB surface is categorized into:

| Category           | Count | Files                                                                      | Risk   |
| ------------------ | ----- | -------------------------------------------------------------------------- | ------ |
| XState Machines    | 6     | `sire-reconciliation.machine.ts`, `cpe-validator.machine.ts`, etc.         | Medium |
| Hooks              | 12    | `useCompliance.ts`, `useSireReconciliation.ts`, `useHitlDecision.ts`, etc. | Low    |
| Page Components    | 8     | `ComplianceView.tsx`, `SireReconciliationPage.tsx`, etc.                   | Low    |
| Shared Components  | 18    | Charts, tables, status badges, filters                                     | Low    |
| API Clients        | 5     | `compliance-api.ts`, `sire-api.ts`, etc.                                   | Low    |
| Types/Constants    | 10    | `sire.types.ts`, `compliance.constants.ts`                                 | Low    |
| Routes             | 4     | Lazy-loaded route definitions                                              | Low    |
| Dashboard Widgets  | 8     | Compliance status cards, trend charts                                      | Low    |
| Country Pack UI    | 5     | Peru-specific compliance forms                                             | Medium |
| Accounting Jobs UI | 3     | Job execution monitoring                                                   | Low    |

**Documentation strategy**: Generate `apps/web/src/features/compliance/CATALOG.md` with a table of every file, its purpose, dependencies, and test status. No refactoring in Phase 1 — the surface is too large and too brittle. Phase 2 and 3 will opportunistically refactor files when adding new features.

#### PSE Compliance Integration Tests

Add integration tests for the parallel sub-agent flow:

```typescript
// apps/api/src/features/compliance/pse/__tests__/integration.test.ts
describe('PSE compliance parallel execution', () => {
  it('should execute PLE, PDT, and SIRE checks concurrently')
  it('should aggregate results from all sub-agents')
  it('should handle partial failures gracefully')
})
```

---

### 1C — Deprecated Agent Cleanup

#### Current State

Two deprecated copies exist:

```
packages/infrastructure/src/agents/
├── compliance-agent.ts           ← CANONICAL
├── pre-audit-job.ts              ← CANONICAL
├── compliance/
│   └── agent.ts                  ← @deprecated (copy of compliance-agent.ts)
└── pre-audit/
    └── job.ts                    ← @deprecated (copy of pre-audit-job.ts)
```

Both deprecated files are marked `// @deprecated Use packages/infrastructure/src/agents/{name}`.

#### Cleanup Steps

1. **Verify no imports**: Search codebase for any imports of `compliance/agent` or `pre-audit/job`.
2. **Remove deprecated files**: Delete `compliance/agent.ts` and `pre-audit/job.ts`.
3. **Remove deprecated directories**: If empty after deletion, remove `compliance/` and `pre-audit/`.

#### Agent Audit Logging Enhancement

Add audit trail integration to canonical agents:

```typescript
// In compliance-agent.ts:
import { computeAuditHash } from "@drenyra/domain";

async function runComplianceAnalysis(ctx: CompanyContext, expenses: ExpenseToAnalyze[]) {
  const runId = ulid();

  // ... existing analysis logic ...

  // NEW: Record decision in audit trail
  const prevHash = await auditRepo.getLastHash(`agent/compliance/${runId}`);
  const hash = await computeAuditHash({
    model: modelId,
    inputSummary: hashInputs(expenses),
    output: analysis,
  }, prevHash);

  await auditRepo.save({
    scope: `agent/compliance/${runId}`,
    hash,
    prevHash,
    event: { type: "COMPLIANCE_ANALYSIS", runId, model: modelId, ... }
  });
}
```

Same pattern for `pre-audit-job.ts`.

#### Agent Policy Gating Hook

Add a lightweight policy evaluation hook before agent execution:

```typescript
// In pre-audit-job.ts:
import { evaluateAgentPolicy } from '@drenyra/application/risk'

async function executePreAudit(orgId: number, period: string) {
  // NEW: Check if policies block this
  const policyResult = await evaluateAgentPolicy({
    agent: 'pre-audit-job',
    organizationId: orgId,
    context: { period },
  })

  if (policyResult.action === 'block') {
    throw new PreAuditBlockedError(policyResult.reason)
  }

  // ... existing execution logic ...
}
```

In Phase 1, `evaluateAgentPolicy` is a stub that returns `allow` — the real policy engine comes in Phase 2C. The hook is wired now so Phase 2C is a drop-in.

---

## Architecture: Bounded Context Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                              │
│                                                              │
│  packages/domain/src/                                       │
│  ├── audit-ledger/          HashChain, AuditEvent,          │
│  │                          computeAuditHash, verifyChain   │
│  │                                                          │
│  ├── compliance/   (NEW)    ComplianceRule, ComplianceCheck,│
│  │                          ComplianceFinding, Status       │
│  │                                                          │
│  └── risk/         (NEW)    ┌─────────────────────────────┐ │
│                             │ Phase 2A: Internal Controls  │ │
│                             │ SegregationRule,              │ │
│                             │ FourEyesApproval, ControlPoint│ │
│                             ├─────────────────────────────┤ │
│                             │ Phase 2B: Risk Matrix        │ │
│                             │ RiskCategory, RiskAssessment,│ │
│                             │ RiskScore                    │ │
│                             ├─────────────────────────────┤ │
│                             │ Phase 2C: Policy Engine      │ │
│                             │ Policy, PolicyRule,          │ │
│                             │ PolicyEvaluation, PolicyAction│ │
│                             ├─────────────────────────────┤ │
│                             │ Phase 3A: Audit Reports      │ │
│                             │ AuditReport, ReportTemplate  │ │
│                             ├─────────────────────────────┤ │
│                             │ Phase 3B: Compliance Runbooks│ │
│                             │ Runbook, RunbookStep,        │ │
│                             │ EvidenceItem                 │ │
│                             ├─────────────────────────────┤ │
│                             │ Phase 3C: Incident Response  │ │
│                             │ Incident, IncidentSeverity,  │ │
│                             │ PostMortem                   │ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│                                                              │
│  packages/application/src/                                  │
│  ├── audit/   (NEW)                                         │
│  │   ├── verify-chain.query.ts                              │
│  │   ├── export-sunat.command.ts                            │
│  │   └── generate-report.command.ts   (Phase 3A)            │
│  │                                                          │
│  ├── compliance/   (NEW)                                    │
│  │   ├── record-check.command.ts                            │
│  │   ├── get-dashboard.query.ts                             │
│  │   └── execute-runbook.command.ts   (Phase 3B)           │
│  │                                                          │
│  └── risk/   (NEW)                                          │
│      ├── check-segregation.query.ts   (Phase 2A)           │
│      ├── request-approval.command.ts  (Phase 2A)           │
│      ├── assess-risk.command.ts       (Phase 2B)           │
│      ├── get-heatmap.query.ts         (Phase 2B)           │
│      ├── evaluate-policy.query.ts     (Phase 2C)           │
│      ├── register-policy.command.ts   (Phase 2C)           │
│      └── declare-incident.command.ts  (Phase 3C)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                               │
│                                                              │
│  apps/api/src/features/                                     │
│  ├── agent-audit-trail/  (REFACTORED Phase 1A)              │
│  │   POST /audit-trail           POST /audit-trail/plugins/ │
│  │   GET  /audit-trail           GET  /audit-trail/verify   │
│  │   GET  /audit-trail/export/xml  GET /audit-trail/export/pdf│
│  │   GET  /audit/verify-chain/:scope  (NEW)                │
│  │   GET  /audit/export/sunat       (NEW, real exporter)    │
│  │                                                          │
│  ├── compliance/  (REFACTORED Phase 1B)                     │
│  │   POST /api/compliance/checks    (command)               │
│  │   GET  /api/compliance/checks    (query)                 │
│  │   GET  /api/compliance/dashboard (query)                 │
│  │   GET  /api/compliance/pse/*     (keep as-is)            │
│  │                                                          │
│  └── risk/  (NEW, Phases 2-3)                               │
│      POST /controls/check-segregation  (Phase 2A)           │
│      POST /controls/request-approval  (Phase 2A)            │
│      GET  /controls/status/:entity    (Phase 2A)            │
│      POST /risk/assess                (Phase 2B)            │
│      GET  /risk/heatmap               (Phase 2B)            │
│      GET  /risk/matrix/:companyId     (Phase 2B)            │
│      POST /policies/evaluate          (Phase 2C)            │
│      POST /policies                   (Phase 2C)            │
│      GET  /policies                   (Phase 2C)            │
│      POST /audit/reports/generate     (Phase 3A)            │
│      GET  /audit/reports/:id          (Phase 3A)            │
│      GET  /runbooks                   (Phase 3B)            │
│      POST /runbooks/:id/execute       (Phase 3B)            │
│      POST /runbooks/:id/evidence      (Phase 3B)            │
│      POST /incidents                  (Phase 3C)            │
│      GET  /incidents                  (Phase 3C)            │
│      PATCH /incidents/:id             (Phase 3C)            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      WEB LAYER                               │
│                                                              │
│  apps/web/src/features/                                     │
│  ├── compliance/  (DOCUMENTED Phase 1B)                     │
│  │   CATALOG.md (NEW)                                       │
│  │                                                          │
│  ├── audit/  (EXPAND Phase 1A + 3A)                         │
│  │   ChainVerifier.tsx (NEW)                                │
│  │   AuditReportViewer.tsx (NEW, Phase 3A)                  │
│  │                                                          │
│  ├── control-tower/  (ENHANCE Phase 3A)                     │
│  │   RiskHeatmapWidget.tsx (NEW, Phase 2B)                  │
│  │   ControlStatusWidget.tsx (NEW, Phase 2A)                │
│  │   ApprovalQueueWidget.tsx (NEW, Phase 2A)                │
│  │   IncidentWidget.tsx (NEW, Phase 3C)                     │
│  │                                                          │
│  └── risk/  (NEW, Phase 2B-3C)                              │
│      RiskMatrixPage.tsx                                     │
│      PolicyManagerPage.tsx                                  │
│      RunbookExecutorPage.tsx                                │
│      IncidentDashboardPage.tsx                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               INFRASTRUCTURE LAYER                           │
│                                                              │
│  packages/infrastructure/src/                               │
│  ├── agents/  (CLEANED Phase 1C)                            │
│  │   compliance-agent.ts  (enhanced: audit logging)         │
│  │   pre-audit-job.ts     (enhanced: audit logging + policy)│
│  │   treasury-agent.ts    (add audit logging)               │
│  │   compliance/agent.ts  (DELETED)                         │
│  │   pre-audit/job.ts     (DELETED)                         │
│  │                                                          │
│  └── alerting/  (NEW)                                       │
│      tamper-alert.ts      (Phase 1A)                        │
│      incident-trigger.ts  (Phase 3C)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               PERSISTENCE LAYER                              │
│                                                              │
│  packages/persistence/src/schema/                           │
│  ├── (existing) agent_decision_logs                         │
│  ├── (existing) auth_audit_logs                             │
│  ├── (NEW) audit_events          Phase 1A (shared table)    │
│  ├── (NEW) audit_alerts           Phase 1A                  │
│  ├── (NEW) compliance_rules       Phase 1B                  │
│  ├── (NEW) compliance_checks      Phase 1B                  │
│  ├── (NEW) compliance_findings    Phase 1B                  │
│  ├── (NEW) segregation_rules      Phase 2A                  │
│  ├── (NEW) control_points         Phase 2A                  │
│  ├── (NEW) approval_requests      Phase 2A                  │
│  ├── (NEW) risk_assessments       Phase 2B                  │
│  ├── (NEW) risk_categories        Phase 2B                  │
│  ├── (NEW) policies               Phase 2C                  │
│  ├── (NEW) policy_rules           Phase 2C                  │
│  ├── (NEW) policy_evaluations     Phase 2C                  │
│  ├── (NEW) audit_reports          Phase 3A                  │
│  ├── (NEW) runbooks               Phase 3B                  │
│  ├── (NEW) runbook_steps          Phase 3B                  │
│  ├── (NEW) evidence_items         Phase 3B                  │
│  ├── (NEW) incidents              Phase 3C                  │
│  └── (NEW) post_mortems           Phase 3C                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Entity Relationships

```
Phase 1A — Audit Trail
═══════════════════════

  AuditEvent ───────────── HashChain (VO)
  │  id: string              hash: string
  │  scope: string           prevHash: string|null
  │  payload: json
  │  chainHash: string
  │  prevHash: string|null
  │  createdAt: Date
  │
  └── scope examples:
        "company/1234", "agent/compliance/run-abc",
        "governance/artifact-xyz"


  GovernanceAuditLog ──────> AuditEvent (via shared scope)
  │  eventId: string
  │  action: string          (hash-chain linked)
  │  artifactId: string
  │  ...details


Phase 1B — Compliance
═══════════════════════

  ComplianceRule (VO)
  │  id: string
  │  code: string            e.g. "IGV-001"
  │  description: string
  │  obligationType: enum    IGV | SIRE | BANCARIZACION | ...
  │  severity: enum

  ComplianceCheck ─────────── ComplianceRule
  │  id: string               (many checks per rule)
  │  ruleId: string
  │  companyId: string
  │  executedAt: Date
  │  status: enum

  ComplianceFinding ───────── ComplianceCheck
  │  id: string               (many findings per check)
  │  checkId: string
  │  severity: enum
  │  message: string
  │  resolvedAt?: Date


Phase 2A — Internal Controls
════════════════════════════

  SegregationRule
  │  id: string
  │  code: string            e.g. "SR-001"
  │  action: string          "create-invoice", "approve-invoice"
  │  conflictingRoles: [A, B]  roles that can't both perform action
  │  mode: "advisory" | "blocking"

  ControlPoint
  │  id: string
  │  entityType: string
  │  entityId: string
  │  controlType: enum       SEGREGATION_CHECK | FOUR_EYES | POLICY_EVAL
  │  executedAt: Date
  │  result: json

  FourEyesApproval ────────── ControlPoint
  │  id: string
  │  entityType: string
  │  entityId: string
  │  requestedBy: userId
  │  approvedBy?: userId
  │  status: enum            pending | approved | rejected
  │  requestedAt: Date
  │  resolvedAt?: Date


Phase 2B — Risk Matrix
═══════════════════════

  RiskCategory
  │  id: string
  │  name: string            "SIRE Discrepancies", "IGV Variance"
  │  weight: number          0-1, sum of weights = 1
  │  dataSources: string[]   "sire_diff", "pse_validation"

  RiskAssessment ──────────── RiskCategory
  │  id: string               (one assessment per company per period)
  │  companyId: string
  │  period: string           "2026-07"
  │  dimensionScores: DimensionScore[]
  │  compositeScore: number   0-100
  │  level: enum              low | medium | high | critical
  │  calculatedAt: Date

  DimensionScore (embedded in RiskAssessment)
  │  categoryId: string
  │  score: number            0-100
  │  level: enum
  │  dataPoints: json         evidence from data sources


Phase 2C — Policy Engine
════════════════════════

  Policy ──────────────────── PolicyRule[]
  │  id: string               (one policy has many rules)
  │  name: string
  │  description: string
  │  context: string          "invoice-validation", "sire-submission"
  │  priority: number
  │  enabled: boolean

  PolicyRule
  │  id: string
  │  policyId: string
  │  condition: json          { field: "igvCreditPct", operator: "gt", value: 18 }
  │  action: enum             allow | warn | block | require-approval
  │  message: string          template for warning/block message

  PolicyEvaluation ────────── Policy
  │  id: string
  │  policyId: string
  │  context: string
  │  inputData: json
  │  result: enum             allow | warn | block | require-approval
  │  matchedRules: string[]   rule IDs that triggered
  │  evaluatedAt: Date
  │  evaluatedBy?: userId     null if automated


Phase 3A — Audit Reports
════════════════════════

  AuditReport
  │  id: string
  │  template: enum           fiscal-period | per-agent | per-client
  │  companyId: string
  │  period?: string
  │  format: enum             pdf | xlsx
  │  status: enum             pending | generating | completed | failed
  │  fileUrl?: string         download URL
  │  hashChainEvidence: json  chain verification result
  │  createdAt: Date
  │  scheduledAt?: Date       for scheduled reports


Phase 3B — Compliance Runbooks
══════════════════════════════

  Runbook ─────────────────── RunbookStep[]
  │  id: string               (one runbook has ordered steps)
  │  name: string             "igv-declaration"
  │  description: string
  │  obligationType: string

  RunbookStep
  │  id: string
  │  runbookId: string
  │  order: number
  │  title: string
  │  description: string
  │  status: enum             pending | in_progress | completed | skipped

  EvidenceItem ────────────── RunbookStep
  │  id: string
  │  stepId: string
  │  type: enum               document | screenshot | log | export
  │  fileUrl?: string
  │  notes: string
  │  collectedAt: Date
  │  collectedBy: userId


Phase 3C — Incident Response
════════════════════════════

  Incident
  │  id: string
  │  title: string
  │  severity: enum           low | medium | high | critical
  │  status: enum             open | investigating | resolved | closed
  │  source: enum             chain_failure | anomaly_detection | policy_violation | manual
  │  sourceRef?: string       reference to triggering event
  │  assigneeId?: userId
  │  declaredAt: Date
  │  resolvedAt?: Date
  │  resolution?: string

  PostMortem ──────────────── Incident (1:1)
  │  id: string
  │  incidentId: string
  │  timeline: json           [{ timestamp, event }]
  │  rootCause: string
  │  impactAssessment: string
  │  preventiveMeasures: string[]
  │  generatedAt: Date
```

---

## Data Flow: Cross-Cutting Control Point

```
Fiscal Operation (e.g., create invoice)
        │
        ▼
┌──────────────────────┐
│ 1. SEGREGATION CHECK │──── fail (blocking mode) ──→ BLOCK + audit event
│ POST /controls/      │
│     check-segregation│──── pass ──→ continue
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ 2. POLICY EVALUATION │──── block ──→ BLOCK + audit event
│ POST /policies/      │
│     evaluate         │──── warn ──→ WARNING + audit event + continue
│                      │
│                      │──── allow ──→ continue
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ 3. EXECUTE OPERATION │
│ (create invoice)     │
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ 4. RECORD AUDIT EVENT│
│ computeAuditHash()   │
│ save to audit_events │
└──────────────────────┘
```

---

## Policy Engine Design Detail (Phase 2C)

### Policy as Data — JSON Structure

```json
{
  "id": "pol-igv-credit-threshold",
  "name": "IGV Credit Threshold",
  "description": "Warn when IGV credit exceeds 18% of declared revenue",
  "context": "invoice-validation",
  "priority": 10,
  "enabled": true,
  "rules": [
    {
      "id": "rule-igv-001",
      "condition": {
        "field": "igvCreditPct",
        "operator": "gt",
        "value": 18
      },
      "action": "warn",
      "message": "IGV credit ({{igvCreditPct}}%) exceeds threshold (18%)"
    },
    {
      "id": "rule-igv-002",
      "condition": {
        "field": "igvCreditPct",
        "operator": "gt",
        "value": 30
      },
      "action": "block",
      "message": "IGV credit ({{igvCreditPct}}%) exceeds critical threshold (30%). Approval required."
    }
  ]
}
```

### Supported Operators

| Operator  | Description                  | Example                                                    |
| --------- | ---------------------------- | ---------------------------------------------------------- |
| `eq`      | Equals                       | `{ field: "status", operator: "eq", value: "overdue" }`    |
| `neq`     | Not equals                   | `{ field: "type", operator: "neq", value: "credit_note" }` |
| `gt`      | Greater than                 | `{ field: "amount", operator: "gt", value: 10000 }`        |
| `gte`     | Greater than or equal        |                                                            |
| `lt`      | Less than                    |                                                            |
| `lte`     | Less than or equal           |                                                            |
| `in`      | In array                     | `{ field: "category", operator: "in", value: ["A","B"] }`  |
| `nin`     | Not in array                 |                                                            |
| `between` | Range (inclusive)            | `{ field: "pct", operator: "between", value: [10, 20] }`   |
| `exists`  | Field exists (value ignored) | `{ field: "ruc", operator: "exists" }`                     |
| `regex`   | Regex match                  | `{ field: "ruc", operator: "regex", value: "^10" }`        |

### Composite Conditions (AND/OR)

```json
{
  "logic": "and",
  "conditions": [
    { "field": "igvCreditPct", "operator": "gt", "value": 18 },
    { "field": "monthlyRevenue", "operator": "gt", "value": 500000 }
  ]
}
```

Top-level `logic` is `and` by default. Nested `conditions` can use `or`:

```json
{
  "logic": "or",
  "conditions": [
    { "field": "sireDiscrepancyPct", "operator": "gt", "value": 10 },
    { "field": "igvVariancePct", "operator": "gt", "value": 5 }
  ]
}
```

### Evaluation Algorithm

```
evaluatePolicy(policy, context):
  results = []
  for rule in policy.rules:
    if evaluateCondition(rule.condition, context.data):
      results.push({ ruleId: rule.id, action: rule.action, message: interpolate(rule.message, context.data) })

  // Highest severity wins
  if any result has action "block"  → return { action: "block", matchedRules: [...] }
  if any result has action "warn"   → return { action: "warn", matchedRules: [...] }
  return { action: "allow", matchedRules: [] }
```

### Integration Points

| Context              | Trigger                 | Data available                                |
| -------------------- | ----------------------- | --------------------------------------------- |
| `invoice-validation` | Before invoice creation | IGV credit %, invoice amount, vendor RUC      |
| `sire-submission`    | Before SIRE submit      | SIRE discrepancy %, record count              |
| `close-checklist`    | Before period close     | PSE validation results, reconciliation status |
| `agent-compliance`   | Before agent execution  | Agent name, model, input summary              |
| `agent-pre-audit`    | Before pre-audit job    | Organization ID, period                       |

### Audit Trail for Policy Changes

Every policy CRUD operation is recorded in the audit trail:

```
POST /policies → audit event { action: "policy:create", policyId, userId, ... }
PUT /policies/:id → audit event { action: "policy:update", policyId, changes, userId, ... }
DELETE /policies/:id → audit event { action: "policy:delete", policyId, userId, ... }
```

This ensures regulatory auditors can trace who changed what rule and when.

---

## Internal Controls Design Detail (Phase 2A)

### Segregation Matrix

| Action             | Role A (can execute) | Role B (can approve) | Conflict                                              |
| ------------------ | -------------------- | -------------------- | ----------------------------------------------------- |
| `create-invoice`   | `fiscal-analyst`     | `fiscal-supervisor`  | analyst cannot self-approve                           |
| `submit-sire`      | `fiscal-analyst`     | `fiscal-supervisor`  | submitter cannot self-verify                          |
| `close-period`     | `fiscal-supervisor`  | `fiscal-manager`     | 4-eyes required                                       |
| `register-expense` | `fiscal-analyst`     | `fiscal-supervisor`  | analyst can register, cannot self-approve > threshold |
| `policy-change`    | `compliance-officer` | `compliance-manager` | 4-eyes required for policy changes                    |

### Four-Eyes Approval Flow

```
User A (analyst) → POST /controls/request-approval
                     { entityType: "invoice", entityId: "INV-456" }
                            │
                            ▼
                    ┌──────────────────┐
                    │ Approval Request  │
                    │ status: pending   │
                    │ requestedBy: A    │
                    │ createdAt: T      │
                    └──────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      User B (supervisor)         GET /controls/status/invoice/INV-456
      approves via API or         → shows pending approval
      control tower widget
              │
              ▼
      ┌──────────────────┐
      │ Approval Request  │
      │ status: approved  │
      │ approvedBy: B     │
      │ resolvedAt: T+1   │
      └──────────────────┘
              │
              ▼
      Audit event recorded:
      { action: "four-eyes:approved", entity: "invoice/INV-456",
        requestedBy: A, approvedBy: B }
```

### Advisory vs Blocking Mode

```typescript
// Tenant settings
interface TenantControlSettings {
  mode: 'advisory' | 'blocking'
  // In advisory mode: all controls run, results logged, but operations proceed
  // In blocking mode: segregation violations and failed 4-eyes block operations
}

// Default: advisory for all tenants
// Opt-in to blocking: per-tenant setting
```

---

## Risk Matrix Design Detail (Phase 2B)

### Fiscal Risk Dimensions

| Dimension               | Data Source                 | Weight | Calculation                                                 |
| ----------------------- | --------------------------- | ------ | ----------------------------------------------------------- |
| SIRE Discrepancy        | SIRE reconciliation diff    | 30%    | `(discrepancyCount / totalRecords) * 100` capped at 100     |
| IGV Variance            | Tax calculation vs declared | 25%    | `abs(calculated - declared) / declared * 100` capped at 100 |
| Bancarización Gap       | Bank transaction analysis   | 20%    | `(nonCompliantTxns / totalBankTxns) * 100`                  |
| PSE Validation          | PSE compliance checks       | 15%    | `(failedChecks / totalChecks) * 100`                        |
| Representation Expenses | Expense tracking            | 10%    | `(expenses / revenue * 100 - 40) * 2.5` if > 40%            |

### Composite Score

```
compositeScore = Σ (dimension.score * dimension.weight)
```

### Risk Levels

| Score Range | Level      | Color  |
| ----------- | ---------- | ------ |
| 0–20        | `low`      | Green  |
| 21–50       | `medium`   | Yellow |
| 51–75       | `high`     | Orange |
| 76–100      | `critical` | Red    |

### Heatmap Structure

```
GET /risk/heatmap?portfolioId=abc

Response:
{
  "companies": [
    {
      "companyId": "1234",
      "companyName": "Empresa ABC",
      "compositeScore": 35,
      "level": "medium",
      "dimensions": {
        "sireDiscrepancy": { "score": 65, "level": "high" },
        "igvVariance": { "score": 30, "level": "medium" },
        "bancarizacionGap": { "score": 0, "level": "low" },
        "pseValidation": { "score": 15, "level": "low" },
        "representationExpenses": { "score": 45, "level": "medium" }
      }
    },
    ...
  ]
}
```

### Automatic Recalculation Triggers

When a data source updates, the risk matrix recalculates:

| Trigger                     | What recalculates                       | Mechanism           |
| --------------------------- | --------------------------------------- | ------------------- |
| SIRE diff completes         | `sireDiscrepancy` dimension → composite | Event listener      |
| PSE validation runs         | `pseValidation` dimension → composite   | Event listener      |
| Compliance finding recorded | All affected dimensions → composite     | Event listener      |
| Manual trigger              | Full recalculation                      | `POST /risk/assess` |

---

## Audit Report Generation Design (Phase 3A)

### Template Structure

```
Templates:
├── fiscal-period    All audit events for company × period
├── per-agent        Audit events grouped by agent name
├── per-client       Audit events for a single company
└── compliance       Compliance checks + findings + status
```

### PDF Generation Pipeline

```
POST /audit/reports/generate
  { template: "fiscal-period", period: "2026-07", companyId: "1234", format: "pdf" }
        │
        ▼
  ┌─────────────────┐
  │ 1. Collect data  │  Query audit events for period + company
  │ 2. Verify chain  │  Run verifyChain on collected events
  │ 3. Render PDF    │  Use template + data → PDF buffer
  │ 4. Store report  │  Save to blob storage + audit_reports table
  │ 5. Return status │  { reportId, status: "completed", downloadUrl }
  └─────────────────┘
```

### PDF Content Sections (fiscal-period template)

1. **Header**: Company name, RUC, period, report date
2. **Chain Verification Evidence**: `{ valid: true, chainLength: N, firstHash: ..., lastHash: ... }`
3. **Event Summary Table**: Event ID, agent, type, timestamp, hash (truncated)
4. **Detailed Events**: Full event payload per entry
5. **Compliance Status**: Aggregated from compliance dashboard
6. **Risk Assessment**: Latest risk matrix scores
7. **Footer**: Report ID, generation timestamp, page numbers

---

## Incident Response Design (Phase 3C)

### Lifecycle State Machine

```
                    ┌─────────┐
          ┌─────────│  OPEN   │←─────────┐
          │         └────┬────┘          │
          │              │               │
          │         assign               │
          │              │               │
          │         ┌────▼──────┐        │
          │         │INVESTIGATE│        │
          │         └────┬──────┘        │
          │              │               │
          │         resolve              │
          │              │               │
          │         ┌────▼────┐          │
          │         │ RESOLVED│──────────┘ (reopen)
          │         └────┬────┘
          │              │
          │         close + post-mortem
          │              │
          │         ┌────▼────┐
          └─────────│ CLOSED  │
                    └─────────┘
```

### Automatic Declaration Rules

| Trigger                                             | Severity   | Source              |
| --------------------------------------------------- | ---------- | ------------------- |
| Chain verification fails                            | `critical` | `chain_failure`     |
| Policy evaluation returns block > 5 times in 1 hour | `high`     | `policy_violation`  |
| Anomaly detection confidence > 0.9                  | `high`     | `anomaly_detection` |
| Pre-audit job finds critical finding                | `high`     | `pre_audit`         |

### Post-Mortem Template

```json
{
  "incidentId": "INC-001",
  "timeline": [
    {
      "timestamp": "2026-07-25T10:00:00Z",
      "event": "Chain verification failed at event #27"
    },
    {
      "timestamp": "2026-07-25T10:01:00Z",
      "event": "Incident INC-001 automatically declared"
    },
    { "timestamp": "2026-07-25T10:15:00Z", "event": "Assigned to user-B" },
    {
      "timestamp": "2026-07-25T11:30:00Z",
      "event": "Root cause identified: DB write partial failure"
    },
    {
      "timestamp": "2026-07-25T12:00:00Z",
      "event": "Chain rebuilt from backup, verification passes"
    }
  ],
  "rootCause": "Database write to agent_decision_logs returned success but hash column was not persisted. Caused by disk-full condition on replica.",
  "impactAssessment": "27 audit events after event #27 had invalid prevHash links. No data loss — chain was rebuilt from write-ahead log. 45 minutes of audit trail integrity compromised.",
  "preventiveMeasures": [
    "Add disk-space monitoring alert at 80% threshold",
    "Add write-verification step after audit event insertion (read-back hash)",
    "Enable synchronous replication for audit_events table"
  ]
}
```

---

## File Change Summary

### Phase 1A — Hash Chain Unification

| File                                                                                | Action     | Details                                       |
| ----------------------------------------------------------------------------------- | ---------- | --------------------------------------------- |
| `packages/domain/src/audit-ledger/hashable-data.ts`                                 | **NEW**    | HashableData interface                        |
| `packages/domain/src/audit-ledger/compute-hash-from-data.ts`                        | **NEW**    | Convenience wrapper for API migration         |
| `packages/domain/src/audit-ledger/audit-event.ts`                                   | **NEW**    | AuditEvent entity                             |
| `packages/domain/src/audit-ledger/verify-chain.ts`                                  | **NEW**    | verifyChain function                          |
| `packages/domain/src/audit-ledger/index.ts`                                         | **MODIFY** | Add new exports                               |
| `apps/api/src/features/agent-audit-trail/domain/factory.ts`                         | **MODIFY** | Import from shared domain                     |
| `apps/api/src/features/agent-audit-trail/domain/entity.ts`                          | **MODIFY** | Import HashChain from shared domain           |
| `apps/api/src/features/agent-audit-trail/domain/index.ts`                           | **MODIFY** | Remove deleted exports, re-export from domain |
| `apps/api/src/features/agent-audit-trail/domain/hash.service.ts`                    | **DELETE** | Duplicate hashing + normalizeJson             |
| `apps/api/src/features/agent-audit-trail/domain/value-objects/hash-chain.vo.ts`     | **DELETE** | Duplicate HashChain VO                        |
| `apps/api/src/features/agent-audit-trail/infrastructure/repository.ts`              | **MODIFY** | Import from shared domain                     |
| `apps/api/src/features/agent-audit-trail/application/queries/verify-chain.query.ts` | **MODIFY** | Use shared verifyChain                        |
| `apps/api/src/features/agent-audit-trail/api/routes.ts`                             | **MODIFY** | Add verify-chain and SUNAT export endpoints   |
| `apps/api/src/features/governance-audit/artifact-event-audit.service.ts`            | **MODIFY** | Link to hash chain                            |
| `packages/infrastructure/src/alerting/tamper-alert.ts`                              | **NEW**    | Tamper detection alerting                     |
| `packages/persistence/src/schema/audit-events.schema.ts`                            | **NEW**    | Shared audit_events table                     |
| `packages/persistence/src/schema/audit-alerts.schema.ts`                            | **NEW**    | Audit alerts table                            |
| `packages/domain/src/audit-ledger/__tests__/verify-chain.test.ts`                   | **NEW**    | verifyChain tests                             |
| `apps/api/src/features/agent-audit-trail/__tests__/migration.test.ts`               | **NEW**    | Migration integrity tests                     |
| `apps/api/src/features/governance-audit/__tests__/hash-chain-link.test.ts`          | **NEW**    | Governance hash-chain integration tests       |

### Phase 1B — Compliance Domain Model & Documentation

| File                                                                 | Action     | Details                           |
| -------------------------------------------------------------------- | ---------- | --------------------------------- |
| `packages/domain/src/compliance/compliance-rule.ts`                  | **NEW**    | ComplianceRule VO                 |
| `packages/domain/src/compliance/compliance-check.ts`                 | **NEW**    | ComplianceCheck entity            |
| `packages/domain/src/compliance/compliance-finding.ts`               | **NEW**    | ComplianceFinding entity          |
| `packages/domain/src/compliance/compliance-status.ts`                | **NEW**    | ComplianceStatus VO               |
| `packages/domain/src/compliance/index.ts`                            | **NEW**    | Barrel exports                    |
| `packages/application/src/compliance/record-check.command.ts`        | **NEW**    | Record compliance check           |
| `packages/application/src/compliance/get-dashboard.query.ts`         | **NEW**    | Compliance dashboard aggregation  |
| `packages/application/src/compliance/list-checks.query.ts`           | **NEW**    | List compliance checks            |
| `apps/api/src/features/compliance/index.ts`                          | **MODIFY** | Standardize under /api/compliance |
| `apps/api/src/features/compliance/commands/record-check.ts`          | **NEW**    | POST route (command)              |
| `apps/api/src/features/compliance/queries/list-checks.ts`            | **NEW**    | GET route (query)                 |
| `apps/api/src/features/compliance/queries/dashboard.ts`              | **NEW**    | Dashboard route (query)           |
| `apps/web/src/features/compliance/CATALOG.md`                        | **NEW**    | File-by-file inventory            |
| `apps/api/src/features/compliance/pse/__tests__/integration.test.ts` | **NEW**    | PSE integration tests             |

### Phase 1C — Deprecated Agent Cleanup

| File                                                     | Action     | Details                         |
| -------------------------------------------------------- | ---------- | ------------------------------- |
| `packages/infrastructure/src/agents/compliance/agent.ts` | **DELETE** | Deprecated copy                 |
| `packages/infrastructure/src/agents/pre-audit/job.ts`    | **DELETE** | Deprecated copy                 |
| `packages/infrastructure/src/agents/compliance-agent.ts` | **MODIFY** | Add audit logging + policy hook |
| `packages/infrastructure/src/agents/pre-audit-job.ts`    | **MODIFY** | Add audit logging + policy hook |

### Phase 2 — Structural Capabilities (estimated; detailed design in Phase 2 SDD)

~40 new files across domain, application, API, WEB, persistence, and tests for:

- Internal controls framework (SegregationRule, FourEyesApproval, ControlPoint)
- Fiscal risk matrix (RiskCategory, RiskAssessment, RiskScore)
- Policy enforcement engine (Policy, PolicyRule, PolicyEvaluation)

### Phase 3 — Operational Surface (estimated; detailed design in Phase 3 SDD)

~35 new files across application, API, WEB, and infrastructure for:

- Audit report generation (templates, PDF/XLSX export)
- Compliance runbooks (Runbook, RunbookStep, EvidenceItem)
- Incident response (Incident, PostMortem, automatic declarations)

---

## Risks & Mitigations

| Risk                                              | Severity | Mitigation                                                                                                               |
| ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Hash chain migration breaks existing audit events | HIGH     | Factory produces identical entities; migration tests compare before/after; no DB schema change                           |
| Adversarial preimage attack on SHA-256 chain      | LOW      | SHA-256 is preimage-resistant; chain uses deterministic JSON normalization before hashing (key sorting, no whitespace)   |
| Policy condition evaluator becomes complex        | MEDIUM   | Start with 8 operators (simple comparisons) — no nested AND/OR in Phase 2C; composite conditions are Phase 3 enhancement |
| WEB compliance 79 files — regression risk         | HIGH     | Phase 1B is documentation only; no refactoring; CATALOG.md is the deliverable                                            |
| Risk score calculation disputed by auditors       | MEDIUM   | Weights are configurable per tenant; composite formula is documented in schema; audit trail records every recalculation  |
| Policy as data introduces injection risk          | LOW      | Conditions are structured JSON evaluated by a fixed operator set — no expression evaluation, no code execution           |
| Chained PRs across 3 phases                       | MEDIUM   | Phase 1 is a single PR; Phase 2 chained (2-3 PRs: controls → risk → policies); Phase 3 single PR                         |

---

## Delivery Strategy

### Phase 1 PR Structure (single PR)

```
PR: "feat: unify audit hash chain, document compliance, cleanup deprecated agents"

Contains:
- Phase 1A: Hash chain unification (~10 files changed, ~5 new)
- Phase 1B: Compliance domain + documentation (~12 files changed, ~10 new)
- Phase 1C: Agent cleanup (~4 files changed/deleted)

Estimated: ~400–600 changed lines
Risk: LOW — additive domain changes, no UI refactoring
```

### Phase 2 PR Structure (chained, 2-3 PRs)

```
PR 2.1: "feat: internal controls framework (segregation + 4-eyes)"
PR 2.2: "feat: fiscal risk matrix + heatmap"
PR 2.3: "feat: policy enforcement engine"

Estimated: ~800–1200 changed lines total
Risk: MEDIUM — new domain entities, new API endpoints
```

### Phase 3 PR Structure (single PR)

```
PR 3: "feat: audit reports, compliance runbooks, incident response"

Estimated: ~600–900 changed lines
Risk: LOW — read-heavy, additive endpoints
```

---

## Next Recommended

`sdd-tasks` — break down into concrete implementable tasks with dependencies, estimates, and test criteria.
