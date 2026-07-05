import type {
	DrenyraAuditEventFilter,
	DrenyraAuditEventFilters,
	DrenyraRepository,
	DrenyraScopeGuard,
} from "@drenyra/application/drenyra";
import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
	FiscalScope,
} from "@drenyra/domain/drenyra";
import { db } from "../client";
import { and, desc, eq, inArray } from "../query";
import {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "../schema/drenyra-command-center.schema";

type ScopeGuard = DrenyraScopeGuard;

type FiscalCaseRow = typeof drenyraFiscalCases.$inferSelect;
type EvidenceRow = typeof drenyraEvidenceItems.$inferSelect;
type AgentRunRow = typeof drenyraAgentRuns.$inferSelect;
type ApprovalRow = typeof drenyraApprovalRequests.$inferSelect;
type AuditRow = typeof drenyraAuditEvents.$inferSelect;

function rowScope(row: {
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

function toDate(value: string): Date {
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		throw new Error(`Invalid Drenyra date: ${value}`);
	}
	return parsed;
}

function toIso(value: Date): string {
	return value.toISOString();
}

function mapFiscalCase(row: FiscalCaseRow): FiscalCase {
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

function fiscalCaseValues(
	fiscalCase: FiscalCase,
): typeof drenyraFiscalCases.$inferInsert {
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

function mapEvidence(row: EvidenceRow): EvidenceItem {
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

function evidenceValues(
	item: EvidenceItem,
): typeof drenyraEvidenceItems.$inferInsert {
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

function mapAgentRun(row: AgentRunRow): AgentRun {
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

function agentRunValues(run: AgentRun): typeof drenyraAgentRuns.$inferInsert {
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

function mapApproval(row: ApprovalRow): ApprovalRequest {
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

function approvalValues(
	request: ApprovalRequest,
): typeof drenyraApprovalRequests.$inferInsert {
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

function mapAudit(row: AuditRow): AuditEvent {
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

function requireOrganizationId(scope: FiscalScope): string {
	if (!scope.organizationId) {
		throw new Error("DRENYRA_ORGANIZATION_SCOPE_REQUIRED");
	}
	return scope.organizationId;
}

function auditValues(
	event: AuditEvent,
): typeof drenyraAuditEvents.$inferInsert {
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

export class PostgresDrenyraRepository implements DrenyraRepository {
	async createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase> {
		await db.insert(drenyraFiscalCases).values(fiscalCaseValues(fiscalCase));
		return fiscalCase;
	}

	async listFiscalCases(scope: ScopeGuard): Promise<FiscalCase[]> {
		const rows = await db
			.select()
			.from(drenyraFiscalCases)
			.where(
				and(
					eq(drenyraFiscalCases.companyId, scope.companyId),
					eq(drenyraFiscalCases.companyRuc, scope.companyRuc),
					eq(drenyraFiscalCases.period, scope.period),
					eq(drenyraFiscalCases.organizationId, scope.organizationId),
				),
			)
			.orderBy(desc(drenyraFiscalCases.createdAt));
		return rows.map(mapFiscalCase);
	}

	async getFiscalCaseById(
		id: string,
		scope: ScopeGuard,
	): Promise<FiscalCase | null> {
		const rows = await db
			.select()
			.from(drenyraFiscalCases)
			.where(
				and(
					eq(drenyraFiscalCases.id, id),
					eq(drenyraFiscalCases.companyId, scope.companyId),
					eq(drenyraFiscalCases.companyRuc, scope.companyRuc),
					eq(drenyraFiscalCases.period, scope.period),
					eq(drenyraFiscalCases.organizationId, scope.organizationId),
				),
			)
			.limit(1);
		return rows[0] ? mapFiscalCase(rows[0]) : null;
	}

	async updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase> {
		await db
			.update(drenyraFiscalCases)
			.set(fiscalCaseValues(fiscalCase))
			.where(
				and(
					eq(drenyraFiscalCases.id, fiscalCase.id),
					eq(drenyraFiscalCases.companyId, fiscalCase.scope.companyId),
					eq(drenyraFiscalCases.companyRuc, fiscalCase.scope.companyRuc),
					eq(drenyraFiscalCases.period, fiscalCase.scope.period),
					eq(
						drenyraFiscalCases.organizationId,
						requireOrganizationId(fiscalCase.scope),
					),
				),
			);
		return fiscalCase;
	}

	async addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem> {
		await db.insert(drenyraEvidenceItems).values(evidenceValues(item));
		return item;
	}

	async listEvidence(
		caseId: string,
		scope: ScopeGuard,
	): Promise<EvidenceItem[]> {
		const rows = await db
			.select()
			.from(drenyraEvidenceItems)
			.where(
				and(
					eq(drenyraEvidenceItems.caseId, caseId),
					eq(drenyraEvidenceItems.companyId, scope.companyId),
					eq(drenyraEvidenceItems.companyRuc, scope.companyRuc),
					eq(drenyraEvidenceItems.period, scope.period),
					eq(drenyraEvidenceItems.organizationId, scope.organizationId),
				),
			)
			.orderBy(desc(drenyraEvidenceItems.createdAt));
		return rows.map(mapEvidence);
	}

	async createAgentRun(run: AgentRun): Promise<AgentRun> {
		await db.insert(drenyraAgentRuns).values(agentRunValues(run));
		return run;
	}

	async updateAgentRun(run: AgentRun): Promise<AgentRun> {
		await db
			.update(drenyraAgentRuns)
			.set(agentRunValues(run))
			.where(
				and(
					eq(drenyraAgentRuns.id, run.id),
					eq(drenyraAgentRuns.companyId, run.scope.companyId),
					eq(drenyraAgentRuns.companyRuc, run.scope.companyRuc),
					eq(drenyraAgentRuns.period, run.scope.period),
					eq(drenyraAgentRuns.organizationId, requireOrganizationId(run.scope)),
				),
			);
		return run;
	}

	async listAgentRuns(caseId: string, scope: ScopeGuard): Promise<AgentRun[]> {
		const rows = await db
			.select()
			.from(drenyraAgentRuns)
			.where(
				and(
					eq(drenyraAgentRuns.caseId, caseId),
					eq(drenyraAgentRuns.companyId, scope.companyId),
					eq(drenyraAgentRuns.companyRuc, scope.companyRuc),
					eq(drenyraAgentRuns.period, scope.period),
					eq(drenyraAgentRuns.organizationId, scope.organizationId),
				),
			)
			.orderBy(desc(drenyraAgentRuns.startedAt));
		return rows.map(mapAgentRun);
	}

	async createApprovalRequest(
		request: ApprovalRequest,
	): Promise<ApprovalRequest> {
		await db.insert(drenyraApprovalRequests).values(approvalValues(request));
		return request;
	}

	async getApprovalRequestById(
		id: string,
		scope: ScopeGuard,
	): Promise<ApprovalRequest | null> {
		const rows = await db
			.select()
			.from(drenyraApprovalRequests)
			.where(
				and(
					eq(drenyraApprovalRequests.id, id),
					eq(drenyraApprovalRequests.companyId, scope.companyId),
					eq(drenyraApprovalRequests.companyRuc, scope.companyRuc),
					eq(drenyraApprovalRequests.period, scope.period),
					eq(drenyraApprovalRequests.organizationId, scope.organizationId),
				),
			)
			.limit(1);
		return rows[0] ? mapApproval(rows[0]) : null;
	}

	async updateApprovalRequest(
		request: ApprovalRequest,
	): Promise<ApprovalRequest> {
		await db
			.update(drenyraApprovalRequests)
			.set(approvalValues(request))
			.where(
				and(
					eq(drenyraApprovalRequests.id, request.id),
					eq(drenyraApprovalRequests.companyId, request.scope.companyId),
					eq(drenyraApprovalRequests.companyRuc, request.scope.companyRuc),
					eq(drenyraApprovalRequests.period, request.scope.period),
					eq(
						drenyraApprovalRequests.organizationId,
						requireOrganizationId(request.scope),
					),
				),
			);
		return request;
	}

	async listApprovalRequests(
		caseId: string,
		scope: ScopeGuard,
	): Promise<ApprovalRequest[]> {
		const rows = await db
			.select()
			.from(drenyraApprovalRequests)
			.where(
				and(
					eq(drenyraApprovalRequests.caseId, caseId),
					eq(drenyraApprovalRequests.companyId, scope.companyId),
					eq(drenyraApprovalRequests.companyRuc, scope.companyRuc),
					eq(drenyraApprovalRequests.period, scope.period),
					eq(drenyraApprovalRequests.organizationId, scope.organizationId),
				),
			)
			.orderBy(desc(drenyraApprovalRequests.requestedAt));
		return rows.map(mapApproval);
	}

	async createAuditEvent(event: AuditEvent): Promise<AuditEvent> {
		await db.insert(drenyraAuditEvents).values(auditValues(event));
		return event;
	}

	async listAuditEvents(
		caseId: string,
		scope: ScopeGuard,
	): Promise<AuditEvent[]> {
		const rows = await db
			.select()
			.from(drenyraAuditEvents)
			.where(
				and(
					eq(drenyraAuditEvents.caseId, caseId),
					eq(drenyraAuditEvents.companyId, scope.companyId),
					eq(drenyraAuditEvents.companyRuc, scope.companyRuc),
					eq(drenyraAuditEvents.period, scope.period),
					eq(drenyraAuditEvents.organizationId, scope.organizationId),
				),
			)
			.orderBy(desc(drenyraAuditEvents.occurredAt));
		return rows.map(mapAudit);
	}

	async listScopedAuditEvents(
		scope: ScopeGuard,
		filters: DrenyraAuditEventFilters = {},
	): Promise<AuditEvent[]> {
		const predicates = [
			eq(drenyraAuditEvents.companyId, scope.companyId),
			eq(drenyraAuditEvents.companyRuc, scope.companyRuc),
			eq(drenyraAuditEvents.period, scope.period),
			eq(drenyraAuditEvents.organizationId, scope.organizationId),
		];
		if (filters.caseId)
			predicates.push(eq(drenyraAuditEvents.caseId, filters.caseId));
		if (filters.eventTypes?.length)
			predicates.push(
				inArray(drenyraAuditEvents.eventType, [...filters.eventTypes]),
			);
		const rows = await db
			.select()
			.from(drenyraAuditEvents)
			.where(and(...predicates))
			.orderBy(desc(drenyraAuditEvents.occurredAt))
			.limit(filters.limit ?? 100);
		return rows.map(mapAudit);
	}

	async listCommandAuditEvents(
		scope: ScopeGuard,
		filter: DrenyraAuditEventFilter = {},
	): Promise<AuditEvent[]> {
		const conditions = [
			eq(drenyraAuditEvents.companyId, scope.companyId),
			eq(drenyraAuditEvents.companyRuc, scope.companyRuc),
			eq(drenyraAuditEvents.period, scope.period),
			eq(drenyraAuditEvents.organizationId, scope.organizationId),
			inArray(drenyraAuditEvents.eventType, [
				"CAPABILITY_ALLOWED",
				"CAPABILITY_DENIED",
			]),
		];
		if (filter.caseId)
			conditions.push(eq(drenyraAuditEvents.caseId, filter.caseId));
		if (filter.eventType)
			conditions.push(eq(drenyraAuditEvents.eventType, filter.eventType));

		const rows = await db
			.select()
			.from(drenyraAuditEvents)
			.where(and(...conditions))
			.orderBy(desc(drenyraAuditEvents.occurredAt));
		return rows
			.map(mapAudit)
			.filter(
				(event) =>
					!filter.commandId || event.metadata.commandId === filter.commandId,
			);
	}
}
