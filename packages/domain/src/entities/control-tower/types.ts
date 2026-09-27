import type {
	AgentRunOutput,
	AgentRunStatus,
	ApprovalDiffPayload,
	ApprovalStatus,
	AuditEventType,
	AutonomyLevel,
	DrenyraAgentType,
	EvidenceType,
	FiscalCaseStatus,
	FiscalCaseType,
	FiscalRiskLevel,
	FiscalScope,
} from "../../drenyra/types";

export type {
	AgentRunOutput,
	AgentRunStatus,
	ApprovalDiffPayload,
	ApprovalStatus,
	AuditEventType,
	AutonomyLevel,
	DrenyraAgentType,
	EvidenceType,
	FiscalCaseStatus,
	FiscalCaseType,
	FiscalRiskLevel,
	FiscalScope,
};

export interface FiscalCaseProps {
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
	createdAt: Date;
	updatedAt: Date;
	metadata: Record<string, unknown>;
}

export interface FiscalCasePrimitiveData {
	id: string;
	scope: {
		companyId: string;
		companyRuc: string;
		organizationId?: string | undefined | undefined;
		period: string;
		countryCode: string;
	};
	type: string;
	status: string;
	title: string;
	description: string;
	riskLevel: string;
	riskScore: number;
	autonomyLevel: string;
	createdBy: string;
	createdAt: string | Date;
	updatedAt: string | Date;
	metadata?: Record<string, unknown>;
}

export interface EvidenceItemProps {
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
	createdAt: Date;
	metadata: Record<string, unknown>;
}

export interface EvidenceItemPrimitiveData {
	id: string;
	caseId: string;
	scope: {
		companyId: string;
		companyRuc: string;
		organizationId?: string | undefined | undefined;
		period: string;
		countryCode: string;
	};
	type: string;
	title: string;
	summary: string;
	source: string;
	sourceRef?: string | undefined;
	contentHash: string;
	addedBy: string;
	createdAt: string | Date;
	metadata?: Record<string, unknown>;
}

export interface AgentRunProps {
	id: string;
	caseId: string;
	scope: FiscalScope;
	agentType: DrenyraAgentType;
	status: AgentRunStatus;
	startedBy: string;
	startedAt: Date;
	completedAt?: Date | undefined;
	output?: AgentRunOutput | undefined;
	metadata: Record<string, unknown>;
	updatedAt: Date;
}

export interface AgentRunPrimitiveData {
	id: string;
	caseId: string;
	scope: {
		companyId: string;
		companyRuc: string;
		organizationId?: string | undefined | undefined;
		period: string;
		countryCode: string;
	};
	agentType: string;
	status: string;
	startedBy: string;
	startedAt: string | Date;
	completedAt?: string | Date | undefined;
	output?: AgentRunOutput | undefined;
	metadata?: Record<string, unknown>;
	updatedAt?: string | Date | undefined;
}

export interface ApprovalRequestProps {
	id: string;
	caseId: string;
	scope: FiscalScope;
	status: ApprovalStatus;
	title: string;
	description: string;
	autonomyLevel: AutonomyLevel;
	requestedBy: string;
	requestedAt: Date;
	decidedBy?: string | undefined;
	decidedAt?: Date | undefined;
	decisionReason?: string | undefined;
	diff: ApprovalDiffPayload;
	metadata: Record<string, unknown>;
}

export interface ApprovalRequestPrimitiveData {
	id: string;
	caseId: string;
	scope: {
		companyId: string;
		companyRuc: string;
		organizationId?: string | undefined | undefined;
		period: string;
		countryCode: string;
	};
	status: string;
	title: string;
	description: string;
	autonomyLevel: string;
	requestedBy: string;
	requestedAt: string | Date;
	decidedBy?: string | undefined;
	decidedAt?: string | Date | undefined;
	decisionReason?: string | undefined;
	diff: ApprovalDiffPayload;
	metadata?: Record<string, unknown>;
}

export interface AuditEventProps {
	id: string;
	caseId?: string | undefined;
	scope: FiscalScope;
	eventType: AuditEventType;
	actorId: string;
	message: string;
	occurredAt: Date;
	metadata: Record<string, unknown>;
}

export interface AuditEventPrimitiveData {
	id: string;
	caseId?: string | undefined;
	scope: {
		companyId: string;
		companyRuc: string;
		organizationId?: string | undefined | undefined;
		period: string;
		countryCode: string;
	};
	eventType: string;
	actorId: string;
	message: string;
	occurredAt: string | Date;
	metadata?: Record<string, unknown>;
}
