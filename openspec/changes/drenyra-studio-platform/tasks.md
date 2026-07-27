# Drenyra Studio Platform — Implementation Tasks

**Change:** `drenyra-studio-platform`
**Based on:** Spec v2026-07-23 + Design v2026-07-26
**Test runner:** vitest (unit/integration), Playwright (E2E)
**Strict TDD:** enabled — RED → GREEN → TRIANGULATE → REFACTOR per task

---

## Review Workload Forecast

| Field                   | Value                                                         |
| ----------------------- | ------------------------------------------------------------- |
| Estimated changed lines | ~2500 (500 + 800 + 700 + 500 across 4 PRs)                    |
| 400-line budget risk    | High                                                          |
| Chained PRs recommended | Yes                                                           |
| Suggested split         | PR1 (Phase 1) → PR2 (Phase 2) → PR3 (Phase 3) → PR4 (Phase 4) |
| Delivery strategy       | auto-chain                                                    |
| Chain strategy          | stacked-to-main                                               |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

---

## Chain Overview

```
PR #1: Phase 1 — Agent Runtime Formalization      (~500 lines, ~20 files)
PR #2: Phase 2 — Automation Studio Builder         (~800 lines, ~28 files)
PR #3: Phase 3 — Skills Editor + Policy Studio     (~700 lines, ~23 files)
PR #4: Phase 4 — Studio Admin Panel                 (~500 lines, ~17 files)
```

Each PR must merge to `main` before the next begins. Every PR is independently testable and reviewable.

---

## PR #1: Phase 1 — Agent Runtime Formalization

**Goal:** Architecture docs, Zod contracts, boundary audit, decision audit trail, boundary-correcting refactors. Zero behavior changes. Verify: 56 existing ai-swarm tests pass.

**Estimated:** ~500 lines, ~20 files (15 new + 5 modified)

---

### 1.1 — Architecture Document

- [ ] Create `docs/architecture/ai-swarm/architecture.md` with module inventory (agents, orchestrator, context-control-plane, api, workers, observability, skills, governance), data-flow diagram (Mermaid), and 4 ADRs (agent orchestration model, control-plane placement, skill registry design, governance boundary). <!-- sdd-owner: implementation -->
- [ ] Create `docs/architecture/ai-swarm/data-flow.md` with request ingress → API routes → orchestrator → agent execution → control-plane evaluation → worker dispatch flow diagram in Mermaid. <!-- sdd-owner: implementation -->
- [ ] Verify every `apps/api/src/features/ai-swarm/` source file can be traced to its owning module via `architecture.md`. Spot-check 5 files across different modules. <!-- sdd-owner: implementation -->

### 1.2 — Module Contracts (packages/domain/)

- [ ] **RED.** Create contract test file `packages/domain/src/__tests__/contracts.test.ts` with failing schema tests for all 4 contracts. Validate that missing fields produce Zod errors, valid payloads parse correctly, and error codes match expected values. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `packages/domain/src/agent-orchestrator.contract.ts` — `AgentInputSchema`, `AgentOutputSchema`, `AgentErrorSchema` per design §2.3 Contract 1. Export `AgentInput`, `AgentOutput`, `AgentError` types. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `packages/domain/src/control-plane-worker.contract.ts` — `ControlEvaluationPayloadSchema` per design §2.3 Contract 2. Export `ControlEvaluationPayload` type. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `packages/domain/src/skill-registry.contract.ts` — `SkillDefinitionSchema`, `SkillInvocationSchema` per design §2.3 Contract 3. Export `SkillDefinition`, `SkillInvocation` types. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `packages/domain/src/governance.contract.ts` — `PolicyQuestionSchema`, `PolicyAnswerSchema` per design §2.3 Contract 4. Export `PolicyQuestion`, `PolicyAnswer` types. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Add `packages/domain/src/index.ts` barrel export for all 4 contracts. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE.** Run contract tests (`vitest run packages/domain`), verify all pass. Add edge-case tests: empty tools array, min/max confidence boundaries, missing required fields for each schema. <!-- sdd-owner: implementation -->

### 1.3 — Boundary Audit

- [ ] Create `docs/architecture/ai-swarm/boundary-audit.md` with a full audit table. Scan `apps/api/src/features/ai-swarm/` and `packages/drenyra-orchestrator/src/` for cross-boundary imports. For each crossing, record: file path, what crosses, risk level (low/medium/high), and recommended action (move / extract-shared / document-as-intentional). Include the 4 pre-analyzed findings from design §2.5. <!-- sdd-owner: implementation -->
- [ ] Verify no file is missed: run `grep -r "drenyra-orchestrator" apps/api/src/features/ai-swarm/` and `grep -r "ai-swarm" packages/drenyra-orchestrator/src/` and cross-check results against the audit table. <!-- sdd-owner: implementation -->

### 1.4 — Agent Decision Audit Trail

- [ ] **RED.** Create test file `apps/api/src/features/ai-swarm/governance/__tests__/decision-audit.test.ts`. Test: records decision with all fields, queries by traceId, queries by tenant+time window, queries by policyId, rejects duplicate traceId+agentId pair. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/api/src/features/ai-swarm/governance/decision-audit.service.ts` — `DecisionAuditService` with `recordDecision()` and `query()` methods per design §2.4. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create Drizzle migration adding columns to `ai_trace_evidence`: `decision_type VARCHAR(50)`, `policy_id VARCHAR(255)`, `evidence_hash VARCHAR(64)`, `confidence DECIMAL(3,2)`, `decision_payload JSONB`. Add indexes: `idx_trace_evidence_agent` on `(trace_id, agent_id)`, `idx_trace_evidence_tenant_time` on `((tenant_scope->>'tenantId'), created_at)`. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE.** Run decision-audit tests, verify all pass. Add edge-case: null decision_payload, max-length decision_type, confidence 0.00 and 1.00. <!-- sdd-owner: implementation -->

### 1.5 — Boundary-Correcting Refactors

- [ ] Move shared governance types: if `packages/shared/src/autonomy-policy.ts` exists with types used by both ai-swarm and API routes, extract domain types into `packages/domain/src/governance.contract.ts` (if not already done in 1.2). Re-export from shared for backward compatibility. <!-- sdd-owner: implementation -->
- [ ] Instrument `ContextEvaluationService.evaluate()` in `apps/api/src/features/ai-swarm/context-control-plane/context-evaluation.service.ts` to call `DecisionAuditService.recordDecision()` after evaluation. No behavior change — audit recording is fire-and-forget. <!-- sdd-owner: implementation -->
- [ ] Instrument `SkillRegistry.invoke()` in `apps/api/src/features/ai-swarm/skills/skill-registry.ts` to call `DecisionAuditService.recordDecision()` after skill execution. No behavior change. <!-- sdd-owner: implementation -->
- [ ] Run full ai-swarm test suite: `cd apps/api && npx vitest run --reporter=verbose` — verify all 56 existing tests pass (green). If any test fails, revert the instrumentation to additive-only pattern (try/catch with silent failure). <!-- sdd-owner: implementation -->

### 1.6 — Phase 1 Verification & Gate

- [ ] Run `cd packages/domain && npx vitest run` — all contract tests pass. <!-- sdd-owner: implementation -->
- [ ] Run `cd apps/api && npx vitest run src/features/ai-swarm` — all 56 existing tests pass, plus new decision-audit tests. <!-- sdd-owner: implementation -->
- [ ] Verify `docs/architecture/ai-swarm/architecture.md`, `boundary-audit.md`, and `data-flow.md` exist and are readable. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for PR #1 diff. <!-- sdd-owner: parent -->
- [ ] Merge PR #1 to main before starting PR #2. <!-- sdd-owner: parent -->

---

## PR #2: Phase 2 — Automation Studio Builder

**Goal:** Visual workflow canvas (`@xyflow/react`), dual-role surfaces (accountant simplified + admin full-control), workflow execution integration.

**Prerequisite:** PR #1 merged to main.

**Estimated:** ~800 lines, ~28 files (25 new + 3 modified)

---

### 2.1 — Dependency Setup

- [ ] Install `@xyflow/react` v12+ in `apps/web`: `cd apps/web && bun add @xyflow/react`. Verify React 19 compatibility. <!-- sdd-owner: implementation -->
- [ ] Create `apps/web/src/features/automation-studio/types.ts` with `WorkflowNodeType`, `WorkflowNodeData`, `StepLibraryCategory`, `StepLibraryItem` types matching design §3.2. <!-- sdd-owner: implementation -->

### 2.2 — Workflow Canvas Core

- [ ] **RED.** Create test file `apps/web/src/features/automation-studio/__tests__/WorkflowCanvas.test.tsx`. Test: renders with empty flow, renders nodes from workflow data, detects invalid connections (self-loop, duplicate edge), fires onNodesChange callback. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/components/WorkflowCanvas.tsx` — wraps `<ReactFlow>` with `nodeTypes` for TriggerNode, SkillNode, ConditionNode, ActionNode, LoopNode. Implements `isValidConnection` to prevent invalid edges. Exposes `onSave` callback. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create custom node components: `apps/web/src/features/automation-studio/nodes/TriggerNode.tsx`, `SkillNode.tsx`, `ConditionNode.tsx`, `ActionNode.tsx`, `LoopNode.tsx`. Each renders its label, type icon, and config summary. ConditionNode shows branch labels (true/false). <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE.** Run WorkflowCanvas tests. Add edge-case tests: empty steps array, single-node workflow, max 50 nodes, rapid drag operations (debounce). <!-- sdd-owner: implementation -->

### 2.3 — Step Library & Properties Panel

- [ ] **RED.** Create test file `apps/web/src/features/automation-studio/__tests__/StepLibraryPanel.test.tsx`. Test: renders all 10 step types grouped by 5 categories, filters by category via click, filters by search text, marks selected step. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/components/StepLibraryPanel.tsx` — left sidebar with collapsible categories: SUNAT (check_sire, sire_readiness), Reconciliation (bank_reconciliation, ledger_match), Invoicing (invoice_processing, receipt_validation), Notifications (send_email, send_alert), Custom (call_webhook, execute_skill). Search input. Drag source for each step. Category filter reflected in URL search params. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/components/PropertiesPanel.tsx` — right sidebar showing selected node's config form. Fields adapt to node type: SkillNode shows skillId picker + version, ConditionNode shows field/operator/value, ActionNode shows actionType + config. <!-- sdd-owner: implementation -->

### 2.4 — JSON Editor & Simulation

- [ ] **RED.** Create test file `apps/web/src/features/automation-studio/__tests__/JsonEditor.test.tsx`. Test: renders workflow as formatted JSON, accepts valid edits and parses back, rejects invalid JSON with inline error highlight, toggling back to visual shows updated nodes. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/components/JsonEditor.tsx` — Monaco or CodeMirror JSON editor with Zod validation on blur. Invalid JSON prevents save and highlights the offending property. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/components/SimulationPreview.tsx` — modal that displays dry-run results: total estimated steps, missing skill references, schema validation errors per step. Zero side effects guaranteed (read-only validation). Triggered by "Simulate" button. <!-- sdd-owner: implementation -->

### 2.5 — Accountant View

- [ ] **RED.** Create test file `apps/web/src/features/automation-studio/__tests__/AccountantAutomationView.test.tsx`. Test: renders template gallery (≥3 templates), clicking "Use Template" creates workflow with pre-configured steps, toggle activates/deactivates workflow, review queue shows pending items with Approve/Reject/Re-run buttons. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/views/AccountantAutomationView.tsx` — renders TemplateGallery (SUNAT Daily Check, Bank Reconciliation Monthly, Invoice Processing), WorkflowCardList (active/paused toggle per workflow, green/gray states), and ReviewQueuePanel (results grouped by workflow, action buttons per item). No raw JSON, no step config, no node editing. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/components/ReviewQueuePanel.tsx` — lists pending review items from workflows that produced `flag_for_review` actions. Each item: workflow name, execution timestamp, result summary, action buttons (Approve, Reject, Re-run). Records accountant's decision with timestamp and user ID. <!-- sdd-owner: implementation -->

### 2.6 — Admin View

- [ ] **RED.** Create test file `apps/web/src/features/automation-studio/__tests__/AdminAutomationView.test.tsx`. Test: renders tenant selector, scopes workflow list to tenant, supports full CRUD, shows execution history per workflow, supports policy tab configuration. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/views/AdminAutomationView.tsx` — full-control surface: TenantSelector (scope to tenant/RUC), WorkflowList (full CRUD, search, filter by status/category), ExecutionHistoryPanel (per-workflow, paginated, with error counts and last-run status), WorkflowPoliciesTab (auto-approval threshold, autonomy level, escalation contact, kill-switch condition). <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/automation-studio/hooks/useWorkflowCanvas.ts`, `useStepLibrary.ts`, `useExecutionHistory.ts` — TanStack Query hooks for API interaction. <!-- sdd-owner: implementation -->

### 2.7 — Role Gate Component

- [ ] **RED.** Create test file `apps/web/src/features/studio/__tests__/RoleGate.test.tsx`. Test: renders accountant component for accountant role, renders admin component for admin role, renders nothing for unknown role. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio/components/RoleGate.tsx` — conditional render based on `useSession().role`. No backend role branching. <!-- sdd-owner: implementation -->

### 2.8 — Route Registration

- [ ] Create TanStack Router file routes: `apps/web/src/routes/studio/automations.tsx` (role-gated, renders AccountantAutomationView or AdminAutomationView), `apps/web/src/routes/studio/automations.$id.tsx`, `apps/web/src/routes/studio/automations.$id.edit.tsx` (admin-only gate in `beforeLoad`), `apps/web/src/routes/studio/review-queue.tsx`. <!-- sdd-owner: implementation -->
- [ ] Update existing routes: add redirect from `/drenyra/skills` → `/studio/skills`, `/automations` → `/studio/automations`, `/drenyra/automatizaciones` → `/studio/automations`, `/review-queue` → `/studio/review-queue`. <!-- sdd-owner: implementation -->

### 2.9 — Workflow Executor Service (API)

- [ ] **RED.** Create test file `apps/api/src/features/automation-studio/__tests__/workflow-executor.test.ts`. Test: loads workflow with steps, creates execution record (status: running), dispatches each step in order through skill registry, records audit trail per step, updates execution to success/failed. Mock SkillRegistry and DecisionAuditService. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/api/src/features/automation-studio/workflow-executor.service.ts` — `WorkflowExecutorService` with `execute(workflowId, triggeredBy)` method per design §3.6. Constructor injects `SkillRegistry`, `ContextEvaluationService`, `DecisionAuditService`. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Wire `POST /api/automation-studio/workflows/:id/execute` to `WorkflowExecutorService.execute()`. <!-- sdd-owner: implementation -->

### 2.10 — Phase 2 Verification & Gate

- [ ] Run `cd apps/web && npx vitest run src/features/automation-studio` — all component + hook tests pass. <!-- sdd-owner: implementation -->
- [ ] Run `cd apps/api && npx vitest run src/features/automation-studio` — workflow executor tests pass. <!-- sdd-owner: implementation -->
- [ ] Manual smoke test: accountant creates a 3-step workflow from template in <5 minutes. Admin edits visually and via raw JSON. Simulation runs without side effects. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review for PR #2 diff. <!-- sdd-owner: parent -->
- [ ] Merge PR #2 to main before starting PR #3. <!-- sdd-owner: parent -->

---

## PR #3: Phase 3 — Skills Editor + Policy Studio

**Goal:** Visual skills editor with semver versioning, catalog↔runtime unification, visual policy rule builder, DB-backed policies with hardcoded fallback.

**Prerequisite:** PR #2 merged to main.

**Estimated:** ~700 lines, ~23 files (20 new + 3 modified)

---

### 3.1 — Skills & Policies Database Schemas

- [ ] Create Drizzle migration for `skills` table per design §4.1: columns (id uuid PK, name, description, category, handler_type, requires_llm, tools jsonb, is_system, created_by, created_at, updated_at). <!-- sdd-owner: implementation -->
- [ ] Create Drizzle migration for `skill_versions` table: columns (id uuid PK, skill_id FK→skills, version semver, input_schema jsonb, output_schema jsonb, changelog, published_at). Unique constraint on `(skill_id, version)`. <!-- sdd-owner: implementation -->
- [ ] Create Drizzle migration for `tenant_skill_configs` table: columns (id uuid PK, skill_id FK→skills, tenant_id, enabled, default_input jsonb, budget_limit, model_preference, updated_at). Unique constraint on `(skill_id, tenant_id)`. <!-- sdd-owner: implementation -->
- [ ] Create Drizzle migration for `policies` table per design §5.2: columns (id uuid PK, name, description, scope, scope_target, rules jsonb, enabled, priority, created_by, created_at, updated_at). Indexes on `(scope, scope_target)` and `(enabled)`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/persistence/src/schema/skills.schema.ts` and `packages/persistence/src/schema/policies.schema.ts` with Drizzle table definitions + TypeScript types. <!-- sdd-owner: implementation -->
- [ ] **Seed:** Migrate the 3 hardcoded SUNAT skills (sire-readiness, adversarial-audit, knowledge-retrieval) into `skills` table as seed data with `is_system: true`. Migrate existing hardcoded policies from `context-policy.service.ts` into `policies` table as seed data. <!-- sdd-owner: implementation -->

### 3.2 — Skills API Extension

- [ ] **RED.** Create test file `apps/api/src/features/skills/__tests__/skills-api.test.ts`. Cover: list with category filter, detail with versions, create skill (admin), update metadata, publish new version, get tenant config, update tenant config. Target ≥80% coverage on skills API. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Extend `apps/api/src/features/skills/` routes: `POST /api/skills` (create), `PUT /api/skills/:id` (update metadata), `POST /api/skills/:id/versions` (publish version with breaking-change detection), `GET /api/skills/:id/tenants/:tenantId/config`, `PUT /api/skills/:id/tenants/:tenantId/config`. All admin-only via auth middleware. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `packages/domain/src/skill-versioning.ts` — `resolveSkillVersion(constraint, availableVersions)` using semver caret/tilde ranges, and `isBreakingChange(oldInputSchema, newInputSchema)` detecting added required fields, changed field types, narrowed enums. <!-- sdd-owner: implementation -->
- [ ] **TRIANGULATE.** Run skills API tests. Add edge-cases: publish duplicate version, breaking change detection warns for added required field, resolveSkillVersion with ^1.0.0 picks 1.9.9 over 2.0.0, exact pin to 1.0.0 ignores newer versions. <!-- sdd-owner: implementation -->

### 3.3 — Skill Registry Unification

- [ ] Modify `apps/api/src/features/ai-swarm/skills/skill-registry.ts` startup: load DB skills (non-system) into runtime `SkillRegistry`, merge with hardcoded system skills. `discover()` returns union. `invoke()` resolves version via `resolveSkillVersion` from workflow's pinned or ranged constraint. <!-- sdd-owner: implementation -->
- [ ] Verify existing ai-swarm tests still pass after registry unification (no behavior change for existing 3 SUNAT skills). <!-- sdd-owner: implementation -->

### 3.4 — Skills Editor UI (Admin)

- [ ] **RED.** Create test file `apps/web/src/features/skills-editor/__tests__/AdminSkillEditor.test.tsx`. Test: renders skill list with system/non-system badges, "New Skill" form with all fields, saving creates skill, publish version form, tenant config panel. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/skills-editor/views/AdminSkillEditor.tsx` — full editor: skill list (with system/non-system badges), SkillForm (name, description, category, version, input/output JSON Schema editors, tools multi-select, requiresLLM toggle, handlerType select), VersionHistory (timeline of published versions), TenantSkillConfig (per-tenant enable/disable, default input, budget limit, model preference). <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/skills-editor/components/SkillForm.tsx`, `SchemaEditor.tsx` (JSON Schema editor with validation), `VersionHistory.tsx`, `TenantSkillConfig.tsx`. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/skills-editor/hooks/useSkillEditor.ts` — TanStack Query hooks for skills CRUD + version publish. <!-- sdd-owner: implementation -->

### 3.5 — Skills View (Accountant)

- [ ] **RED.** Create test file `apps/web/src/features/skills-editor/__tests__/AccountantSkillView.test.tsx`. Test: renders skill grid with cards (name, description, category badge, on/off toggle), toggling enables/disables skill for tenant, no technical details visible. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/skills-editor/views/AccountantSkillView.tsx` — grid of skill cards, each with plain-language description, category badge, enable/disable toggle. Confirmation toast on toggle. No input/output schemas, version history, tool configuration, or handler type visible. <!-- sdd-owner: implementation -->

### 3.6 — Policy Studio UI

- [ ] **RED.** Create test file `apps/web/src/features/policy-studio/__tests__/PolicyStudioPage.test.tsx`. Test: renders policy list, "New Policy" form with rule builder, condition builder (field/operator/value), action selector, impact preview, template gallery. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/policy-studio/views/PolicyStudioPage.tsx` — full policy editor: policy list, rule builder (name, description, scope selector, condition builder, action selector), PolicyTemplates panel ("High-Autonomy Approval Gate", "Compliance Mandatory Review", "Low-Risk Auto-Approve"), ImpactPreview (affected workflows count, affected tenants, sample decisions). <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/policy-studio/components/RuleBuilder.tsx`, `ConditionBuilder.tsx` (field dropdown, operator dropdown, value input), `ActionSelector.tsx`, `ImpactPreview.tsx` (modal with read-only query results), `PolicyTemplates.tsx`. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/policy-studio/hooks/usePolicyEditor.ts` — TanStack Query hooks for policies CRUD + preview. <!-- sdd-owner: implementation -->

### 3.7 — Policy View (Accountant)

- [ ] **RED.** Create test file `apps/web/src/features/policy-studio/__tests__/AccountantPolicyView.test.tsx`. Test: renders policies grouped by workflow, each with on/off toggle and plain-language description, no raw conditions/actions/scope visible. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/policy-studio/views/AccountantPolicyView.tsx` — simplified policy view: policies grouped by workflow, on/off toggle per policy, plain-language description. No raw conditions, action types, scope configuration, or impact preview. <!-- sdd-owner: implementation -->

### 3.8 — Policy Runtime Migration

- [ ] Modify `apps/api/src/features/ai-swarm/context-control-plane/context-policy.service.ts`: `evaluatePolicy()` checks DB first when feature flag `POLICY_DB_BACKED` is enabled for the tenant, falls back to hardcoded defaults when DB is unreachable. See design §5.3. <!-- sdd-owner: implementation -->
- [ ] Create `POST /api/policies` route (admin-only). Create `PUT /api/policies/:id`, `DELETE /api/policies/:id`, `POST /api/policies/:id/preview` routes. <!-- sdd-owner: implementation -->
- [ ] Verify existing ai-swarm control-plane tests still pass. Add test for DB-backed policy evaluation path. <!-- sdd-owner: implementation -->

### 3.9 — Route Registration (Phase 3)

- [ ] Create TanStack Router file routes: `apps/web/src/routes/studio/skills.tsx`, `apps/web/src/routes/studio/skills.new.tsx` (admin-only), `apps/web/src/routes/studio/skills.$id.tsx` (admin-only), `apps/web/src/routes/studio/policies.tsx`, `apps/web/src/routes/studio/policies.new.tsx` (admin-only), `apps/web/src/routes/studio/policies.$id.tsx` (admin-only). <!-- sdd-owner: implementation -->

### 3.10 — Phase 3 Verification & Gate

- [ ] Run `cd apps/api && npx vitest run src/features/skills` — ≥80% coverage on skills API (lines, branches, functions). <!-- sdd-owner: implementation -->
- [ ] Run `cd apps/web && npx vitest run src/features/skills-editor src/features/policy-studio` — all component tests pass. <!-- sdd-owner: implementation -->
- [ ] Run `cd apps/api && npx vitest run src/features/ai-swarm` — existing ai-swarm tests + new policy DB tests pass. <!-- sdd-owner: implementation -->
- [ ] Manual smoke: admin creates a skill from UI, appears in runtime registry within 30s. Version publish with semver. Breaking change warns. Policy rule created visually, stored in DB, evaluated at runtime gate. Accountant toggles skill and policy without technical details. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review for PR #3 diff. <!-- sdd-owner: parent -->
- [ ] Merge PR #3 to main before starting PR #4. <!-- sdd-owner: parent -->

---

## PR #4: Phase 4 — Studio Admin Panel

**Goal:** Tenant configuration, usage analytics dashboards, centralized immutable audit logs, user/role management, DB-backed feature flag UI.

**Prerequisite:** PR #3 merged to main.

**Estimated:** ~500 lines, ~17 files (15 new + 2 modified)

---

### 4.1 — Admin Database Schemas

- [ ] Create Drizzle migration for `audit_logs` table per design §6.2: columns (id uuid PK, tenant_id, user_id, action, resource_id, resource_type, payload jsonb, ip_address, timestamp). Indexes on `(tenant_id, timestamp)`, `(user_id)`, `(action)`, `(resource_type, resource_id)`. Table is append-only — no UPDATE or DELETE permissions at DB level. <!-- sdd-owner: implementation -->
- [ ] Create Drizzle migration for `feature_flag_overrides` table: columns (id uuid PK, flag_name, enabled, tenant_id nullable, updated_by, updated_at). Unique constraint on `(flag_name, tenant_id)`. <!-- sdd-owner: implementation -->
- [ ] Create `packages/persistence/src/schema/studio-admin.schema.ts` with Drizzle table definitions + TypeScript types. <!-- sdd-owner: implementation -->

### 4.2 — Audit Log Service

- [ ] **RED.** Create test file `apps/api/src/features/studio-admin/__tests__/audit-log.test.ts`. Test: records an event with all fields, queries by tenant+time, queries by user, queries by action, paginates with cursor, denies UPDATE and DELETE (immutable). <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/api/src/features/studio-admin/audit-log.service.ts` — `AuditLogService` with `record(params)` and `query(filters)` methods. Cursor-based pagination, default 50 per page. Immutable: no update/delete methods. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Instrument studio operations to emit audit events: workflow CRUD + execute, skill CRUD + publish + tenant config, policy CRUD, user role change, feature flag toggle. Each calls `AuditLogService.record()` with structured `action` (e.g., `"workflow.create"`, `"skill.publish"`). <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `GET /api/admin/audit-logs` route (admin-only) with query params: `?tenantId`, `?userId`, `?action`, `?resourceType`, `?from`, `?to`, `?cursor`, `?limit`. <!-- sdd-owner: implementation -->

### 4.3 — Analytics Service

- [ ] **RED.** Create test file `apps/api/src/features/studio-admin/__tests__/analytics.test.ts`. Test: tenant usage query returns agent runs + workflow execs + skill invocs + estimated cost by day/week/month, global query returns cross-tenant totals + top 5 tenants + error rate trend. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/api/src/features/studio-admin/analytics.service.ts` — `AnalyticsService` with `getUsageAnalytics(params)` and `getGlobalAnalytics(params)` per design §6.3. Aggregate from `ai_trace_evidence` + `automation_executions` + `budget_tracker`. No new data collection tables. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `GET /api/admin/analytics/usage` (?tenantId, ?from, ?to, ?granularity) and `GET /api/admin/analytics/global` (?from, ?to) routes (admin-only). <!-- sdd-owner: implementation -->

### 4.4 — Tenant Configuration API

- [ ] Create `GET /api/admin/tenants/:tenantId/config` and `PUT /api/admin/tenants/:tenantId/config` routes. Response includes: installed skills with enable/disable per skill, active policies, active workflows count + status summary, feature flags per-tenant overrides, rate limits. <!-- sdd-owner: implementation -->

### 4.5 — User Management API

- [ ] **RED.** Create test file `apps/api/src/features/studio-admin/__tests__/user-management.test.ts`. Test: list users for tenant, create user (email, name, role), update role/status, deactivate (soft delete), cross-tenant isolation. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `GET /api/admin/tenants/:tenantId/users`, `POST /api/admin/tenants/:tenantId/users` (body: email, name, role), `PUT /api/admin/tenants/:tenantId/users/:userId` (role, status), `DELETE /api/admin/tenants/:tenantId/users/:userId` (soft delete — set inactive). All admin-only. <!-- sdd-owner: implementation -->

### 4.6 — Feature Flag Management API

- [ ] **RED.** Create test file `apps/api/src/features/studio-admin/__tests__/feature-flags.test.ts`. Test: list all flags with current values per tenant, update flag for specific tenants, update flag for all tenants, resolution order (DB tenant override → DB global override → shared fallback), audit log recorded on change. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `GET /api/admin/feature-flags` and `PUT /api/admin/feature-flags/:flagName` routes (admin-only). Body: `{ enabled: boolean, tenantIds: string[] | "all" }`. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Modify feature flag resolution in `packages/shared/src/feature-flags.ts` (or create wrapper): check DB overrides first (tenant-specific, then global), then fall back to shared module's tier-based resolution. Audit log on every override change. <!-- sdd-owner: implementation -->

### 4.7 — Admin Panel UI

- [ ] **RED.** Create test files for each admin panel component. Test: TenantConfigPanel shows skills/policies/workflows/flags per tenant, AnalyticsDashboard renders charts for selected time range, AuditLogsTable supports filters + cursor pagination, UserManagementTable supports CRUD, FeatureFlagManager toggles per tenant. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio-admin/views/StudioAdminLayout.tsx` — tabbed layout: Tenants, Analytics, Audit Logs, Users, Feature Flags. Admin-only route gate. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio-admin/components/TenantConfigPanel.tsx` — skills enable/disable grid, active policies list, active workflows summary, feature flag toggles per tenant, rate limits. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio-admin/components/AnalyticsDashboard.tsx` — tenant and global views: agent runs chart, workflow executions chart, skill invocations chart, estimated cost, top 5 tenants/widgets. Date range selector: 7d, 30d, 90d, custom. Drill-down to individual records. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio-admin/components/AuditLogsTable.tsx` — filterable table (tenant, user, action, resource type, date range), cursor-based pagination, reverse chronological order. Payload expandable as JSON diff. No delete/edit buttons (immutable). <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio-admin/components/UserManagementTable.tsx` — per-tenant user list, "Add User" dialog (email, name, role), edit role/status inline, deactivate button. Tenant selector for super-admins. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create `apps/web/src/features/studio-admin/components/FeatureFlagManager.tsx` — flag list with current values, tenant selector, toggle per tenant or all tenants. Change history viewable per flag. <!-- sdd-owner: implementation -->
- [ ] **GREEN.** Create hooks: `apps/web/src/features/studio-admin/hooks/useAnalytics.ts`, `useAuditLogs.ts`, `useFeatureFlags.ts` — TanStack Query hooks. <!-- sdd-owner: implementation -->

### 4.8 — Route Registration (Phase 4)

- [ ] Create TanStack Router file routes: `apps/web/src/routes/studio/admin/index.tsx` (admin-only `beforeLoad` gate), `tenants.tsx`, `analytics.tsx`, `audit-logs.tsx`, `users.tsx`, `feature-flags.tsx`. All under `/studio/admin/*`. <!-- sdd-owner: implementation -->

### 4.9 — Phase 4 Verification & Gate

- [ ] Run `cd apps/api && npx vitest run src/features/studio-admin` — all admin API tests pass. <!-- sdd-owner: implementation -->
- [ ] Run `cd apps/web && npx vitest run src/features/studio-admin` — all admin component tests pass. <!-- sdd-owner: implementation -->
- [ ] Manual smoke: admin views tenant config, analytics dashboard shows real data, audit logs are filterable and immutable, user CRUD works, feature flag toggle takes effect immediately. <!-- sdd-owner: implementation -->
- [ ] Start or reuse bounded review for PR #4 diff. <!-- sdd-owner: parent -->
- [ ] Merge PR #4 to main. <!-- sdd-owner: parent -->

---

## Cross-Cutting Verification (After All PRs)

- [ ] Verify tenant isolation: request as tenant B for tenant A's workflow returns 404 (not 403). <!-- sdd-owner: parent -->
- [ ] Verify Glass & Steel design tokens: inspect `<WorkflowCanvas>` and `<PolicyStudioPage>` in browser — all colors/spacing/typography reference CSS custom properties, no hardcoded hex/rgb. <!-- sdd-owner: parent -->
- [ ] Verify feature flag gating: set `AUTOMATION_STUDIO=false` for a tenant → tabs hidden or show "upgrade required" state. Set `SKILLS_EDITOR=false` → skill editor routes return 404. Set `POLICY_STUDIO=false` → policy studio routes return 404. Set `STUDIO_ADMIN=false` → admin panel inaccessible. <!-- sdd-owner: parent -->
- [ ] Run full test suite: `bun run test` from repo root — all tests pass across all packages. <!-- sdd-owner: parent -->
- [ ] Start or reuse bounded review for the complete merged diff if any cross-PR integration issues exist. <!-- sdd-owner: parent -->
- [ ] Archive: run `/sdd-archive drenyra-studio-platform`. <!-- sdd-owner: parent -->
