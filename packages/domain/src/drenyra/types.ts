/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
/**
 * Domain contracts for the Drenyra Fiscal Command Center foundation.
 *
 * These exports describe fiscal cases, evidence, deterministic mock agent runs, human approvals
 * and audit events. They are intentionally framework-free so API, persistence and UI adapters can
 * depend on the same fiscal language without importing infrastructure.
 *
 * @example
 * const scope: FiscalScope = { companyId: "company-001", companyRuc: "20123456789", organizationId: "org-001", period: "2026-05", countryCode: "PE" };
 *
 * @example
 * const autonomy: AutonomyLevel = "PREPARE_WITH_APPROVAL";
 *
 * @example
 * const risk: FiscalRiskLevel = "HIGH";
 *
 * @example
 * const eventType: AuditEventType = "APPROVAL_APPROVED";
 */
/**
 * Supported autonomy levels for Drenyra agent behavior.
 *
 * @example
 * AUTONOMY_LEVELS.includes("EXECUTE_AFTER_APPROVAL");
 */
export const AUTONOMY_LEVELS = [
	"ADVISORY",
	"DRAFT_ONLY",
	"PREPARE_WITH_APPROVAL",
	"EXECUTE_AFTER_APPROVAL",
] as const;
/**
 * Autonomy level assigned to a case or approval request.
 *
 * @example
 * const level: AutonomyLevel = "DRAFT_ONLY";
 */
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

/**
 * Lifecycle states for fiscal cases.
 *
 * @example
 * const status: FiscalCaseStatus = "APPROVAL_PENDING";
 */
export const FISCAL_CASE_STATUSES = [
	"OPEN",
	"IN_REVIEW",
	"APPROVAL_PENDING",
	"RESOLVED",
	"ARCHIVED",
] as const;
/**
 * Fiscal case lifecycle state.
 *
 * @example
 * const status: FiscalCaseStatus = "OPEN";
 */
export type FiscalCaseStatus = (typeof FISCAL_CASE_STATUSES)[number];

/**
 * Fiscal process categories supported by the foundation.
 *
 * @example
 * FISCAL_CASE_TYPES.includes("MONTHLY_CLOSE");
 */
export const FISCAL_CASE_TYPES = [
	"MONTHLY_CLOSE",
	"CPE_REVIEW",
	"SIRE_REVIEW",
	"LEDGER_REVIEW",
	"CONCILIATION",
	"EVIDENCE_REVIEW",
] as const;
/**
 * Type of fiscal workflow represented by a case.
 *
 * @example
 * const type: FiscalCaseType = "SIRE_REVIEW";
 */
export type FiscalCaseType = (typeof FISCAL_CASE_TYPES)[number];

/**
 * Risk labels shown by Drenyra for fiscal review prioritization.
 *
 * @example
 * const level: FiscalRiskLevel = "CRITICAL";
 */
export const FISCAL_RISK_LEVELS = [
	"LOW",
	"MEDIUM",
	"HIGH",
	"CRITICAL",
] as const;
/**
 * Fiscal risk severity attached to cases and agent output.
 *
 * @example
 * const risk: FiscalRiskLevel = "MEDIUM";
 */
export type FiscalRiskLevel = (typeof FISCAL_RISK_LEVELS)[number];

/**
 * Evidence categories that can be attached to fiscal cases.
 *
 * @example
 * EVIDENCE_TYPES.includes("SUNAT_RECORD");
 */
export const EVIDENCE_TYPES = [
	"DOCUMENT",
	"SUNAT_RECORD",
	"LEDGER_ENTRY",
	"BANK_STATEMENT",
	"USER_NOTE",
	"AGENT_OUTPUT",
] as const;
/**
 * Evidence item classification.
 *
 * @example
 * const evidenceType: EvidenceType = "AGENT_OUTPUT";
 */
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

/**
 * Deterministic mock agents available in the foundation.
 *
 * @deprecated Use `UnifiedAgentEntry` from `../agents/types` instead.
 * This array will be removed in a future version. All agent definitions now live in
 * `packages/domain/src/agents/registry.ts`.
 *
 * @example
 * const agent: DrenyraAgentType = "CPE_AGENT";
 */
export const AGENT_TYPES = [
	"CPE_AGENT",
	"SIRE_AGENT",
	"LEDGER_AGENT",
	"CONCILIATION_AGENT",
	"FISCAL_REVIEWER_AGENT",
	"EVIDENCE_AGENT",
] as const;
/**
 * Drenyra specialized fiscal agent identifier.
 *
 * @example
 * const agentType: DrenyraAgentType = "FISCAL_REVIEWER_AGENT";
 */
export type DrenyraAgentType = (typeof AGENT_TYPES)[number];

/**
 * Execution states for agent runs.
 *
 * @example
 * const status: AgentRunStatus = "COMPLETED";
 */
export const AGENT_RUN_STATUSES = ["STARTED", "COMPLETED", "FAILED"] as const;
/**
 * Agent run lifecycle state.
 *
 * @example
 * const status: AgentRunStatus = "STARTED";
 */
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

/**
 * Human approval decision states.
 *
 * @example
 * const status: ApprovalStatus = "REJECTED";
 */
export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
/**
 * Approval request state.
 *
 * @example
 * const status: ApprovalStatus = "PENDING";
 */
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

/**
 * Important Drenyra actions that must leave an audit event.
 *
 * @example
 * const event: AuditEventType = "EVIDENCE_ADDED";
 */
export const AUDIT_EVENT_TYPES = [
	"FISCAL_CASE_CREATED",
	"FISCAL_CASE_STATUS_CHANGED",
	"EVIDENCE_ADDED",
	"AGENT_RUN_STARTED",
	"AGENT_RUN_COMPLETED",
	"APPROVAL_REQUESTED",
	"APPROVAL_APPROVED",
	"APPROVAL_REJECTED",
	"CAPABILITY_ALLOWED",
	"CAPABILITY_DENIED",
] as const;
/**
 * Audit event classification.
 *
 * @example
 * const eventType: AuditEventType = "AGENT_RUN_COMPLETED";
 */
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

/**
 * Fiscal workspace scope for tenant-safe Drenyra records.
 *
 * @example
 * const scope: FiscalScope = { companyId: "company-001", companyRuc: "20123456789", organizationId: "org-001", period: "2026-05", countryCode: "PE" };
 */
export interface FiscalScope {
	companyId: string;
	companyRuc: string;
	organizationId?: string | undefined;
	period: string;
	countryCode: "PE";
}

/**
 * Case that groups fiscal work, evidence, risk and approvals.
 *
 * @example
 * const title = fiscalCase.title;
 */
export interface FiscalCase {
	id: string;
	scope: FiscalScope;
	type: FiscalCaseType;
	status: FiscalCaseStatus;
	title: string;
	description: string;
	riskLevel: FiscalRiskLevel;
	riskScore: number;
	autonomyLevel: AutonomyLevel;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	metadata: Record<string, unknown>;
}

/**
 * Evidence attached to a fiscal case with source and content hash.
 *
 * @example
 * const hash = evidence.contentHash;
 */
export interface EvidenceItem {
	id: string;
	caseId: string;
	scope: FiscalScope;
	type: EvidenceType;
	title: string;
	summary: string;
	source: string;
	sourceRef?: string | undefined;
	contentHash: string;
	addedBy: string;
	createdAt: string;
	metadata: Record<string, unknown>;
}

/**
 * Structured deterministic output produced by a Drenyra mock agent.
 *
 * @example
 * const approvalNeeded = output.approvalRequired;
 */
/**
 * Agent execution record for a fiscal case.
 *
 * @example
 * const agent = run.agentType;
 */
export interface AgentRunOutput {
	summary: string;
	findings: string[];
	riskLevel: FiscalRiskLevel;
	confidence: number;
	recommendedActions: string[];
	requiredEvidence: string[];
	approvalRequired: boolean;
	/** VerificationReport post-ejecución para el loop intención↔acción */
	verificationReport?: import("./verification-types").VerificationReport;
}

export interface AgentRun {
	id: string;
	caseId: string;
	scope: FiscalScope;
	agentType: DrenyraAgentType;
	status: AgentRunStatus;
	startedBy: string;
	startedAt: string;
	completedAt?: string | undefined;
	output?: AgentRunOutput;
	metadata: Record<string, unknown>;
}

/**
 * Human-readable before/after payload for approval requests.
 *
 * @example
 * const summary = diff.summary;
 */
export interface ApprovalDiffPayload {
	before: Record<string, unknown>;
	after: Record<string, unknown>;
	summary: string;
}

/**
 * Human approval gate for sensitive fiscal actions.
 *
 * @example
 * const pending = approval.status === "PENDING";
 */
export interface ApprovalRequest {
	id: string;
	caseId: string;
	scope: FiscalScope;
	status: ApprovalStatus;
	title: string;
	description: string;
	autonomyLevel: AutonomyLevel;
	requestedBy: string;
	requestedAt: string;
	decidedBy?: string | undefined;
	decidedAt?: string | undefined;
	decisionReason?: string | undefined;
	diff: ApprovalDiffPayload;
	metadata: Record<string, unknown>;
}

/**
 * Immutable audit event emitted for important Drenyra actions.
 *
 * @example
 * const actor = event.actorId;
 */
export interface AuditEvent {
	id: string;
	caseId?: string | undefined;
	scope: FiscalScope;
	eventType: AuditEventType;
	actorId: string;
	message: string;
	occurredAt: string;
	metadata: Record<string, unknown>;
}

/**
 * Expanded fiscal case read model for the command-center workspace.
 *
 * @example
 * const evidenceCount = details.evidence.length;
 */
export interface FiscalCaseDetails {
	case: FiscalCase;
	evidence: EvidenceItem[];
	agentRuns: AgentRun[];
	approvals: ApprovalRequest[];
	auditEvents: AuditEvent[];
}

/**
 * Stable capability id for the first shared CLI/Web fiscal work inspection contract.
 *
 * @example
 * const capability = DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY;
 */
export const DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY =
	"drenyra.fiscal-work.inspect" as const;

/**
 * Result states returned by the shared fiscal work inspect envelope.
 *
 * @example
 * DRENYRA_FISCAL_WORK_INSPECT_STATUSES.includes("success");
 */
export const DRENYRA_FISCAL_WORK_INSPECT_STATUSES = [
	"success",
	"denied",
	"not_found",
	"validation_failed",
] as const;
export type DrenyraFiscalWorkInspectStatus =
	(typeof DRENYRA_FISCAL_WORK_INSPECT_STATUSES)[number];

/**
 * Machine-readable reason codes for CLI/Web handling of fiscal work inspect responses.
 *
 * @example
 * const reason: DrenyraFiscalWorkInspectReasonCode = "DRENYRA_CAPABILITY_DENIED";
 */
export const DRENYRA_FISCAL_WORK_INSPECT_REASON_CODES = [
	"OK",
	"TENANT_CONTEXT_REQUIRED",
	"DRENYRA_CAPABILITY_DENIED",
	"SCOPE_MISMATCH",
	"NOT_FOUND",
	"VALIDATION_FAILED",
] as const;
export type DrenyraFiscalWorkInspectReasonCode =
	(typeof DRENYRA_FISCAL_WORK_INSPECT_REASON_CODES)[number];

/**
 * Source surface requesting fiscal work inspection.
 *
 * @example
 * const surface: DrenyraFiscalWorkInspectSourceSurface = "web";
 */
export type DrenyraFiscalWorkInspectSourceSurface =
	| "cli"
	| "web"
	| "api"
	| "automation";

/**
 * Shared read-only inspect envelope consumed by Drenyra CLI and Web.
 *
 * @example
 * const okEnvelope: DrenyraFiscalWorkInspectEnvelope = {
 *   status: "success",
 *   reasonCode: "OK",
 *   traceId: "trace_123",
 *   capabilityId: DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
 *   data: details,
 * };
 */
export interface DrenyraFiscalWorkInspectEnvelope {
	status: DrenyraFiscalWorkInspectStatus;
	reasonCode: DrenyraFiscalWorkInspectReasonCode;
	traceId: string;
	capabilityId: typeof DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY;
	data?: FiscalCaseDetails;
	evidenceRefs?: string[];
	summary?: string;
	redactedDetail?: string;
	sourceSurface?: DrenyraFiscalWorkInspectSourceSurface;
}

export type DrenyraBrainSourceSurface =
	| "cli"
	| "tui"
	| "web"
	| "api"
	| "automation";

export type DrenyraBrainThreadStatus =
	| "active"
	| "waiting_for_approval"
	| "completed"
	| "failed"
	| "cancelled"
	| "archived";

export type DrenyraBrainTurnStatus =
	| "queued"
	| "running"
	| "waiting_for_approval"
	| "completed"
	| "failed"
	| "cancelled";

export type DrenyraBrainItemType =
	| "user_message"
	| "assistant_message"
	| "agent_run_started"
	| "agent_run_delta"
	| "agent_run_completed"
	| "tool_call_started"
	| "tool_call_completed"
	| "web_research_result"
	| "evidence_linked"
	| "approval_requested"
	| "approval_resolved"
	| "audit_event"
	| "error";

export interface DrenyraFiscalScope {
	organizationId?: string;
	companyId: string;
	companyRuc: string;
	period: string;
	countryCode: "PE";
}

export interface DrenyraBrainThread {
	id: string;
	title: string;
	fiscalScope: DrenyraFiscalScope;
	status: DrenyraBrainThreadStatus;
	sourceSurface: DrenyraBrainSourceSurface;
	linkedCaseId?: string;
	linkedMissionId?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface DrenyraBrainTurn {
	id: string;
	threadId: string;
	fiscalScope: DrenyraFiscalScope;
	status: DrenyraBrainTurnStatus;
	prompt: string;
	sourceSurface: DrenyraBrainSourceSurface;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface DrenyraBrainWebResearchContent {
	query: string;
	sourceUrl: string;
	sourceTitle: string;
	retrievedAt: string;
	snippet: string;
	citationText: string;
	toolName: string;
	purpose: string;
}

export interface DrenyraBrainApprovalLinkContent {
	approvalId: string;
	status: ApprovalStatus;
	reason: string;
}

export type DrenyraBrainItemContent =
	| { text: string }
	| { runId: string; status: AgentRunStatus; summary?: string }
	| DrenyraBrainWebResearchContent
	| DrenyraBrainApprovalLinkContent
	| { message: string; code?: string };

export interface DrenyraBrainItem {
	id: string;
	threadId: string;
	turnId?: string;
	fiscalScope: DrenyraFiscalScope;
	type: DrenyraBrainItemType;
	content: DrenyraBrainItemContent;
	actorId?: string;
	sourceSurface: DrenyraBrainSourceSurface;
	createdAt: string;
}

export type DrenyraBrainEventType =
	| "thread_created"
	| "turn_started"
	| "item_appended"
	| "turn_completed"
	| "turn_failed"
	| "approval_updated";

export interface DrenyraBrainEvent {
	id: string;
	threadId: string;
	turnId?: string;
	itemId?: string;
	fiscalScope: DrenyraFiscalScope;
	type: DrenyraBrainEventType;
	sequence: number;
	actorId: string;
	sourceSurface: DrenyraBrainSourceSurface;
	createdAt: string;
	metadata: Record<string, unknown>;
}

import type { DrenyraSubagentName } from "@drenyra/pi";

export type { DrenyraSubagentName };
