import { type AgentRun, type ApprovalDiffPayload, type ApprovalRequest, type AuditEvent, type AutonomyLevel, type DrenyraFiscalWorkInspectEnvelope, type DrenyraFiscalWorkInspectSourceSurface, type EvidenceItem, type EvidenceType, type FiscalCase, type FiscalCaseDetails, type FiscalCaseStatus, type FiscalCaseType, type FiscalRiskLevel, type DrenyraAgentType } from "@drenyra/domain/drenyra";
import type { DrenyraAuditEventFilter, DrenyraAuditEventFilters, DrenyraRepository } from "./repository";
export interface DrenyraActorContext {
    companyId: string;
    companyRuc: string;
    organizationId: string;
    period: string;
    userId: string;
}
export interface CreateFiscalCaseInput {
    type: FiscalCaseType;
    title: string;
    description: string;
    riskLevel?: FiscalRiskLevel;
    riskScore?: number;
    autonomyLevel?: AutonomyLevel;
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
}
export interface BootstrapDocumentMissionInput {
    documentId: string;
    filename: string;
    mimeType?: string;
}
export interface BootstrapDocumentMissionResult {
    fiscalCase: FiscalCase;
    agentRun: AgentRun;
    agentStreamQuery: {
        documentId: string;
        filename: string;
        mimeType: string;
    };
}
export interface AddEvidenceInput {
    type: EvidenceType;
    title: string;
    summary: string;
    source: string;
    sourceRef?: string;
    contentHash?: string;
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
}
export interface UpdateFiscalCaseStatusInput {
    status: FiscalCaseStatus;
    reason?: string;
}
export interface RequestApprovalInput {
    title: string;
    description: string;
    autonomyLevel?: AutonomyLevel;
    diff: ApprovalDiffPayload;
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
}
export interface DecideApprovalInput {
    decisionReason?: string;
}
export type ListAuditEventsInput = DrenyraAuditEventFilters;
export interface InspectFiscalWorkItemInput {
    workItemId: string;
    capabilityGranted: boolean;
    traceId?: string;
    sourceSurface?: DrenyraFiscalWorkInspectSourceSurface;
}
export declare class DrenyraFiscalCommandCenterService {
    private readonly repository;
    constructor(repository: DrenyraRepository);
    createFiscalCase(context: DrenyraActorContext, input: CreateFiscalCaseInput): Promise<FiscalCase>;
    bootstrapDocumentMission(context: DrenyraActorContext, input: BootstrapDocumentMissionInput): Promise<BootstrapDocumentMissionResult>;
    listFiscalCases(context: DrenyraActorContext): Promise<FiscalCase[]>;
    getFiscalCaseDetails(context: DrenyraActorContext, caseId: string): Promise<FiscalCaseDetails | null>;
    listAuditEvents(context: DrenyraActorContext, input?: ListAuditEventsInput): Promise<AuditEvent[]>;
    inspectFiscalWorkItem(context: DrenyraActorContext, input: InspectFiscalWorkItemInput): Promise<DrenyraFiscalWorkInspectEnvelope>;
    listCommandAuditEvents(context: DrenyraActorContext, filter?: DrenyraAuditEventFilter): Promise<AuditEvent[]>;
    updateFiscalCaseStatus(context: DrenyraActorContext, caseId: string, input: UpdateFiscalCaseStatusInput): Promise<FiscalCase>;
    addEvidenceItem(context: DrenyraActorContext, caseId: string, input: AddEvidenceInput): Promise<EvidenceItem>;
    startAndCompleteMockAgentRun(context: DrenyraActorContext, caseId: string, agentType: DrenyraAgentType, idempotencyKey?: string): Promise<AgentRun>;
    listAgentRuns(context: DrenyraActorContext, caseId: string): Promise<AgentRun[]>;
    requestApproval(context: DrenyraActorContext, caseId: string, input: RequestApprovalInput): Promise<ApprovalRequest>;
    approveApprovalRequest(context: DrenyraActorContext, approvalId: string, input?: DecideApprovalInput): Promise<ApprovalRequest>;
    rejectApprovalRequest(context: DrenyraActorContext, approvalId: string, input?: DecideApprovalInput): Promise<ApprovalRequest>;
    private decideApproval;
    private writeAuditEvent;
}
//# sourceMappingURL=service.d.ts.map