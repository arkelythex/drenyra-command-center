# Drenyra Studio Platform — Specification

**Change:** `drenyra-studio-platform`
**Based on:** Proposal v2026-07-23
**Domains:** agent-runtime, automation-studio, skills-editor, policy-studio, studio-admin
**Phase Ordering:** Phase 1 (agent-runtime) → Phase 2 (automation-studio) → Phase 3 (skills-editor, policy-studio) → Phase 4 (studio-admin)

---

## Domain: Agent Runtime

### Purpose

Formalize the `ai-swarm` agent runtime (`apps/api/src/features/ai-swarm/` — 144 files, 56 tests) with architecture documentation, explicit module contracts, a boundary audit against `packages/drenyra-orchestrator/`, a granular agent decision audit trail, and boundary-correcting refactors. No agent behavior changes.

### Requirements

#### Requirement: Architecture Document

The system MUST produce an architecture document for the ai-swarm runtime covering module inventory, data flow, design decisions, and boundaries.

##### Scenario: Document covers all modules

- GIVEN the ai-swarm feature directory at `apps/api/src/features/ai-swarm/`
- WHEN the architecture document is generated
- THEN it SHALL enumerate every subdirectory (agents, orchestrator, context-control-plane, api, workers, observability, skills, governance) with its responsibility, public interface, and dependency direction
- AND it SHALL include an ADR (Architecture Decision Record) for at least: agent orchestration model, control-plane placement, skill registry design, and governance boundary

##### Scenario: Document is reviewable

- GIVEN the architecture document
- WHEN a reviewer reads it
- THEN the reviewer SHALL be able to trace any ai-swarm source file to its owning module
- AND the data-flow diagram SHALL show request ingress through API routes → orchestrator → agent execution → control-plane evaluation → worker dispatch

---

#### Requirement: Module Contracts

The system MUST define formal TypeScript contracts between ai-swarm modules and their consumers.

##### Scenario: Agent ↔ Orchestrator contract

- GIVEN an agent invocation from the orchestrator
- WHEN the orchestrator dispatches work
- THEN the interface SHALL type the agent input (context, surface, policy constraints), agent output (decision, evidence, confidence), and error protocol
- AND the contract SHALL be a Zod schema with a TypeScript type alias, exportable from a shared path

##### Scenario: Control Plane ↔ Workers contract

- GIVEN a worker consuming control-plane evaluation results
- WHEN a control-plane decision gates worker execution
- THEN the contract SHALL type the evaluation payload (surface, policy result, allowed tools, allowed corpora, autonomy level)
- AND worker code SHALL NOT import agent internals directly

##### Scenario: Skill Registry ↔ Agent Executor contract

- GIVEN an agent executor discovering available skills
- WHEN the executor queries the skill registry
- THEN the contract SHALL type `SkillDefinition` (id, category, version, input schema, output schema, requiresLLM, tools) and `SkillInvocation` (skillId, input, context, traceId)
- AND the registry SHALL expose a discovery interface that returns skill catalog in LLM-prompt-ready format

##### Scenario: Governance ↔ API routes contract

- GIVEN an API route checking governance policy
- WHEN the route consults the autonomy-policy service
- THEN the contract SHALL type the policy question (surface, tenant, requested action) and policy answer (allowed/denied/requires-approval, reason, escalation path)
- AND the route SHALL NOT bypass governance by calling agent internals directly

---

#### Requirement: Orchestrator Boundary Audit

The system MUST produce a boundary audit that clearly separates `ai-swarm` (fiscal agent runtime) from `drenyra-orchestrator` (SDD orchestration).

##### Scenario: Ownership is unambiguous

- GIVEN the entire codebase
- WHEN the boundary audit runs
- THEN every file that imports both `ai-swarm` and `drenyra-orchestrator` SHALL be flagged and assigned an owner
- AND any logic that belongs to the wrong package SHALL be identified with a migration plan

##### Scenario: Audit output is actionable

- GIVEN the boundary audit report
- WHEN an engineer reviews it
- THEN each flagged boundary crossing SHALL include: file path, what crosses, risk level (low/medium/high), and recommended action (move / extract-shared / document-as-intentional)

---

#### Requirement: Agent Decision Audit Trail

The system MUST capture every agent decision with a trace ID, policy reference, and evidence hash.

##### Scenario: Decision is traceable

- GIVEN an agent (SUNAT, OCR, reconciliation, etc.) makes a decision
- WHEN the decision is emitted
- THEN the system SHALL record: `traceId` (UUID), `agentId`, `decisionType` (e.g., "sunat_discrepancy", "ocr_match"), `policyId` that governed the decision, `evidenceHash` (SHA-256 of input evidence), `confidence` (0-1), and `timestamp`

##### Scenario: Audit trail is queryable

- GIVEN an audit trail record exists
- WHEN an admin queries by traceId, agentId, tenant, or time window
- THEN the system SHALL return all matching decisions with full payload
- AND the query SHALL support filtering by policyId and decisionType

##### Scenario: Existing tests still pass

- GIVEN the audit trail instrumentation is added
- WHEN the existing ai-swarm test suite (56 tests) runs
- THEN all tests SHALL pass without modification
- AND no agent behavior SHALL change

---

#### Requirement: Boundary-Correcting Refactors

The system MUST apply refactors that fix boundary violations identified in the audit, without changing agent behavior.

##### Scenario: SDD orchestration logic removed from ai-swarm

- GIVEN any ai-swarm file contains SDD orchestration logic (planning, task decomposition, execution tracking unrelated to fiscal agents)
- WHEN the refactor executes
- THEN that logic SHALL move to `packages/drenyra-orchestrator/` or be extracted into a new shared utility
- AND the ai-swarm test suite SHALL continue passing

##### Scenario: Shared types centralized

- GIVEN types that both ai-swarm and external consumers need (`AgentDecision`, `SkillDefinition`, `PolicyResult`)
- WHEN the refactor executes
- THEN those types SHALL live in `packages/domain/` or `packages/shared/` as appropriate
- AND the original features SHALL re-export or import them from the canonical location

##### Scenario: Direct coupling to fiscal features eliminated

- GIVEN ai-swarm files directly import from fiscal-specific features (e.g., `apps/api/src/features/sire/`)
- WHEN the refactor executes
- THEN those imports SHALL be replaced with dependency injection or abstract interfaces
- AND the fiscal feature integration SHALL work identically at runtime

---

## Domain: Automation Studio

### Purpose

A visual workflow builder that lets accountants create automations from predefined templates and lets Drenyra admins compose advanced workflows. Dual-role surfaces: accountant-friendly simplified view, admin full-control panel. Consumes the existing automation-studio API CRUD (`apps/api/src/features/automation-studio/`) and extends the existing Drizzle schema (`automation_workflows`, `automation_steps`, `automation_executions`).

### Requirements

#### Requirement: Visual Workflow Canvas

The system MUST provide a drag-and-drop workflow canvas component (`<WorkflowCanvas>`) that renders nodes (triggers, skills, conditions, actions) and editable connections.

##### Scenario: Accountant creates a simple workflow from template

- GIVEN the accountant is on the Automation Studio page
- WHEN they select a template ("SUNAT Daily Check") and click "Use Template"
- THEN the canvas SHALL render the template with 3-5 pre-configured steps
- AND the accountant SHALL be able to activate the workflow with a single click
- AND the entire interaction SHALL take less than 5 minutes for a first-time user

##### Scenario: Admin edits workflow in visual mode

- GIVEN the admin opens an existing workflow
- WHEN they drag a new "Condition" node from the step library onto the canvas
- AND they connect it between two existing steps
- AND they configure the condition (field, operator, value)
- THEN the canvas SHALL persist the new step with correct `stepOrder` recalculation
- AND the admin SHALL see a visual preview of the updated flow

##### Scenario: Admin edits workflow in raw mode

- GIVEN the admin opens an existing workflow
- WHEN they toggle to "Raw JSON" mode
- THEN the system SHALL display the full workflow definition as editable JSON
- AND editing the JSON and toggling back to visual mode SHALL render the changes immediately
- AND validation errors in the JSON SHALL prevent saving and highlight the offending property

##### Scenario: Workflow simulation preview

- GIVEN a workflow in draft status
- WHEN the admin clicks "Simulate"
- THEN the system SHALL perform a dry-run that validates step configs, resolves skill references, and checks trigger schema
- AND the system SHALL report: total estimated steps, any missing skill references, and schema validation errors per step
- AND the simulation SHALL NOT execute any side effects (no notifications, no webhook calls, no agent invocations)

---

#### Requirement: Step Library

The system MUST provide a searchable catalog of predefined automation steps.

##### Scenario: Step library shows available actions

- GIVEN the workflow canvas is open
- WHEN the admin opens the step library panel
- THEN the system SHALL display all available step types grouped by category: SUNAT (check_sire, sire_readiness), Reconciliation (bank_reconciliation, ledger_match), Invoicing (invoice_processing, receipt_validation), Notifications (send_email, send_alert), Custom (call_webhook, execute_skill)
- AND each step SHALL show its name, description, required config fields, and output type

##### Scenario: Step library filters by category

- GIVEN the step library is open
- WHEN the admin selects the "SUNAT" filter
- THEN only SUNAT-related steps SHALL be visible
- AND the filter SHALL be reflected in the URL search params

---

#### Requirement: Accountant Surface

The system MUST provide a simplified automation view for accountants that requires no technical knowledge.

##### Scenario: Accountant activates/deactivates a template

- GIVEN the accountant is on the Automations page
- WHEN they toggle the switch on a template card ("SUNAT Daily Check")
- THEN the underlying workflow status SHALL change to `active` or `paused`
- AND the card SHALL update its visual state immediately (green for active, gray for paused)
- AND the accountant SHALL NOT see raw JSON, step configuration, or advanced options

##### Scenario: Accountant views review queue

- GIVEN the accountant has workflows with pending review items
- WHEN they navigate to the "Review Queue" tab
- THEN the system SHALL display results awaiting approval, grouped by workflow
- AND each item SHALL show: workflow name, execution timestamp, result summary, and action buttons (Approve, Reject, Re-run)
- AND approving/rejecting SHALL record the accountant's decision with timestamp and user ID

---

#### Requirement: Admin Control Panel

The system MUST provide a full-control automation management panel for Drenyra admins.

##### Scenario: Admin manages workflows across tenants

- GIVEN the admin is on the Admin Automation panel
- WHEN they select a tenant/RUC from the tenant selector
- THEN the workflow list SHALL scope to that tenant
- AND the admin SHALL be able to create, edit, delete, activate, pause any workflow for that tenant
- AND the admin SHALL see execution history, error counts, and last-run status per workflow

##### Scenario: Admin configures workflow-level policies

- GIVEN the admin edits a workflow
- WHEN they open the "Policies" tab
- THEN the system SHALL allow setting: auto-approval threshold (confidence >= X), max autonomy level (none/low/medium/high), escalation contact, and kill-switch condition
- AND changes SHALL be reflected in the control-plane evaluation at next workflow execution

---

#### Requirement: Workflow Execution Integration

The system MUST execute workflows created in the builder through the ai-swarm runtime.

##### Scenario: Workflow triggers correctly

- GIVEN an active workflow with trigger type `schedule` and config `{ cron: "0 9 * * *" }`
- WHEN the scheduled time arrives
- THEN the system SHALL create an execution record with `status: running`
- AND the orchestrator SHALL dispatch each step in order through the skill registry

##### Scenario: Execution status is observable

- GIVEN a workflow execution is in progress
- WHEN the admin views the workflow detail page
- THEN the system SHALL show the current step, completed steps (with status), and any errors
- AND the status SHALL update in near-real-time (polling or SSE acceptable)

---

### API Contracts — Automation Studio

#### GET /api/automation-studio/workflows

List workflows for the current tenant. Supports `?status`, `?category` filters.

**Response:** `{ data: WorkflowResponse[], total: number }`

#### POST /api/automation-studio/workflows

Create a workflow.

**Body:** `{ name: string, description?: string, category: WorkflowCategory, triggerType: TriggerType, triggerConfig: Record<string, unknown> }`

**Response:** `WorkflowResponse` (includes empty steps array)

#### GET /api/automation-studio/workflows/:id

Get workflow with populated steps.

**Response:** `WorkflowResponse | null`

#### PATCH /api/automation-studio/workflows/:id

Update workflow metadata (name, description, status, trigger config).

**Response:** `WorkflowResponse | null`

#### DELETE /api/automation-studio/workflows/:id

Soft-delete (set status to `archived`). Cascade-removes steps and executions.

**Response:** `204 No Content`

#### PUT /api/automation-studio/workflows/:id/steps

Replace all steps for a workflow (atomic reorder + update).

**Body:** `{ steps: Array<{ stepOrder: number, stepType: StepType, actionType: ActionType, config: Record<string, unknown> }> }`

**Response:** `{ data: StepResponse[] }`

#### GET /api/automation-studio/workflows/:id/executions

List executions for a workflow, paginated.

**Response:** `{ data: ExecutionResponse[], total: number, page: number }`

#### POST /api/automation-studio/workflows/:id/execute

Manually trigger a workflow execution.

**Response:** `ExecutionResponse`

#### GET /api/automation-studio/steps/library

List available step types. Public catalog; no auth required for metadata.

**Response:** `{ categories: Array<{ name: string, steps: Array<{ actionType: string, label: string, description: string, requiredConfig: Record<string, { type: string, label: string }> }> }> }`

---

## Domain: Skills Editor

### Purpose

A visual editor that lets Drenyra admins create, version, and publish skills without writing code. Unifies the skills catalog (`apps/api/src/features/skills/`) with the ai-swarm skill registry runtime (`apps/api/src/features/ai-swarm/skills/`). Dual-role: accountants can browse and activate predefined skills; admins can create and configure.

### Requirements

#### Requirement: Visual Skill Creation

The system MUST allow an admin to create a new skill from the UI without writing TypeScript.

##### Scenario: Admin creates a skill from scratch

- GIVEN the admin is on the Skills Editor page
- WHEN they click "New Skill"
- THEN the system SHALL present a form with: name, description, category, version (semver), input schema (JSON Schema editor), output schema (JSON Schema editor), tools required (multi-select from available tools), requires LLM (toggle), and handler type (deterministic/llm-chain/hybrid)
- AND upon saving, the skill SHALL be persisted and SHALL appear in the skill registry within 30 seconds

##### Scenario: Admin configures skill parameters per tenant

- GIVEN a skill is published
- WHEN the admin selects a tenant and opens the skill config
- THEN the system SHALL allow overriding: default input values, tool budget limits, LLM model preference (default/tenant-specific), and enabled/disabled status
- AND tenant config SHALL NOT modify the skill definition itself (immutable reference)

---

#### Requirement: Skill Versioning

The system MUST support semantic versioning for skills with backward-compatibility guarantees.

##### Scenario: Admin publishes a new version

- GIVEN a skill at version `1.0.0`
- WHEN the admin edits the skill and publishes as `1.1.0`
- THEN the new version SHALL be stored alongside the old version
- AND workflows referencing `^1.0.0` SHALL resolve to `1.1.0` (semver caret range)
- AND workflows pinned to `1.0.0` SHALL continue using the old version

##### Scenario: Breaking change requires major version

- GIVEN the admin modifies the input schema in a backward-incompatible way
- WHEN they attempt to publish as `1.2.0`
- THEN the system SHALL warn that the change is breaking and recommend `2.0.0`
- AND the editor SHALL display which fields changed and which workflows would be affected

---

#### Requirement: Skill Catalog ↔ Runtime Unification

The system MUST unify the skills catalog API (`features/skills/`) with the ai-swarm skill registry runtime (`features/ai-swarm/skills/`).

##### Scenario: Skill created in editor is available at runtime

- GIVEN a skill is published through the editor
- WHEN an agent executor queries the skill registry
- THEN the skill SHALL appear in the `discover()` result with its full definition
- AND the executor SHALL be able to invoke it via `skillRegistry.invoke(skillId, input, ctx)`

##### Scenario: Runtime skills are visible in catalog

- GIVEN the three hardcoded SUNAT skills exist in the runtime registry
- WHEN the admin views the skills catalog in the editor
- THEN those runtime skills SHALL appear alongside editor-created skills
- AND they SHALL be marked as "System" skills (non-editable via UI)

---

#### Requirement: Accountant Skill Surface

The system MUST provide a simplified skill management view for accountants.

##### Scenario: Accountant browses and activates skills

- GIVEN the accountant is on the Skills page
- WHEN they view the available skills
- THEN each skill card SHALL show: name, description (plain language), category badge, and an enable/disable toggle
- AND the accountant SHALL NOT see: input/output schemas, version history, tool configuration, or handler type

##### Scenario: Accountant activates a predefined skill

- GIVEN a skill is disabled for the accountant's tenant
- WHEN the accountant toggles it on
- THEN the skill SHALL become available for workflows in that tenant
- AND a confirmation toast SHALL show "Skill [name] activated — now available in your automations"

---

#### Requirement: Skills API Test Coverage

The system MUST achieve ≥80% test coverage on the Skills API.

##### Scenario: Test suite covers CRUD + integration

- GIVEN the skills API at `apps/api/src/features/skills/`
- WHEN the test suite runs
- THEN coverage SHALL be ≥80% across lines, branches, and functions
- AND tests SHALL cover: list, detail, install, uninstall, config, version publish, and runtime integration

---

### API Contracts — Skills Editor

#### GET /api/skills

List all skills in the catalog. Supports `?category`, `?tenantId` filters.

**Response:** `{ data: SkillCatalogItem[], total: number }`

#### GET /api/skills/:id

Get skill detail with all versions.

**Response:** `SkillDetail` (includes `versions: SkillVersion[]`)

#### POST /api/skills

Create a new skill (admin only).

**Body:** `{ name: string, description: string, category: string, inputSchema: JsonSchema, outputSchema: JsonSchema, tools: string[], requiresLLM: boolean, handlerType: "deterministic" | "llm-chain" | "hybrid" }`

**Response:** `SkillDetail`

#### PUT /api/skills/:id

Update skill metadata (non-breaking changes only).

**Response:** `SkillDetail`

#### POST /api/skills/:id/versions

Publish a new version.

**Body:** `{ version: string, inputSchema?: JsonSchema, outputSchema?: JsonSchema, tools?: string[], changelog: string }`

**Response:** `SkillVersion`

#### GET /api/skills/:id/tenants/:tenantId/config

Get tenant-specific skill configuration.

**Response:** `TenantSkillConfig`

#### PUT /api/skills/:id/tenants/:tenantId/config

Update tenant-specific skill configuration.

**Body:** `{ enabled: boolean, defaultInput?: Record<string, unknown>, budgetLimit?: number, modelPreference?: string }`

**Response:** `TenantSkillConfig`

---

## Domain: Policy Studio

### Purpose

A visual policy editor that lets admins configure governance rules (condition → action) without editing code. Policies are stored in the database and evaluated at runtime by the existing control-plane gate (`context-control-plane/`). Dual-role: accountants see simplified policy toggles; admins compose advanced rules.

### Requirements

#### Requirement: Visual Policy Editor

The system MUST provide a visual rule builder where admins compose policies as condition → action pairs.

##### Scenario: Admin creates a policy rule

- GIVEN the admin is on the Policy Studio page
- WHEN they click "New Policy"
- THEN the system SHALL present a rule builder with: name, description, scope (global / tenant / workflow), condition builder (field, operator, value — e.g., "confidence < 0.7"), and action selector (require_approval, block, log_only, escalate)
- AND upon saving, the policy SHALL be stored in the database and evaluated by the control-plane at next gate check

##### Scenario: Policy preview shows impact

- GIVEN the admin creates or edits a policy
- WHEN they click "Preview Impact"
- THEN the system SHALL show: how many workflows would be affected, which tenants are in scope, and a sample of recent decisions that would have been gated by this policy
- AND the preview SHALL NOT modify any live policy state

---

#### Requirement: Policy Templates

The system MUST provide predefined policy templates for common governance scenarios.

##### Scenario: Admin uses a template

- GIVEN the admin opens the Policy Studio
- WHEN they select "From Template" and choose "High-Autonomy Approval Gate"
- THEN the system SHALL pre-populate the rule builder with: condition (autonomy_level = high AND action_type = post_journal), action (require_approval), and escalation contact field
- AND the admin SHALL be able to customize before saving

##### Scenario: Templates are role-scoped

- GIVEN the accountant opens the Policy page (simplified view)
- WHEN they view available policies
- THEN only template-based policies SHALL be shown (no raw rule builder)
- AND the accountant SHALL be able to toggle each policy on/off per workflow

---

#### Requirement: Policy Database Storage

The system MUST store policies in the database (Drizzle schema) rather than hardcoded TypeScript files.

##### Scenario: Policy survives application restart

- GIVEN a policy is created via the Policy Studio
- WHEN the API server restarts
- THEN the policy SHALL still be active and evaluated by the control-plane
- AND no code change or deployment SHALL be required for the policy to take effect

##### Scenario: Policy schema migration

- GIVEN the existing hardcoded policies in `context-policy.service.ts`
- WHEN the database-backed policy system is deployed
- THEN the hardcoded policies SHALL be migrated as seed data into the `policies` table
- AND the control-plane SHALL consult the database first, falling back to hardcoded defaults only when the DB is unreachable

---

#### Requirement: Role-Based Policy Surfaces

The system MUST differentiate policy management surfaces by role.

##### Scenario: Accountant sees simplified policy view

- GIVEN the accountant navigates to Policies
- WHEN the page loads
- THEN the system SHALL show: a list of policies grouped by workflow, each with an on/off toggle and a plain-language description
- AND the accountant SHALL NOT see: raw conditions, action types, scope configuration, or impact preview

##### Scenario: Admin sees full policy editor

- GIVEN the admin navigates to Policy Studio
- WHEN the page loads
- THEN the system SHALL show: all policies across tenants, the rule builder, templates, impact preview, and scope configuration
- AND the admin SHALL be able to create, edit, delete, enable, and disable any policy

---

### API Contracts — Policy Studio

#### GET /api/policies

List policies. Supports `?scope=global|tenant|workflow` and `?tenantId` filters.

**Response:** `{ data: PolicyResponse[], total: number }`

#### POST /api/policies

Create a policy.

**Body:** `{ name: string, description: string, scope: "global" | "tenant" | "workflow", scopeTarget?: string, rules: PolicyRule[], enabled: boolean }`

Where `PolicyRule = { condition: { field: string, operator: string, value: unknown }, action: "require_approval" | "block" | "log_only" | "escalate", actionConfig?: Record<string, unknown> }`

**Response:** `PolicyResponse`

#### PUT /api/policies/:id

Update a policy.

**Response:** `PolicyResponse`

#### DELETE /api/policies/:id

Delete a policy.

**Response:** `204 No Content`

#### POST /api/policies/:id/preview

Preview policy impact without activating.

**Body:** `{ tenantId?: string, workflowId?: string }`

**Response:** `{ affectedWorkflows: number, affectedTenants: number, sampleDecisions: Array<{ decisionId: string, wouldBeBlocked: boolean, matchedRule: string }> }`

---

## Domain: Studio Admin

### Purpose

A unified administration panel for Drenyra Studio providing tenant configuration, usage analytics, centralized audit logs, user/role management, and feature flag management. Consumed by Drenyra admins only (not accountants).

### Requirements

#### Requirement: Tenant Configuration

The system MUST allow admins to configure studio features per tenant/RUC.

##### Scenario: Admin configures tenant features

- GIVEN the admin selects a tenant
- WHEN they open the Tenant Configuration tab
- THEN the system SHALL show: installed skills (with enable/disable per skill), active policies, active workflows (count and status summary), feature flags (per-tenant overrides), and rate limits (API calls per hour, agent runs per day)
- AND changes SHALL take effect immediately without deployment

##### Scenario: Tenant configuration is isolated

- GIVEN tenant A has skill X enabled and policy Y active
- WHEN the admin views tenant B's configuration
- THEN skill X SHALL show its own state for tenant B (not inherited from A)
- AND policy Y SHALL show its own state for tenant B

---

#### Requirement: Usage Analytics

The system MUST provide dashboards showing usage metrics per tenant and globally.

##### Scenario: Admin views tenant usage dashboard

- GIVEN the admin selects a tenant and opens Analytics
- WHEN the dashboard loads
- THEN the system SHALL display for the selected time range: agent runs (total, success, failed, by agent type), workflow executions (total, by workflow, by status), skill invocations (total, by skill, avg duration), and estimated cost (by model/provider if LLM-based)
- AND each metric SHALL support drill-down to individual execution records

##### Scenario: Admin views global usage dashboard

- GIVEN the admin opens Global Analytics (no tenant selected)
- WHEN the dashboard loads
- THEN the system SHALL display: total agent runs across all tenants, top 5 tenants by usage, top 5 workflows by executions, total estimated cost across all tenants, and error rate trend (7-day)
- AND the dashboard SHALL support date range selection (7d, 30d, 90d, custom)

---

#### Requirement: Centralized Audit Logs

The system MUST capture all studio operations in a centralized, queryable audit log.

##### Scenario: Every studio operation is logged

- GIVEN any studio operation occurs (workflow created/edited/deleted/executed, skill created/published/configured, policy created/edited/deleted, user role changed, feature flag toggled)
- WHEN the operation completes
- THEN the system SHALL record: `auditId` (UUID), `tenantId`, `userId`, `action` (verb + resource, e.g., "workflow.create"), `resourceId`, `resourceType`, `payload` (JSON diff of what changed), `timestamp`, and `ipAddress`

##### Scenario: Audit logs are filterable

- GIVEN the audit log contains records
- WHEN the admin queries with filters (tenantId, userId, action, resourceType, date range)
- THEN the system SHALL return matching records in reverse chronological order
- AND the query SHALL support pagination (cursor-based, default 50 per page)

##### Scenario: Audit logs cannot be deleted

- GIVEN an audit log record exists
- WHEN any user attempts to delete or modify it
- THEN the system SHALL deny the operation (immutable append-only log)
- AND the denial SHALL itself be logged as an audit event

---

#### Requirement: User Management

The system MUST provide user and role management per tenant.

##### Scenario: Admin creates a user

- GIVEN the admin is on the User Management page for a tenant
- WHEN they click "Add User" and fill in email, name, and role (accountant / admin / supervisor)
- THEN the system SHALL create the user scoped to that tenant
- AND the user SHALL receive an invitation email to set their password
- AND the role SHALL determine which studio surfaces the user sees (accountant simplified view vs admin full control)

##### Scenario: Admin manages existing users

- GIVEN a user exists for a tenant
- WHEN the admin edits the user
- THEN the system SHALL allow changing: role, active/inactive status, and tenant assignment
- AND role changes SHALL take effect on the user's next session (no forced logout required)

##### Scenario: Multi-tenant admin access

- GIVEN a Drenyra super-admin
- WHEN they open the User Management page
- THEN the system SHALL show a tenant selector first
- AND user lists SHALL be scoped to the selected tenant
- AND the super-admin SHALL be able to manage users across all tenants

---

#### Requirement: Feature Flag Management

The system MUST provide a UI to manage feature flags, extending the existing `packages/shared/src/feature-flags.ts` system.

##### Scenario: Admin toggles a feature flag per tenant

- GIVEN the admin opens Feature Flag Management
- WHEN they select a tenant and toggle `AI_SWARM` to `false`
- THEN the ai-swarm feature SHALL be disabled for that tenant immediately
- AND the tenant's accountants SHALL no longer see AI-powered features in their studio

##### Scenario: Feature flag audit trail

- GIVEN a feature flag is toggled
- WHEN the change is saved
- THEN the system SHALL record an audit log entry with: flag name, previous value, new value, tenant scope, user who made the change, and timestamp
- AND the flag change history SHALL be viewable in the Feature Flag Management UI

##### Scenario: Gradual rollout via feature flags

- GIVEN a new feature (e.g., "Policy Studio") is behind a feature flag
- WHEN the admin enables it for a single "canary" tenant
- THEN only that tenant SHALL see the Policy Studio
- AND other tenants SHALL continue seeing the old experience
- AND the admin SHALL be able to expand to more tenants without a deployment

---

### API Contracts — Studio Admin

#### GET /api/admin/tenants/:tenantId/config

Get studio configuration for a tenant.

**Response:** `TenantStudioConfig`

#### PUT /api/admin/tenants/:tenantId/config

Update studio configuration for a tenant.

**Response:** `TenantStudioConfig`

#### GET /api/admin/analytics/usage

Get usage analytics. Supports `?tenantId`, `?from`, `?to`, `?granularity=day|week|month`.

**Response:** `{ agentRuns: TimeSeriesMetric, workflowExecutions: TimeSeriesMetric, skillInvocations: TimeSeriesMetric, estimatedCost: TimeSeriesMetric, topItems: { agents: RankedItem[], workflows: RankedItem[], skills: RankedItem[] } }`

#### GET /api/admin/analytics/global

Get global (cross-tenant) usage analytics.

**Response:** `{ totalAgentRuns: number, totalWorkflowExecutions: number, totalCost: number, errorRate: number, topTenants: RankedItem[], trendData: TimeSeriesMetric[] }`

#### GET /api/admin/audit-logs

Query audit logs. Supports `?tenantId`, `?userId`, `?action`, `?resourceType`, `?from`, `?to`, `?cursor`, `?limit`.

**Response:** `{ data: AuditLogEntry[], nextCursor: string | null, total: number }`

#### GET /api/admin/tenants/:tenantId/users

List users for a tenant.

**Response:** `{ data: StudioUser[], total: number }`

#### POST /api/admin/tenants/:tenantId/users

Create a user for a tenant.

**Body:** `{ email: string, name: string, role: "accountant" | "admin" | "supervisor" }`

**Response:** `StudioUser`

#### PUT /api/admin/tenants/:tenantId/users/:userId

Update user role or status.

**Response:** `StudioUser`

#### DELETE /api/admin/tenants/:tenantId/users/:userId

Deactivate a user (soft delete).

**Response:** `204 No Content`

#### GET /api/admin/feature-flags

List all feature flags with current values per tenant.

**Response:** `{ flags: FeatureFlagState[] }`

#### PUT /api/admin/feature-flags/:flagName

Update a feature flag for one or more tenants.

**Body:** `{ enabled: boolean, tenantIds: string[] | "all" }`

**Response:** `FeatureFlagState`

---

## Cross-Cutting Requirements

### Requirement: Role-Based Surface Separation

The system MUST render different UI surfaces for `accountant` and `admin` roles, using the same underlying API.

##### Scenario: Accountant accesses admin-only route

- GIVEN a user with role `accountant`
- WHEN they navigate to `/studio/admin/policy-studio` or any `/studio/admin/*` route
- THEN the system SHALL redirect to the accountant dashboard
- AND the system SHALL show a toast: "You don't have permission to access this area"

##### Scenario: Admin accesses all surfaces

- GIVEN a user with role `admin`
- WHEN they navigate to any `/studio/*` route
- THEN the system SHALL render the corresponding admin surface
- AND the admin SHALL see a "View as Accountant" toggle to preview the accountant experience

### Requirement: Tenant Isolation

The system MUST scope all studio data (workflows, skills, policies, executions, audit logs, users) by tenant/RUC.

##### Scenario: Cross-tenant data leak prevented

- GIVEN tenant A has workflow W1
- WHEN the API receives a request authenticated as tenant B asking for W1's ID
- THEN the API SHALL return 404 Not Found (not 403 — don't leak existence)
- AND the audit log SHALL record the cross-tenant access attempt

### Requirement: Glass & Steel Design System Conformance

The system MUST use the existing Glass & Steel design system tokens for all new UI components.

##### Scenario: Workflow canvas uses design tokens

- GIVEN the `<WorkflowCanvas>` component renders
- WHEN inspected in the browser
- THEN all colors, spacing, typography, and elevation SHALL reference CSS custom properties from the design token system
- AND no hardcoded hex/rgb values SHALL appear in component styles (except design-system-defined overrides)

### Requirement: Feature Flag Gating

The system MUST gate all new studio features behind the existing feature flag infrastructure.

##### Scenario: Feature flag disabled hides feature

- GIVEN the `AI_SWARM` feature flag is set to `false` for a tenant
- WHEN an accountant from that tenant loads the Studio
- THEN the Automation Studio, Skills, and Policies tabs SHALL be hidden or show an "upgrade required" state
- AND the admin panel SHALL indicate that features are disabled for that tenant

---

## Acceptance Criteria Summary

### Phase 1 — Agent Runtime Formalization

- [ ] Architecture document exists at `docs/architecture/ai-swarm.md` with module map + ADRs
- [ ] Module contracts are TypeScript interfaces/Zod schemas in a shared package
- [ ] Boundary audit report identifies every ai-swarm ↔ drenyra-orchestrator crossing
- [ ] Agent decision audit trail records: traceId, agentId, policyId, evidenceHash, confidence, timestamp
- [ ] 56 existing ai-swarm tests still pass (green suite)
- [ ] Refactors completed: no SDD logic in ai-swarm, shared types centralized, no direct fiscal coupling

### Phase 2 — Automation Studio Builder

- [ ] `<WorkflowCanvas>` renders drag-and-drop nodes for triggers, skills, conditions, actions
- [ ] Accountant creates a 3-step workflow from template in < 5 minutes
- [ ] Admin toggles between visual and raw JSON editing modes
- [ ] Workflow simulation validates without side effects
- [ ] Review queue shows pending results with Approve/Reject/Re-run actions
- [ ] Workflows created in builder execute correctly via ai-swarm skill registry

### Phase 3 — Skills Editor + Policy Studio

- [ ] Admin creates a skill from the UI; it appears in runtime registry within 30s
- [ ] Skill versioning follows semver; caret ranges resolve correctly
- [ ] Accountant browses and toggles skills without seeing technical details
- [ ] Policy rules are created visually and stored in database
- [ ] Policy preview shows affected workflows and sample decisions
- [ ] Skills API test coverage ≥ 80%

### Phase 4 — Studio Admin Panel

- [ ] Tenant configuration page shows skills, policies, workflows, feature flags per tenant
- [ ] Usage analytics dashboard shows agent runs, executions, invocations, costs
- [ ] Audit logs are immutable, filterable, and capture all studio operations
- [ ] User management supports create, edit, deactivate, role assignment per tenant
- [ ] Feature flags are togglable per tenant from UI; changes take effect immediately
