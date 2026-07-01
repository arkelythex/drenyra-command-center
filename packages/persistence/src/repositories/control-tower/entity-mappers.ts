import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
} from "@arkelythex/domain/entities";
import type {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "../../schema/drenyra-command-center.schema";

export function fiscalCaseEntityToRow(
	entity: FiscalCase,
): typeof drenyraFiscalCases.$inferInsert {
	const json = entity.toJSON();
	return {
		id: json.id as string,
		companyId: (json.scope as Record<string, unknown>).companyId as string,
		companyRuc: (json.scope as Record<string, unknown>).companyRuc as string,
		organizationId: (json.scope as Record<string, unknown>).organizationId as
			| string
			| undefined,
		period: (json.scope as Record<string, unknown>).period as string,
		countryCode: (json.scope as Record<string, unknown>).countryCode as string,
		type: json.type as string,
		status: json.status as string,
		title: json.title as string,
		description: json.description as string,
		riskLevel: json.riskLevel as string,
		riskScore: json.riskScore as number,
		autonomyLevel: json.autonomyLevel as string,
		createdBy: json.createdBy as string,
		createdAt: new Date(json.createdAt as string),
		updatedAt: new Date(json.updatedAt as string),
		metadata: json.metadata as Record<string, unknown>,
	};
}

export function evidenceItemEntityToRow(
	entity: EvidenceItem,
): typeof drenyraEvidenceItems.$inferInsert {
	const json = entity.toJSON();
	return {
		id: json.id as string,
		caseId: json.caseId as string,
		companyId: (json.scope as Record<string, unknown>).companyId as string,
		companyRuc: (json.scope as Record<string, unknown>).companyRuc as string,
		organizationId: (json.scope as Record<string, unknown>).organizationId as
			| string
			| undefined,
		period: (json.scope as Record<string, unknown>).period as string,
		countryCode: (json.scope as Record<string, unknown>).countryCode as string,
		type: json.type as string,
		title: json.title as string,
		summary: json.summary as string,
		source: json.source as string,
		sourceRef: json.sourceRef as string | null,
		contentHash: json.contentHash as string,
		addedBy: json.addedBy as string,
		createdAt: new Date(json.createdAt as string),
		metadata: json.metadata as Record<string, unknown>,
	};
}

export function agentRunEntityToRow(
	entity: AgentRun,
): typeof drenyraAgentRuns.$inferInsert {
	const json = entity.toJSON();
	return {
		id: json.id as string,
		caseId: json.caseId as string,
		companyId: (json.scope as Record<string, unknown>).companyId as string,
		companyRuc: (json.scope as Record<string, unknown>).companyRuc as string,
		organizationId: (json.scope as Record<string, unknown>).organizationId as
			| string
			| undefined,
		period: (json.scope as Record<string, unknown>).period as string,
		countryCode: (json.scope as Record<string, unknown>).countryCode as string,
		agentType: json.agentType as string,
		status: json.status as string,
		startedBy: json.startedBy as string,
		startedAt: new Date(json.startedAt as string),
		completedAt: json.completedAt
			? new Date(json.completedAt as string)
			: undefined,
		output: json.output as Record<string, unknown> | undefined,
		metadata: json.metadata as Record<string, unknown>,
	};
}

export function approvalRequestEntityToRow(
	entity: ApprovalRequest,
): typeof drenyraApprovalRequests.$inferInsert {
	const json = entity.toJSON();
	return {
		id: json.id as string,
		caseId: json.caseId as string,
		companyId: (json.scope as Record<string, unknown>).companyId as string,
		companyRuc: (json.scope as Record<string, unknown>).companyRuc as string,
		organizationId: (json.scope as Record<string, unknown>).organizationId as
			| string
			| undefined,
		period: (json.scope as Record<string, unknown>).period as string,
		countryCode: (json.scope as Record<string, unknown>).countryCode as string,
		status: json.status as string,
		title: json.title as string,
		description: json.description as string,
		autonomyLevel: json.autonomyLevel as string,
		requestedBy: json.requestedBy as string,
		requestedAt: new Date(json.requestedAt as string),
		decidedBy: json.decidedBy as string | undefined,
		decidedAt: json.decidedAt ? new Date(json.decidedAt as string) : undefined,
		decisionReason: json.decisionReason as string | undefined,
		diff: json.diff as Record<string, unknown>,
		metadata: json.metadata as Record<string, unknown>,
	};
}

export function auditEventEntityToRow(
	entity: AuditEvent,
): typeof drenyraAuditEvents.$inferInsert {
	const json = entity.toJSON();
	return {
		id: json.id as string,
		caseId: json.caseId as string | undefined,
		companyId: (json.scope as Record<string, unknown>).companyId as string,
		companyRuc: (json.scope as Record<string, unknown>).companyRuc as string,
		organizationId: (json.scope as Record<string, unknown>).organizationId as
			| string
			| undefined,
		period: (json.scope as Record<string, unknown>).period as string,
		countryCode: (json.scope as Record<string, unknown>).countryCode as string,
		eventType: json.eventType as string,
		actorId: json.actorId as string,
		message: json.message as string,
		occurredAt: new Date(json.occurredAt as string),
		metadata: json.metadata as Record<string, unknown>,
	};
}
