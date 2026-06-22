import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
	FiscalScope,
} from "@arkelythex/domain/drenyra";
import {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "../../schema/drenyra-command-center.schema";
import type { FiscalCaseRow, EvidenceRow, AgentRunRow, ApprovalRow, AuditRow } from "./types";

export function rowScope(row: {
	companyId: string;
	companyRuc: string;
	organizationId: string | null;
	period: string;
	countryCode: string;
}): FiscalScope {
	return {
		companyId: row.companyId,
		companyRuc: row.companyRuc,
		organizationId: row.organizationId ?? undefined,
		period: row.period,
		countryCode: "PE",
	};
}

export function toDate(value: string): Date {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Invalid Drenyra date: ${value}`);
	}
	return parsed;
}

export function toIso(value: Date): string {
	return value.toISOString();
}

export function mapFiscalCase(row: FiscalCaseRow): FiscalCase {
	return {
		id: row.id,
		scope: rowScope(row),
		type: row.type,
		status: row.status,
		title: row.title,
		description: row.description,
		riskLevel: row.riskLevel,
		riskScore: row.riskScore,
		autonomyLevel: row.autonomyLevel,
		createdBy: row.createdBy,
		createdAt: toIso(row.createdAt),
		updatedAt: toIso(row.updatedAt),
		metadata: row.metadata,
	};
}

export function fiscalCaseValues(fiscalCase: FiscalCase): typeof drenyraFiscalCases.$inferInsert {
	return {
		id: fiscalCase.id,
		companyId: fiscalCase.scope.companyId,
		companyRuc: fiscalCase.scope.companyRuc,
		organizationId: fiscalCase.scope.organizationId,
		period: fiscalCase.scope.period,
		countryCode: fiscalCase.scope.countryCode,
		type: fiscalCase.type,
		status: fiscalCase.status,
		title: fiscalCase.title,
		description: fiscalCase.description,
		riskLevel: fiscalCase.riskLevel,
		riskScore: fiscalCase.riskScore,
		autonomyLevel: fiscalCase.autonomyLevel,
		createdBy: fiscalCase.createdBy,
		createdAt: toDate(fiscalCase.createdAt),
		updatedAt: toDate(fiscalCase.updatedAt),
		metadata: fiscalCase.metadata,
	};
}

export function mapEvidence(row: EvidenceRow): EvidenceItem {
	return {
		id: row.id,
		caseId: row.caseId,
		scope: rowScope(row),
		type: row.type,
		title: row.title,
		summary: row.summary,
		source: row.source,
		sourceRef: row.sourceRef ?? undefined,
		contentHash: row.contentHash,
		addedBy: row.addedBy,
		createdAt: toIso(row.createdAt),
		metadata: row.metadata,
	};
}

export function evidenceValues(item: EvidenceItem): typeof drenyraEvidenceItems.$inferInsert {
	return {
		id: item.id,
		caseId: item.caseId,
		companyId: item.scope.companyId,
		companyRuc: item.scope.companyRuc,
		organizationId: item.scope.organizationId,
		period: item.scope.period,
		countryCode: item.scope.countryCode,
		type: item.type,
		title: item.title,
		summary: item.summary,
		source: item.source,
		sourceRef: item.sourceRef,
		contentHash: item.contentHash,
		addedBy: item.addedBy,
		createdAt: toDate(item.createdAt),
		metadata: item.metadata,
	};
}

export function mapAgentRun(row: AgentRunRow): AgentRun {
	return {
		id: row.id,
		caseId: row.caseId,
		scope: rowScope(row),
		agentType: row.agentType,
		status: row.status,
		startedBy: row.startedBy,
		startedAt: toIso(row.startedAt),
		completedAt: row.completedAt ? toIso(row.completedAt) : undefined,
		output: row.output ?? undefined,
		metadata: row.metadata,
	};
}

export function agentRunValues(run: AgentRun): typeof drenyraAgentRuns.$inferInsert {
	return {
		id: run.id,
		caseId: run.caseId,
		companyId: run.scope.companyId,
		companyRuc: run.scope.companyRuc,
		organizationId: run.scope.organizationId,
		period: run.scope.period,
		countryCode: run.scope.countryCode,
		agentType: run.agentType,
		status: run.status,
		startedBy: run.startedBy,
		startedAt: toDate(run.startedAt),
		completedAt: run.completedAt ? toDate(run.completedAt) : undefined,
		output: run.output,
		metadata: run.metadata,
	};
}

export function mapApproval(row: ApprovalRow): ApprovalRequest {
	return {
		id: row.id,
		caseId: row.caseId,
		scope: rowScope(row),
		status: row.status,
		title: row.title,
		description: row.description,
		autonomyLevel: row.autonomyLevel,
		requestedBy: row.requestedBy,
		requestedAt: toIso(row.requestedAt),
		decidedBy: row.decidedBy ?? undefined,
		decidedAt: row.decidedAt ? toIso(row.decidedAt) : undefined,
		decisionReason: row.decisionReason ?? undefined,
		diff: row.diff,
		metadata: row.metadata,
	};
}

export function approvalValues(request: ApprovalRequest): typeof drenyraApprovalRequests.$inferInsert {
	return {
		id: request.id,
		caseId: request.caseId,
		companyId: request.scope.companyId,
		companyRuc: request.scope.companyRuc,
		organizationId: request.scope.organizationId,
		period: request.scope.period,
		countryCode: request.scope.countryCode,
		status: request.status,
		title: request.title,
		description: request.description,
		autonomyLevel: request.autonomyLevel,
		requestedBy: request.requestedBy,
		requestedAt: toDate(request.requestedAt),
		decidedBy: request.decidedBy,
		decidedAt: request.decidedAt ? toDate(request.decidedAt) : undefined,
		decisionReason: request.decisionReason,
		diff: request.diff,
		metadata: request.metadata,
	};
}

export function requireOrganizationId(scope: FiscalScope): string {
	if (!scope.organizationId) {
		throw new Error("DRENYRA_ORGANIZATION_SCOPE_REQUIRED");
	}
	return scope.organizationId;
}

export function mapAudit(row: AuditRow): AuditEvent {
	return {
		id: row.id,
		caseId: row.caseId ?? undefined,
		scope: rowScope(row),
		eventType: row.eventType,
		actorId: row.actorId,
		message: row.message,
		occurredAt: toIso(row.occurredAt),
		metadata: row.metadata,
	};
}

export function auditValues(event: AuditEvent): typeof drenyraAuditEvents.$inferInsert {
	return {
		id: event.id,
		caseId: event.caseId,
		companyId: event.scope.companyId,
		companyRuc: event.scope.companyRuc,
		organizationId: event.scope.organizationId,
		period: event.scope.period,
		countryCode: event.scope.countryCode,
		eventType: event.eventType,
		actorId: event.actorId,
		message: event.message,
		occurredAt: toDate(event.occurredAt),
		metadata: event.metadata,
	};
}
