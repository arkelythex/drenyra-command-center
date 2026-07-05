import type {
	AgentRun,
	ApprovalDiffPayload,
	AutonomyLevel,
	DrenyraFiscalWorkInspectSourceSurface,
	EvidenceType,
	FiscalCase,
	FiscalCaseStatus,
	FiscalCaseType,
	FiscalRiskLevel,
} from "@drenyra/domain/drenyra";
import type { DrenyraAuditEventFilters } from "../repository";

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

/**
 * Input for an audited manual fiscal case status transition.
 *
 * @example
 * const input: UpdateFiscalCaseStatusInput = { status: "IN_REVIEW", reason: "Human review started" };
 */
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
