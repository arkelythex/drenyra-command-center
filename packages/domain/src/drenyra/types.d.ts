export declare const AUTONOMY_LEVELS: readonly ["ADVISORY", "DRAFT_ONLY", "PREPARE_WITH_APPROVAL", "EXECUTE_AFTER_APPROVAL"];
export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];
export declare const FISCAL_CASE_STATUSES: readonly ["OPEN", "IN_REVIEW", "APPROVAL_PENDING", "RESOLVED", "ARCHIVED"];
export type FiscalCaseStatus = (typeof FISCAL_CASE_STATUSES)[number];
export declare const FISCAL_CASE_TYPES: readonly ["MONTHLY_CLOSE", "CPE_REVIEW", "SIRE_REVIEW", "LEDGER_REVIEW", "CONCILIATION", "EVIDENCE_REVIEW"];
export type FiscalCaseType = (typeof FISCAL_CASE_TYPES)[number];
export declare const FISCAL_RISK_LEVELS: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export type FiscalRiskLevel = (typeof FISCAL_RISK_LEVELS)[number];
export declare const EVIDENCE_TYPES: readonly ["DOCUMENT", "SUNAT_RECORD", "LEDGER_ENTRY", "BANK_STATEMENT", "USER_NOTE", "AGENT_OUTPUT"];
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
export declare const AGENT_TYPES: readonly ["CPE_AGENT", "SIRE_AGENT", "LEDGER_AGENT", "CONCILIATION_AGENT", "FISCAL_REVIEWER_AGENT", "EVIDENCE_AGENT"];
export type DrenyraAgentType = (typeof AGENT_TYPES)[number];
export declare const AGENT_RUN_STATUSES: readonly ["STARTED", "COMPLETED", "FAILED"];
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];
export declare const APPROVAL_STATUSES: readonly ["PENDING", "APPROVED", "REJECTED"];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export declare const AUDIT_EVENT_TYPES: readonly ["FISCAL_CASE_CREATED", "FISCAL_CASE_STATUS_CHANGED", "EVIDENCE_ADDED", "AGENT_RUN_STARTED", "AGENT_RUN_COMPLETED", "APPROVAL_REQUESTED", "APPROVAL_APPROVED", "APPROVAL_REJECTED", "CAPABILITY_ALLOWED", "CAPABILITY_DENIED"];
export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];
export interface FiscalScope {
    companyId: string;
    companyRuc: string;
    organizationId?: string;
    period: string;
    countryCode: "PE";
}
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
export interface EvidenceItem {
    id: string;
    caseId: string;
    scope: FiscalScope;
    type: EvidenceType;
    title: string;
    summary: string;
    source: string;
    sourceRef?: string;
    contentHash: string;
    addedBy: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}
export interface AgentRunOutput {
    summary: string;
    findings: string[];
    riskLevel: FiscalRiskLevel;
    confidence: number;
    recommendedActions: string[];
    requiredEvidence: string[];
    approvalRequired: boolean;
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
    completedAt?: string;
    output?: AgentRunOutput;
    metadata: Record<string, unknown>;
}
export interface ApprovalDiffPayload {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    summary: string;
}
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
    decidedBy?: string;
    decidedAt?: string;
    decisionReason?: string;
    diff: ApprovalDiffPayload;
    metadata: Record<string, unknown>;
}
export interface AuditEvent {
    id: string;
    caseId?: string;
    scope: FiscalScope;
    eventType: AuditEventType;
    actorId: string;
    message: string;
    occurredAt: string;
    metadata: Record<string, unknown>;
}
export interface FiscalCaseDetails {
    case: FiscalCase;
    evidence: EvidenceItem[];
    agentRuns: AgentRun[];
    approvals: ApprovalRequest[];
    auditEvents: AuditEvent[];
}
export declare const DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY: "drenyra.fiscal-work.inspect";
export declare const DRENYRA_FISCAL_WORK_INSPECT_STATUSES: readonly ["success", "denied", "not_found", "validation_failed"];
export type DrenyraFiscalWorkInspectStatus = (typeof DRENYRA_FISCAL_WORK_INSPECT_STATUSES)[number];
export declare const DRENYRA_FISCAL_WORK_INSPECT_REASON_CODES: readonly ["OK", "TENANT_CONTEXT_REQUIRED", "DRENYRA_CAPABILITY_DENIED", "SCOPE_MISMATCH", "NOT_FOUND", "VALIDATION_FAILED"];
export type DrenyraFiscalWorkInspectReasonCode = (typeof DRENYRA_FISCAL_WORK_INSPECT_REASON_CODES)[number];
export type DrenyraFiscalWorkInspectSourceSurface = "cli" | "web" | "api" | "automation";
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
export type DrenyraBrainSourceSurface = "cli" | "tui" | "web" | "api" | "automation";
export type DrenyraBrainThreadStatus = "active" | "waiting_for_approval" | "completed" | "failed" | "cancelled" | "archived";
export type DrenyraBrainTurnStatus = "queued" | "running" | "waiting_for_approval" | "completed" | "failed" | "cancelled";
export type DrenyraBrainItemType = "user_message" | "assistant_message" | "agent_run_started" | "agent_run_delta" | "agent_run_completed" | "tool_call_started" | "tool_call_completed" | "web_research_result" | "evidence_linked" | "approval_requested" | "approval_resolved" | "audit_event" | "error";
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
export type DrenyraBrainItemContent = {
    text: string;
} | {
    runId: string;
    status: AgentRunStatus;
    summary?: string;
} | DrenyraBrainWebResearchContent | DrenyraBrainApprovalLinkContent | {
    message: string;
    code?: string;
};
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
export type DrenyraBrainEventType = "thread_created" | "turn_started" | "item_appended" | "turn_completed" | "turn_failed" | "approval_updated";
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
//# sourceMappingURL=types.d.ts.map