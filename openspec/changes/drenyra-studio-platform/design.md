# Drenyra Studio Platform — Design Document

**Change:** `drenyra-studio-platform`
**Based on:** Proposal v2026-07-23 + Spec v2026-07-23
**Status:** Design phase complete

---

## Executive Summary

This design formalizes the Drenyra AI agent and automation platform across four phases. Phase 1 stabilizes the 144-file `ai-swarm` runtime with architecture docs, explicit contracts, and boundary-correcting refactors. Phase 2 builds a dual-role visual workflow builder (accountant simplified view + admin full control). Phase 3 delivers a visual skills editor and policy studio. Phase 4 completes the admin panel with analytics, audit logs, and user management.

**Key architectural decisions:**

- `@xyflow/react` for the workflow canvas (battle-tested, React 19 compatible, TypeScript-first)
- DB-backed policies with runtime fallback to hardcoded defaults for zero-downtime migration
- Skill registry unification: runtime `SkillRegistry` becomes the canonical source; catalog API wraps it
- Role-based UI surfaces: same API, different React components — no backend role branching
- `packages/domain/` for shared contracts (Zod + TypeScript)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Drenyra Studio Platform                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Automation  │  │    Skills    │  │    Policy    │  │   Studio    │ │
│  │    Studio    │  │   Editor     │  │    Studio    │  │   Admin     │ │
│  │  (Phase 2)   │  │  (Phase 3)   │  │  (Phase 3)   │  │  (Phase 4)  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                 │                 │         │
│  ┌──────┴─────────────────┴─────────────────┴─────────────────┴──────┐  │
│  │                    Studio API Layer (ElysiaJS)                     │  │
│  │  /api/automation-studio  /api/skills  /api/policies  /api/admin   │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
│                                 │                                       │
│  ┌──────────────────────────────┴────────────────────────────────────┐  │
│  │                     Application Services                          │  │
│  │  AutomationService  SkillsEditorService  PolicyService  AdminSvc  │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
│                                 │                                       │
│  ┌──────────────────────────────┴────────────────────────────────────┐  │
│  │                    Domain Contracts (packages/domain/)              │  │
│  │  AgentDecision  SkillDefinition  PolicyRule  AuditEvent  Workflow  │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
│                                 │                                       │
│  ┌──────────────────────────────┴────────────────────────────────────┐  │
│  │          AI Swarm Runtime (Phase 1 formalized)                     │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐  │  │
│  │  │  Agents   │ │Orchestr. │ │Control    │ │  Skills  │ │Govern. │  │  │
│  │  │ sunat,ocr │ │ service  │ │  Plane    │ │ Registry │ │Policy  │  │  │
│  │  │ reconcil. │ │          │ │ eval+audit│ │          │ │Service │  │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────┘ └────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                 │                                       │
│  ┌──────────────────────────────┴────────────────────────────────────┐  │
│  │                  Persistence (Drizzle + PostgreSQL)                │  │
│  │  automation_workflows │ skills │ policies │ audit_logs │ users    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ═══════════════ Separated by Boundary (packages/drenyra-orchestrator)  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │             Drenyra Orchestrator (SDD orchestration)              │   │
│  │  risk classifier │ budget tracker │ work routing │ lens selector │   │
│  │  git-diff parser │ context-pack │ verification │ fiscal-gate    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Boundaries

| Boundary                                  | Owner                 | Consumer                                         |
| ----------------------------------------- | --------------------- | ------------------------------------------------ |
| ai-swarm ↔ drenyra-orchestrator           | Separate packages     | ai-swarm agents do NOT import orchestrator types |
| ai-swarm ↔ fiscal features (SIRE, ledger) | Domain interfaces     | Dependency injection via abstract interfaces     |
| Studio UI ↔ Studio API                    | REST/JSON contracts   | TanStack Query + Zod validation                  |
| Skills catalog ↔ Skill Registry           | Registry is canonical | Catalog wraps registry's `discover()`            |

---

## 2. AI Swarm Architecture (Phase 1)

### 2.1 Module Map

```
apps/api/src/features/ai-swarm/
├── agents/                    # Agent implementations
│   ├── ocr.agent.ts           # OCR document extraction
│   ├── pcge.agent.ts          # Chart of accounts classification
│   ├── sunat.agent.ts         # SUNAT compliance verification
│   ├── reconciliation.agent.ts# Bank/ledger reconciliation
│   └── evidence.agent.ts      # Evidence chain validation
├── orchestrator/
│   └── orchestrator.service.ts # Multi-agent coordination, task analysis
├── context-control-plane/
│   ├── context-registry.ts     # Surface registry (allowed tools, corpora per surface)
│   ├── context-registry.types.ts # Seed data types
│   ├── context-evaluation.service.ts # Runtime policy evaluation
│   ├── context-policy.service.ts    # Hardcoded policies (migrated to DB in Phase 3)
│   ├── context-audit.service.ts     # Audit trail service
│   ├── context-observability.ts     # Trace record builders
│   └── control-plane-job-metadata.ts # Job metadata for control plane
├── skills/
│   ├── skill.types.ts         # Skill, SkillMetadata, SkillContext interfaces
│   ├── skill-registry.ts      # Central registry: register, invoke, discover
│   └── sunat/                 # Hardcoded SUNAT skills
│       ├── sire-readiness.skill.ts
│       ├── adversarial-audit.skill.ts
│       └── knowledge-retrieval.skill.ts
├── governance/
│   └── autonomy-policy.service.ts # Autonomy levels, kill switch (re-exports from shared/)
├── api/
│   ├── routes.ts              # Aggregate route
│   ├── agent-stream.route.ts  # Agent streaming endpoint
│   ├── cognitive-stream.route.ts # Cognitive stream with approval
│   ├── cognitive-stream-endpoint.route.ts
│   ├── sire-audit.route.ts    # SIRE audit endpoint
│   ├── workflow.route.ts      # Workflow execution endpoint
│   ├── budget.route.ts        # Budget tracking endpoint
│   ├── agents.route.ts        # Agent management
│   ├── agents.metrics.ts      # Prometheus metrics
│   ├── context-control-plane.route.ts
│   ├── compat-control-plane.route.ts
│   ├── invoice-validation.route.ts
│   ├── organization-context.ts
│   ├── cognitive-approval-pairing.ts
│   ├── cognitive-approval-payload.ts
│   ├── ai-observability-sanitizer.ts
│   └── schemas/               # Request/response schemas
├── workers/                   # Background job workers
├── observability/
│   └── observability.service.ts # Run tracking, events, batches, memory
├── tools/
│   ├── cache.ts               # Agent cache
│   └── budget-tracker.ts      # Token cost tracking
└── config/
    ├── openrouter.config.ts   # Model routing, budget limits
    └── types.ts               # AgentType, TaskPriority, TaskStatus, BaseTask
```

### 2.2 Data Flow Diagram

```
Request Ingress
     │
     ▼
┌─────────────────┐
│  API Routes      │  /api/ai-swarm/*
│  (ElysiaJS)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌──────────────────┐
│Agent  │ │Orchestrator      │
│Stream │ │Service           │
│Route  │ │  analyzeTask()   │
└───┬───┘ │  dispatchWork()  │
    │     └────────┬─────────┘
    │              │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Agent Runtime │
    │  (executes)   │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│ Skill   │ │Control   │
│Registry │ │Plane     │
│invoke() │ │evaluate()│
└────┬────┘ └────┬─────┘
     │           │
     │    ┌──────┴──────┐
     │    ▼             ▼
     │ ┌─────────┐ ┌──────────┐
     │ │Policy   │ │Audit     │
     │ │Service  │ │Service   │
     │ └─────────┘ └────┬─────┘
     │                  │
     └──────┬───────────┘
            ▼
    ┌───────────────┐
    │ Agent Decision│
    │ Audit Trail   │
    │ (traceId,     │
    │  evidenceHash) │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ Workers       │
    │ (background)  │
    └───────────────┘
```

### 2.3 Module Contracts (Phase 1 Deliverables)

#### Contract 1: Agent ↔ Orchestrator

```typescript
// packages/domain/src/agent-orchestrator.contract.ts
import { z } from 'zod'

// ─── Agent Input ───
export const AgentInputSchema = z.object({
  context: z.object({
    surface: z.string(), // e.g., "credit_note_verification"
    tenantId: z.string(),
    organizationId: z.number(),
    traceId: z.string().uuid(),
  }),
  surface: z.record(z.unknown()), // Surface-specific payload
  policyConstraints: z.object({
    allowedTools: z.string().array(),
    allowedCorpora: z.string().array(),
    autonomyLevel: z.enum(['none', 'low', 'medium', 'high']),
    maxBudgetUsd: z.number().positive(),
  }),
})

// ─── Agent Output ───
export const AgentOutputSchema = z.object({
  decision: z.record(z.unknown()), // Agent-specific decision payload
  evidence: z.object({
    inputs: z.unknown(), // What was considered
    confidence: z.number().min(0).max(1),
    evidenceHash: z.string(), // SHA-256 of evidence inputs
    policyReferences: z.string().array(), // Policy IDs that governed this
  }),
  traceId: z.string().uuid(),
  agentId: z.string(),
  timestamp: z.string().datetime(),
})

// ─── Error Protocol ───
export const AgentErrorSchema = z.object({
  code: z.enum([
    'BUDGET_EXCEEDED',
    'POLICY_BLOCKED',
    'SKILL_FAILED',
    'TIMEOUT',
    'INVALID_INPUT',
  ]),
  message: z.string(),
  traceId: z.string().uuid(),
  recoverable: z.boolean(),
})

export type AgentInput = z.infer<typeof AgentInputSchema>
export type AgentOutput = z.infer<typeof AgentOutputSchema>
export type AgentError = z.infer<typeof AgentErrorSchema>
```

#### Contract 2: Control Plane ↔ Workers

```typescript
// packages/domain/src/control-plane-worker.contract.ts
import { z } from 'zod'

export const ControlEvaluationPayloadSchema = z.object({
  surface: z.string(),
  traceId: z.string().uuid(),
  policyResult: z.object({
    allowed: z.boolean(),
    reason: z.string(),
    escalationPath: z.string().optional(),
  }),
  allowedTools: z.string().array(),
  allowedCorpora: z.string().array(),
  autonomyLevel: z.enum(['none', 'low', 'medium', 'high']),
  decisionTimestamp: z.string().datetime(),
})

export type ControlEvaluationPayload = z.infer<
  typeof ControlEvaluationPayloadSchema
>
```

#### Contract 3: Skill Registry ↔ Agent Executor

```typescript
// packages/domain/src/skill-registry.contract.ts
import { z } from 'zod'

export const SkillDefinitionSchema = z.object({
  id: z.string(), // "sunat.sire-readiness"
  name: z.string(), // Human-readable
  description: z.string(), // LLM-prompt-ready description
  category: z.enum(['sunat', 'pcge', 'banking', 'audit', 'ocr']),
  version: z.string(), // Semver
  inputSchema: z.record(z.unknown()), // JSON Schema
  outputSchema: z.record(z.unknown()),
  requiresLLM: z.boolean(),
  tools: z.string().array(), // Required tools
  handlerType: z.enum(['deterministic', 'llm-chain', 'hybrid']),
  metadata: z.object({
    costEstimateUsd: z.number(),
    usesAI: z.boolean(),
    deterministic: z.boolean(),
    legalRef: z.string().optional(),
  }),
})

export const SkillInvocationSchema = z.object({
  skillId: z.string(),
  input: z.unknown(),
  context: z.object({
    traceId: z.string().uuid(),
    organizationId: z.number().optional(),
    tenantId: z.string().optional(),
  }),
})

export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>
export type SkillInvocation = z.infer<typeof SkillInvocationSchema>
```

#### Contract 4: Governance ↔ API Routes

```typescript
// packages/domain/src/governance.contract.ts
import { z } from 'zod'

export const PolicyQuestionSchema = z.object({
  surface: z.string(),
  tenantId: z.string(),
  requestedAction: z.string(), // e.g., "post_journal", "execute_skill"
  context: z.record(z.unknown()),
})

export const PolicyAnswerSchema = z.object({
  decision: z.enum(['allowed', 'denied', 'requires_approval']),
  reason: z.string(),
  escalationPath: z.string().optional(),
  matchedPolicyId: z.string(),
  evaluatedAt: z.string().datetime(),
})

export type PolicyQuestion = z.infer<typeof PolicyQuestionSchema>
export type PolicyAnswer = z.infer<typeof PolicyAnswerSchema>
```

### 2.4 Agent Decision Audit Trail

The existing `ai_trace_evidence` table (Drizzle: `ai-control-plane.schema.ts`) already captures basic trace data but lacks the granular fields specified. We extend it:

```sql
-- Migration: Add decision audit fields to ai_trace_evidence
ALTER TABLE ai_trace_evidence
  ADD COLUMN decision_type VARCHAR(50),          -- e.g., "sunat_discrepancy", "ocr_match"
  ADD COLUMN policy_id VARCHAR(255),             -- Policy that governed the decision
  ADD COLUMN evidence_hash VARCHAR(64),          -- SHA-256 of input evidence
  ADD COLUMN confidence DECIMAL(3,2),            -- 0.00 - 1.00
  ADD COLUMN decision_payload JSONB;             -- Full decision body

CREATE INDEX idx_trace_evidence_agent
  ON ai_trace_evidence(trace_id, agent_id);

CREATE INDEX idx_trace_evidence_tenant_time
  ON ai_trace_evidence((tenant_scope->>'tenantId'), created_at);
```

**Decision recording**: Hook into `ControlPlaneRegistry.evaluate()` and `SkillRegistry.invoke()` — every decision gate and skill execution records a trace.

```typescript
// apps/api/src/features/ai-swarm/governance/decision-audit.service.ts (NEW)
export class DecisionAuditService {
  async recordDecision(params: {
    traceId: string
    agentId: string
    decisionType: string
    policyId: string
    evidenceHash: string
    confidence: number
    decisionPayload: unknown
  }): Promise<void> {
    /* INSERT INTO ai_trace_evidence */
  }

  async query(filters: {
    traceId?: string
    agentId?: string
    tenantId?: string
    from?: Date
    to?: Date
    policyId?: string
    decisionType?: string
  }): Promise<DecisionRecord[]> {
    /* SELECT with filters */
  }
}
```

### 2.5 Orchestrator Boundary Audit

**Audit methodology:** Scan every file in `apps/api/src/features/ai-swarm/` and `packages/drenyra-orchestrator/src/`. Flag any import that crosses the boundary.

**Expected findings (pre-audit analysis):**

| File                                                   | Crosses                                                                                                      | Risk   | Action                                                                                                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-swarm/orchestrator/orchestrator.service.ts`        | Uses task analysis heuristics similar to `drenyra-orchestrator` work routing but for fiscal agents — NOT SDD | Low    | Document as intentional: ai-swarm orchestrator is for fiscal agent workflows only                                                                       |
| `ai-swarm/config/types.ts`                             | `AgentType`, `TaskPriority` overlap conceptually with orchestrator types                                     | Low    | Keep separate. ai-swarm types = fiscal agents. drenyra-orchestrator types = SDD orchestration.                                                          |
| `packages/drenyra-orchestrator/src/skills-resolver.ts` | `SkillEntry`, `SkillRegistry` — this is SDD skill resolution, NOT fiscal skills                              | Medium | Rename to avoid confusion: `SddSkillEntry`, `SddSkillRegistry`. Phase 1 does NOT rename (behavior change risk). Document as intentional naming overlap. |
| `packages/shared/src/autonomy-policy.ts`               | Types used by both ai-swarm AND api routes                                                                   | Medium | Move to `packages/domain/src/governance.contract.ts`. Re-export from shared for backward compatibility.                                                 |

**Output:** `docs/architecture/ai-swarm/boundary-audit.md` — table with every flagged crossing, risk assessment, and action decision.

### 2.6 Refactors (Phase 1)

| Refactor                                           | Files                                                                                   | Risk                               | Verification           |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------- |
| Move shared governance types to `packages/domain/` | `apps/api/src/shared/autonomy-policy.ts` → `packages/domain/src/governance.contract.ts` | Low — re-export from old path      | 56 ai-swarm tests pass |
| Audit trail instrumentation                        | `context-control-plane/`, `skills/skill-registry.ts`                                    | Low — additive, no behavior change | 56 ai-swarm tests pass |
| Document architectural boundaries                  | Create `docs/architecture/ai-swarm/`                                                    | None                               | Peer review            |

**No-behavior-change guarantee:** Every refactor in Phase 1 is verified by running the existing 56-test suite. No agent logic changes. Only code moves + documentation.

---

## 3. Automation Studio Builder (Phase 2)

### 3.1 Workflow Canvas Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AutomationStudioPage                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌──────────────────────────┐  ┌──────────────┐ │
│  │ Step       │  │                          │  │ Properties   │ │
│  │ Library    │  │     <WorkflowCanvas>     │  │ Panel        │ │
│  │ (collapsible│  │                          │  │ (contextual) │ │
│  │  left)     │  │   ┌──────┐    ┌──────┐  │  │              │ │
│  │            │  │   │Node 1│───→│Node 2│  │  │ node config  │ │
│  │ Categories:│  │   └──────┘    └──────┘  │  │ JSON editor  │ │
│  │ • SUNAT    │  │        │         │       │  │ simulation   │ │
│  │ • Reconcil.│  │        │    ┌──────┐    │  │ results      │ │
│  │ • Invoices │  │        └───→│Node 3│    │  │              │ │
│  │ • Notify   │  │             └──────┘    │  │              │ │
│  │ • Custom   │  │                          │  │              │ │
│  └────────────┘  └──────────────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Visual Mode] [Raw JSON] [Simulate] [Save] [Activate]    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Tech choice: `@xyflow/react` (v12+)**

- React 19 compatible, TypeScript-first
- Custom node types via `nodeTypes` prop
- Edge validation hook: `isValidConnection`
- Built-in minimap, controls, background
- Active OSS community (formerly reactflow)

**Component tree:**

```
AutomationStudioPage
├── RoleGate (role === "accountant" ? AccountantView : AdminView)
├── WorkflowCanvas (shared by both surfaces, but props differ)
│   ├── ReactFlow
│   │   ├── TriggerNode         (custom node: schedule, webhook, event)
│   │   ├── SkillNode           (custom node: runs a skill)
│   │   ├── ConditionNode       (custom node: if/else branch)
│   │   ├── ActionNode          (custom node: send notification, post journal)
│   │   └── LoopNode            (custom node: iterate)
│   ├── StepLibraryPanel        (left sidebar — admin only)
│   ├── PropertiesPanel         (right sidebar — admin only)
│   ├── JsonEditor              (Raw JSON mode toggle)
│   └── SimulationPreview       (dry-run results modal)
├── AccountantView
│   ├── TemplateGallery         (predefined workflow templates)
│   ├── WorkflowCardList        (active/paused toggle per workflow)
│   └── ReviewQueuePanel        (pending review items)
└── AdminView
    ├── TenantSelector           (scope to tenant)
    ├── WorkflowList             (full CRUD, search, filter)
    ├── ExecutionHistoryPanel    (per-workflow, paginated)
    └── WorkflowPoliciesTab      (auto-approval threshold, autonomy level, kill switch)
```

### 3.2 Node Types & Configs

```typescript
// apps/web/src/features/automation-studio/nodes/types.ts
export type WorkflowNodeType =
  'trigger' | 'skill' | 'condition' | 'action' | 'loop'

export interface WorkflowNodeData {
  type: WorkflowNodeType
  label: string
  config: Record<string, unknown>
  // Skill-specific
  skillId?: string
  skillVersion?: string
  // Condition-specific
  conditionField?: string
  conditionOperator?: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'regex'
  conditionValue?: string
  // Action-specific
  actionType?: ActionType
  // Loop-specific
  loopMaxIterations?: number
  loopCollectionRef?: string
}
```

### 3.3 Step Library

The step library maps 1:1 with the existing `actionTypeEnum` in the schema:

| Category           | Steps                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **SUNAT**          | `check_sire` — Verifica estado en SIRE, `sire_readiness` — Evalúa preparación |
| **Reconciliation** | `bank_reconciliation`, `ledger_match`                                         |
| **Invoicing**      | `invoice_processing`, `receipt_validation`                                    |
| **Notifications**  | `send_email`, `send_alert`                                                    |
| **Custom**         | `call_webhook`, `execute_skill`                                               |

Step definitions come from `GET /api/automation-studio/steps/library` (existing API, extended).

### 3.4 Accountant View

**Minimalist UI for non-technical users:**

```
┌──────────────────────────────────────────────────────┐
│  Automatizaciones                    [Cola de Revisión]│
├──────────────────────────────────────────────────────┤
│                                                       │
│  Templates                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ SUNAT Daily  │ │ Bank Recon   │ │ Invoice      │  │
│  │ Check        │ │ Monthly      │ │ Processing   │  │
│  │ [Activar]    │ │ [Activar]    │ │ [Activar]    │  │
│  └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                       │
│  Mis Automatizaciones                                 │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 🔵 SUNAT Daily Check         Activo      [⏸️]   │ │
│  │ 🔴 Bank Reconciliation       Pausado     [▶️]   │ │
│  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Key constraints:**

- No raw JSON, no step config, no node editing
- Single-click activate/deactivate
- Templates are pre-built workflows saved by admins with `isTemplate: true`
- Review queue: items from workflows that produced `flag_for_review` actions

### 3.5 Admin View

Full-control surface with the same API endpoints. Adds:

- **Visual canvas** with drag-and-drop from step library
- **Raw JSON toggle** — edits the workflow definition directly
- **Simulation**: dry-run that validates schema, resolves skill refs, returns estimated steps/errors. Zero side effects.
- **Tenant selector**: scope all views to a specific tenant/RUC
- **Policy tab per workflow**: auto-approval threshold, autonomy level, escalation contact, kill-switch condition

### 3.6 Integration with ai-swarm Runtime

When a workflow is triggered (schedule, webhook, manual):

```
1. API: POST /api/automation-studio/workflows/:id/execute
2. AutomationStudioService creates execution record (status: running)
3. For each step in stepOrder:
   a. If stepType === "action" and actionType === "execute_skill":
      → skillRegistry.invoke(skillId, step.config.input, { traceId, organizationId })
   b. If stepType === "condition":
      → evaluate condition → branch or skip
   c. If stepType === "action" and actionType is direct:
      → AutomationStudioService performs the action
4. Control-plane evaluates at each decision gate
5. Decision audit trail records every skill invocation
6. Execution status updated (success / partial / failed)
```

```typescript
// apps/api/src/features/automation-studio/workflow-executor.service.ts (NEW)
export class WorkflowExecutorService {
  constructor(
    private readonly skillRegistry: SkillRegistry,
    private readonly controlPlane: ContextEvaluationService,
    private readonly auditService: DecisionAuditService
  ) {}

  async execute(
    workflowId: string,
    triggeredBy: string
  ): Promise<ExecutionResult> {
    // 1. Load workflow with steps
    // 2. Create execution record
    // 3. For each step in order:
    //    - Evaluate control-plane gate before step
    //    - Execute step (skill invoke or direct action)
    //    - Record audit trail
    // 4. Update execution status
  }
}
```

---

## 4. Skills Editor (Phase 3)

### 4.1 Unification Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Skills Editor UI                  │
│  (Admin: full editor | Accountant: browse+activate) │
└───────────────────────┬─────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
┌──────────────────┐      ┌──────────────────────┐
│  Skills API       │      │  Skill Registry       │
│  /api/skills/*    │◄────►│  (ai-swarm/skills/)   │
│  CRUD + catalog   │      │  Runtime invoke       │
└────────┬─────────┘      └──────────┬────────────┘
         │                           │
         │    ┌──────────────────────┘
         ▼    ▼
┌──────────────────┐
│  skills_* tables  │
│  (Persistence)    │
└──────────────────┘
```

**Unification strategy:** The runtime `SkillRegistry` (in-memory, populated at startup) becomes the canonical source for skill execution. The skills API and database become the persistence layer for editor-created skills. On startup:

1. Hardcoded SUNAT skills (`sire-readiness`, `adversarial-audit`, `knowledge-retrieval`) are seeded into DB as "System" skills
2. Editor-created skills are loaded from DB into the runtime registry
3. `skillRegistry.discover()` returns the union of both

**New Drizzle schema:**

```typescript
// packages/persistence/src/schema/skills.schema.ts (NEW)

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 20 }).notNull(), // sunat, pcge, banking, audit, ocr
  handlerType: varchar('handler_type', { length: 20 }).notNull(), // deterministic, llm-chain, hybrid
  requiresLLM: boolean('requires_llm').default(false).notNull(),
  tools: jsonb('tools').$type<string[]>().default([]).notNull(),
  isSystem: boolean('is_system').default(false).notNull(),
  createdBy: uuid('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const skillVersions = pgTable(
  'skill_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skillId: uuid('skill_id')
      .references(() => skills.id, { onDelete: 'cascade' })
      .notNull(),
    version: varchar('version', { length: 20 }).notNull(), // semver: 1.0.0
    inputSchema: jsonb('input_schema').notNull(),
    outputSchema: jsonb('output_schema').notNull(),
    changelog: text('changelog'),
    publishedAt: timestamp('published_at').defaultNow().notNull(),
  },
  (table) => ({
    skillVersionUnique: uniqueIndex('skill_version_unique').on(
      table.skillId,
      table.version
    ),
    skillLatestIdx: index('skill_versions_skill_idx').on(
      table.skillId,
      table.publishedAt
    ),
  })
)

export const tenantSkillConfigs = pgTable(
  'tenant_skill_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    skillId: uuid('skill_id')
      .references(() => skills.id, { onDelete: 'cascade' })
      .notNull(),
    tenantId: uuid('tenant_id').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    defaultInput: jsonb('default_input')
      .$type<Record<string, unknown>>()
      .default({}),
    budgetLimit: integer('budget_limit'), // max USD cents per invocation
    modelPreference: varchar('model_preference', { length: 50 }),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tenantSkillUnique: uniqueIndex('tenant_skill_unique').on(
      table.skillId,
      table.tenantId
    ),
  })
)
```

### 4.2 Version Resolution

```typescript
// packages/domain/src/skill-versioning.ts

export function resolveSkillVersion(
  constraint: string, // "^1.0.0", "~1.5.2", "1.0.0" (exact)
  availableVersions: string[]
): string | null {
  // Parse semver constraint
  // Return highest matching version or null
}

// Breaking change detection:
export function isBreakingChange(
  oldInputSchema: JsonSchema,
  newInputSchema: JsonSchema
): boolean {
  // Check: required fields added? field types changed? enums narrowed?
  // Returns true if backward-incompatible
}
```

### 4.3 Accountant Skills Surface

Same pattern as the accountant automation view:

- Grid of skill cards with plain-language descriptions
- Enable/disable toggle per skill per tenant
- Category filter (same categories as `SkillCategory`)
- No technical details (no schemas, no versions, no handler types)

---

## 5. Policy Studio (Phase 3)

### 5.1 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Policy Studio UI                        │
│  ┌─────────────────────┐  ┌────────────────────────────┐ │
│  │ Rule Builder         │  │ Impact Preview             │ │
│  │ condition → action   │  │ affected workflows/tenants │ │
│  └─────────┬───────────┘  └────────────┬───────────────┘ │
│            │                           │                  │
│  ┌─────────┴───────────────────────────┴───────────────┐ │
│  │              Policy Templates                         │ │
│  │  High-Autonomy Gate | Compliance Mandatory | ...     │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                Policy API (/api/policies)                  │
│  CRUD + preview + evaluate                                │
└────────────────────────┬─────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────┐          ┌──────────────────────┐
│  policies table   │          │  Control-Plane Gate  │
│  (DB, Drizzle)    │          │  context-policy      │
│                   │          │  .service.ts         │
└──────────────────┘          └──────────────────────┘
                                        │
                          Runtime evaluation order:
                          1. DB policies (active, matching scope)
                          2. Hardcoded defaults (fallback)
```

### 5.2 Drizzle Schema

```typescript
// packages/persistence/src/schema/policies.schema.ts (NEW)

export const policyScopeEnum = ['global', 'tenant', 'workflow'] as const
export const policyActionEnum = [
  'require_approval',
  'block',
  'log_only',
  'escalate',
] as const

export const policies = pgTable(
  'policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    scope: varchar('scope', { length: 10 }).$type<PolicyScope>().notNull(),
    scopeTarget: varchar('scope_target', { length: 255 }), // tenantId or workflowId
    rules: jsonb('rules').$type<PolicyRule[]>().notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    priority: integer('priority').default(0).notNull(), // Higher = evaluated first
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    scopeIdx: index('policies_scope_idx').on(table.scope, table.scopeTarget),
    enabledIdx: index('policies_enabled_idx').on(table.enabled),
  })
)

export interface PolicyRule {
  condition: {
    field: string // "confidence", "autonomy_level", "action_type", "amount"...
    operator: string // "<", ">", "==", "!=", "in", "contains"
    value: unknown
  }
  action: PolicyAction
  actionConfig?: Record<string, unknown>
}
```

### 5.3 Migration Strategy: Hardcoded → DB

The existing `context-policy.service.ts` has hardcoded policies. Migration:

1. **Phase 3 migration**: Read hardcoded policies → INSERT into `policies` table as seed data
2. **Runtime:** `ContextPolicyService` loads from DB first, falls back to hardcoded defaults if DB unreachable
3. **Gradual cutover**: Feature flag `POLICY_DB_BACKED` controls which source is authoritative

```typescript
// apps/api/src/features/ai-swarm/context-control-plane/context-policy.service.ts (MODIFIED)

export class ContextPolicyService {
  async evaluatePolicy(question: PolicyQuestion): Promise<PolicyAnswer> {
    // 1. Try DB-backed policies
    if (await isFeatureEnabled('POLICY_DB_BACKED', question.tenantId)) {
      const dbPolicies = await this.policyRepo.findActive({
        scope: question.surface,
        tenantId: question.tenantId,
      })
      const dbResult = this.evaluateRules(dbPolicies, question)
      if (dbResult) return dbResult
    }

    // 2. Fall back to hardcoded defaults
    return this.evaluateHardcodedPolicies(question)
  }
}
```

### 5.4 Policy Preview

`POST /api/policies/:id/preview` runs the policy rules against recent historical decisions (last 30 days, sampled) and reports:

- How many past decisions would have been affected
- Per-tenant breakdown
- Sample decisions that would match each rule

This is a read-only query — no state mutation.

---

## 6. Studio Admin Panel (Phase 4)

### 6.1 Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Studio Admin Panel                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │
│  │Tenants   │Analytics │Audit Logs│Users     │Feature   │ │
│  │Config    │Dashboard │          │Management│Flags     │ │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │
├────────────────────────────────────────────────────────────┤
│                    /api/admin/*                             │
│  GET/PUT /tenants/:id/config                               │
│  GET /analytics/usage    GET /analytics/global             │
│  GET /audit-logs                                            │
│  GET/POST/PUT/DELETE /tenants/:id/users                     │
│  GET/PUT /feature-flags                                     │
└────────────────────────────────────────────────────────────┘
```

### 6.2 New Drizzle Schemas

```typescript
// packages/persistence/src/schema/studio-admin.schema.ts (NEW)

// ─── Audit Logs (immutable, append-only) ───
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: uuid('user_id').notNull(),
    action: varchar('action', { length: 100 }).notNull(), // "workflow.create", "skill.publish"
    resourceId: uuid('resource_id'),
    resourceType: varchar('resource_type', { length: 50 }), // "workflow", "skill", "policy", "user"
    payload: jsonb('payload').$type<Record<string, unknown>>(), // JSON diff
    ipAddress: varchar('ip_address', { length: 45 }),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (table) => ({
    tenantTimeIdx: index('audit_logs_tenant_time_idx').on(
      table.tenantId,
      table.timestamp
    ),
    userIdx: index('audit_logs_user_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    resourceIdx: index('audit_logs_resource_idx').on(
      table.resourceType,
      table.resourceId
    ),
  })
)

// ─── Feature Flags (DB-backed, extends packages/shared) ───
export const featureFlagOverrides = pgTable(
  'feature_flag_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    flagName: varchar('flag_name', { length: 100 }).notNull(),
    enabled: boolean('enabled').notNull(),
    tenantId: uuid('tenant_id'), // null = global override
    updatedBy: uuid('updated_by'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    flagTenantUnique: uniqueIndex('feature_flag_tenant_unique').on(
      table.flagName,
      table.tenantId
    ),
  })
)
```

**Feature flag resolution order:**

```
1. Check DB overrides (tenant-specific first, then global)
2. Fall back to getFeatureFlag(flag, tenant.subscriptionTier) from shared/
```

### 6.3 Usage Analytics

Analytics are derived from existing execution data:

```
agent runs     ← ai_trace_evidence
workflow execs ← automation_executions
skill invocs   ← ai_trace_evidence (decision_type = "skill_invoke")
cost estimates ← budget_tracker (ai-swarm/tools/)
error rates    ← automation_executions (status = "failed") + agent metrics
```

No new data collection tables. The analytics service queries existing tables with aggregation:

```typescript
// apps/api/src/features/studio-admin/analytics.service.ts (NEW)
export class AnalyticsService {
  async getUsageAnalytics(params: {
    tenantId?: string
    from: Date
    to: Date
    granularity: 'day' | 'week' | 'month'
  }): Promise<UsageAnalytics> {
    // Aggregate from ai_trace_evidence + automation_executions
  }

  async getGlobalAnalytics(params: {
    from: Date
    to: Date
  }): Promise<GlobalAnalytics> {
    // Cross-tenant aggregation
  }
}
```

---

## 7. Frontend Route Architecture

### 7.1 Route Tree (TanStack Router)

```
/studio                              → StudioLayout (role gate)
├── /studio/automations               → AccountantView | AdminAutomationView
│   ├── /studio/automations/:id       → WorkflowDetailView (admin)
│   └── /studio/automations/:id/edit  → WorkflowCanvas (admin)
├── /studio/skills                    → AccountantSkillView | AdminSkillEditor
│   ├── /studio/skills/new            → SkillCreatePage (admin)
│   └── /studio/skills/:id            → SkillDetailPage (admin)
├── /studio/policies                  → AccountantPolicyView | PolicyStudioPage
│   ├── /studio/policies/new          → PolicyCreatePage (admin)
│   └── /studio/policies/:id          → PolicyEditPage (admin)
├── /studio/review-queue              → ReviewQueuePage (accountant)
└── /studio/admin                     → AdminLayout (admin only)
    ├── /studio/admin/tenants         → TenantConfigPage
    ├── /studio/admin/analytics       → AnalyticsDashboard
    ├── /studio/admin/audit-logs      → AuditLogsPage
    ├── /studio/admin/users           → UserManagementPage
    └── /studio/admin/feature-flags   → FeatureFlagPage
```

**Route files created (Phase 2-4):**

```
apps/web/src/routes/studio/
├── index.tsx                          # Redirect based on role
├── automations.tsx
├── automations.$id.tsx
├── automations.$id.edit.tsx
├── skills.tsx
├── skills.new.tsx
├── skills.$id.tsx
├── policies.tsx
├── policies.new.tsx
├── policies.$id.tsx
├── review-queue.tsx
└── admin/
    ├── index.tsx
    ├── tenants.tsx
    ├── analytics.tsx
    ├── audit-logs.tsx
    ├── users.tsx
    └── feature-flags.tsx
```

### 7.2 Role-Based Rendering

```typescript
// apps/web/src/features/studio/components/RoleGate.tsx (NEW)
export function RoleGate({
  accountant,
  admin,
}: {
  accountant: ReactNode
  admin: ReactNode
}) {
  const { role } = useSession() // from Better Auth
  return role === 'admin' ? admin : accountant
}
```

No backend role branching on API responses. Both roles call the same endpoints. The frontend gate controls which components render.

### 7.3 Route Protection

```typescript
// apps/web/src/routes/studio/admin/index.tsx
export const Route = createFileRoute('/studio/admin')({
  beforeLoad: ({ context }) => {
    if (context.session?.role !== 'admin') {
      throw redirect({ to: '/studio' })
    }
  },
  component: AdminDashboardPage,
})
```

---

## 8. Existing Routes & Feature Integration

### 8.1 Routes That Get Updated

| Current Route               | Action                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `/drenyra/skills`           | Becomes `/studio/skills` (redirect). The existing skills page content moves to the accountant view. |
| `/automations`              | Becomes `/studio/automations` (redirect). The existing automations page moves to the admin view.    |
| `/drenyra/automatizaciones` | Redirect to `/studio/automations`                                                                   |
| `/review-queue`             | Becomes `/studio/review-queue` (already redirects to control-tower; change target)                  |

### 8.2 What Stays Unchanged

- `apps/api/src/features/automation-studio/` — API routes consumed as-is, extended with new endpoints
- `apps/api/src/features/skills/` — consumed as-is, extended with version endpoints
- `apps/api/src/features/ai-swarm/` — formalized in Phase 1, no behavior changes
- `packages/shared/src/feature-flags.ts` — kept as the core feature flag engine, DB layer wraps it

---

## 9. Testing Strategy

### Phase 1

| Test type         | Target                                | Count | Notes                                                   |
| ----------------- | ------------------------------------- | ----- | ------------------------------------------------------- |
| Existing suite    | ai-swarm 56 tests                     | Pass  | No modification; validates no-behavior-change guarantee |
| Contract tests    | New Zod schemas in `packages/domain/` | ~10   | Test schema validation, error messages                  |
| Audit trail tests | `DecisionAuditService`                | ~5    | Test recording and querying decisions                   |

### Phase 2

| Test type         | Target                                             | Count | Notes                 |
| ----------------- | -------------------------------------------------- | ----- | --------------------- |
| Component tests   | `WorkflowCanvas`, `StepLibrary`, `PropertiesPanel` | ~15   | React Testing Library |
| Integration tests | Workflow execution via ai-swarm                    | ~8    | Mock skill registry   |
| E2E               | Accountant creates template workflow               | ~3    | Playwright            |

### Phase 3

| Test type         | Target                                     | Count | Notes                  |
| ----------------- | ------------------------------------------ | ----- | ---------------------- |
| API tests         | Skills CRUD + version publish              | ~20   | Bring coverage to ≥80% |
| Component tests   | Skill editor, policy builder               | ~12   |                        |
| Integration tests | Skill editor → runtime registry            | ~5    |                        |
| Unit tests        | Version resolution (`resolveSkillVersion`) | ~8    |                        |

### Phase 4

| Test type         | Target                               | Count | Notes                         |
| ----------------- | ------------------------------------ | ----- | ----------------------------- |
| API tests         | Admin CRUD endpoints                 | ~15   |                               |
| Component tests   | Analytics dashboard, user management | ~8    |                               |
| Integration tests | Feature flag resolution chain        | ~5    | DB override → shared fallback |

---

## 10. File Change Map

### New Files by Phase

#### Phase 1 (~15 files)

```
packages/domain/src/
├── agent-orchestrator.contract.ts          # Contract 1
├── control-plane-worker.contract.ts        # Contract 2
├── skill-registry.contract.ts              # Contract 3
└── governance.contract.ts                  # Contract 4

docs/architecture/ai-swarm/
├── architecture.md                         # Module map + ADRs
├── boundary-audit.md                       # Flagged crossings
└── data-flow.md                            # Data flow diagram (mermaid)

apps/api/src/features/ai-swarm/governance/
└── decision-audit.service.ts               # Audit trail service

packages/persistence/src/schema/
└── (migration) ai_trace_evidence decision fields
```

#### Phase 2 (~25 files)

```
apps/web/src/features/automation-studio/
├── components/
│   ├── WorkflowCanvas.tsx                  # ReactFlow wrapper
│   ├── StepLibraryPanel.tsx                # Left sidebar
│   ├── PropertiesPanel.tsx                 # Right sidebar
│   ├── JsonEditor.tsx                      # Raw JSON mode
│   ├── SimulationPreview.tsx               # Dry-run results
│   └── ReviewQueuePanel.tsx               # Pending review items
├── nodes/
│   ├── TriggerNode.tsx
│   ├── SkillNode.tsx
│   ├── ConditionNode.tsx
│   ├── ActionNode.tsx
│   └── LoopNode.tsx
├── views/
│   ├── AccountantAutomationView.tsx        # Simplified view
│   └── AdminAutomationView.tsx             # Full-control view
├── hooks/
│   ├── useWorkflowCanvas.ts
│   ├── useStepLibrary.ts
│   └── useExecutionHistory.ts
└── types.ts

apps/web/src/routes/studio/
├── automations.tsx
├── automations.$id.tsx
├── automations.$id.edit.tsx
└── review-queue.tsx

apps/api/src/features/automation-studio/
└── workflow-executor.service.ts            # Runtime execution
```

#### Phase 3 (~20 files)

```
apps/web/src/features/skills-editor/
├── components/
│   ├── SkillForm.tsx
│   ├── SchemaEditor.tsx                    # JSON Schema editor
│   ├── VersionHistory.tsx
│   └── TenantSkillConfig.tsx
├── views/
│   ├── AccountantSkillView.tsx
│   └── AdminSkillEditor.tsx
└── hooks/
    └── useSkillEditor.ts

apps/web/src/features/policy-studio/
├── components/
│   ├── RuleBuilder.tsx
│   ├── ConditionBuilder.tsx
│   ├── ActionSelector.tsx
│   ├── ImpactPreview.tsx
│   └── PolicyTemplates.tsx
├── views/
│   ├── AccountantPolicyView.tsx
│   └── PolicyStudioPage.tsx
└── hooks/
    └── usePolicyEditor.ts

packages/persistence/src/schema/
├── skills.schema.ts
└── policies.schema.ts

packages/domain/src/
└── skill-versioning.ts
```

#### Phase 4 (~15 files)

```
apps/web/src/features/studio-admin/
├── components/
│   ├── TenantConfigPanel.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── AuditLogsTable.tsx
│   ├── UserManagementTable.tsx
│   └── FeatureFlagManager.tsx
├── hooks/
│   ├── useAnalytics.ts
│   ├── useAuditLogs.ts
│   └── useFeatureFlags.ts
└── views/
    └── StudioAdminLayout.tsx

apps/web/src/routes/studio/admin/
├── index.tsx
├── tenants.tsx
├── analytics.tsx
├── audit-logs.tsx
├── users.tsx
└── feature-flags.tsx

packages/persistence/src/schema/
└── studio-admin.schema.ts

apps/api/src/features/studio-admin/
├── analytics.service.ts
├── audit-log.service.ts
└── admin.routes.ts
```

---

## 11. Rollout & Feature Flags

| Phase   | Feature Flag                                 | Scope               | Default               |
| ------- | -------------------------------------------- | ------------------- | --------------------- |
| Phase 1 | (none — docs + contracts are always visible) | N/A                 | N/A                   |
| Phase 2 | `AUTOMATION_STUDIO`                          | Per tenant          | `false`               |
| Phase 3 | `SKILLS_EDITOR`, `POLICY_STUDIO`             | Per tenant          | `false`               |
| Phase 4 | `STUDIO_ADMIN`                               | Global (admin only) | `true` for ENTERPRISE |

**Gradual rollout sequence:**

```
Phase 1 → Deploy docs + contracts (no flag needed)
Phase 2 → Enable AUTOMATION_STUDIO for canary tenant → expand to all
Phase 3 → Enable SKILLS_EDITOR + POLICY_STUDIO for canary → expand
Phase 4 → Enable STUDIO_ADMIN (ENTERPRISE only)
```

---

## 12. Open Decisions Resolved

| Question from Proposal                    | Design Decision                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Workflow canvas library?                  | `@xyflow/react` v12+ — React 19 compatible, custom nodes, TypeScript-first                    |
| DB vs file for policies?                  | DB (Drizzle) with seeded hardcoded defaults; runtime fallback for zero-downtime               |
| Audit trail: fiscal evidence vs separate? | Extends existing `ai_trace_evidence` table with decision-specific columns                     |
| Roles: Better Auth or internal?           | Better Auth roles extended with `accountant` and `admin`; frontend gate, no backend branching |
| Skill versioning: semver?                 | Semver with caret/tilde range resolution; breaking change detection on publish                |
| Feature flags to DB?                      | Wrapping layer — DB overrides on top of `packages/shared/src/feature-flags.ts`                |

---

## 13. Risk Mitigation

| Risk                                   | Mitigation in Design                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Boundary audit discovers deep coupling | Phase 1 scoped to document + audit; refactors only where risk is LOW. No behavior changes.               |
| Workflow canvas UX complexity          | Templates cover 80% of accountant use cases. Canvas complex mode is admin-only.                          |
| Skill registry dual-source             | Startup-time unification: DB skills loaded into runtime `SkillRegistry`. One `discover()` returns union. |
| 0 tests on skills API                  | Phase 3 includes test coverage target of ≥80% before building editor.                                    |
| Feature flag granularity               | Phase 4 adds DB-backed per-tenant overrides; shared module still works standalone.                       |
| Chained PR coordination                | Phase 1 is independent. Phase 2-4 stack on each other. Each phase merges to main before next starts.     |

---

## 14. Diagram: Complete Data Flow (Studio → Runtime)

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Drenyra Studio (Browser)                      │
│                                                                       │
│  Accountant                 Admin                                     │
│  ┌─────────────┐           ┌──────────────────────────────────┐     │
│  │Templates    │           │WorkflowCanvas  PolicyStudio       │     │
│  │On/Off toggle│           │SkillsEditor    AdminPanel         │     │
│  │Review Queue │           │TenantSelector  FeatureFlags       │     │
│  └──────┬──────┘           └────────────────┬─────────────────┘     │
│         │                                   │                        │
└─────────┼───────────────────────────────────┼────────────────────────┘
          │          HTTPS (TanStack Query)    │
          ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Studio API (ElysiaJS)                          │
│                                                                      │
│  /api/automation-studio/*    /api/skills/*    /api/policies/*       │
│  /api/admin/*                                                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│WorkflowExecutor │  │ SkillRegistry   │  │ContextPolicy    │
│Service          │  │ (Runtime)       │  │Service          │
│                 │  │                 │  │                 │
│Execute steps    │  │register()       │  │evaluatePolicy() │
│in order         │  │invoke()         │  │                 │
│                 │  │discover()       │  │DB-first,        │
│                 │  │getAgentContext()│  │hardcoded-fallback│
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DecisionAuditService                             │
│  recordDecision(traceId, agentId, policyId, evidenceHash, ...)      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Persistence (PostgreSQL)                          │
│                                                                      │
│  automation_workflows    skills         policies                    │
│  automation_steps        skill_versions  audit_logs                  │
│  automation_executions   tenant_configs  feature_flag_overrides      │
│  ai_trace_evidence       (extended)                                  │
└─────────────────────────────────────────────────────────────────────┘
```
