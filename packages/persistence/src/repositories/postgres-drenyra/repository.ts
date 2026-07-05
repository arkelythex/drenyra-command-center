import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
} from "@drenyra/domain/drenyra";
import type { DrenyraAuditEventFilter, DrenyraAuditEventFilters, DrenyraRepository } from "@drenyra/application/drenyra";
import { and, desc, eq, inArray } from "../../query";
import { db } from "../../client";
import {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "../../schema/drenyra-command-center.schema";
import type { ScopeGuard } from "./types";
import {
	agentRunValues,
	approvalValues,
	auditValues,
	evidenceValues,
	fiscalCaseValues,
	mapAgentRun,
	mapApproval,
	mapAudit,
	mapEvidence,
	mapFiscalCase,
	requireOrganizationId,
} from "./mappers";

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

	async getFiscalCaseById(id: string, scope: ScopeGuard): Promise<FiscalCase | null> {
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
					eq(drenyraFiscalCases.organizationId, requireOrganizationId(fiscalCase.scope)),
				),
			);
		return fiscalCase;
	}

	async addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem> {
		await db.insert(drenyraEvidenceItems).values(evidenceValues(item));
		return item;
	}

	async listEvidence(caseId: string, scope: ScopeGuard): Promise<EvidenceItem[]> {
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

	async createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest> {
		await db.insert(drenyraApprovalRequests).values(approvalValues(request));
		return request;
	}

	async getApprovalRequestById(id: string, scope: ScopeGuard): Promise<ApprovalRequest | null> {
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

	async updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest> {
		await db
			.update(drenyraApprovalRequests)
			.set(approvalValues(request))
			.where(
				and(
					eq(drenyraApprovalRequests.id, request.id),
					eq(drenyraApprovalRequests.companyId, request.scope.companyId),
					eq(drenyraApprovalRequests.companyRuc, request.scope.companyRuc),
					eq(drenyraApprovalRequests.period, request.scope.period),
					eq(drenyraApprovalRequests.organizationId, requireOrganizationId(request.scope)),
				),
			);
		return request;
	}

	async listApprovalRequests(caseId: string, scope: ScopeGuard): Promise<ApprovalRequest[]> {
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

	async listAuditEvents(caseId: string, scope: ScopeGuard): Promise<AuditEvent[]> {
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

	async listScopedAuditEvents(scope: ScopeGuard, filters: DrenyraAuditEventFilters = {}): Promise<AuditEvent[]> {
		const predicates = [
			eq(drenyraAuditEvents.companyId, scope.companyId),
			eq(drenyraAuditEvents.companyRuc, scope.companyRuc),
			eq(drenyraAuditEvents.period, scope.period),
			eq(drenyraAuditEvents.organizationId, scope.organizationId),
		];
		if (filters.caseId) predicates.push(eq(drenyraAuditEvents.caseId, filters.caseId));
		if (filters.eventTypes?.length) predicates.push(inArray(drenyraAuditEvents.eventType, [...filters.eventTypes]));
		const rows = await db
			.select()
			.from(drenyraAuditEvents)
			.where(and(...predicates))
			.orderBy(desc(drenyraAuditEvents.occurredAt))
			.limit(filters.limit ?? 100);
		return rows.map(mapAudit);
	}

	async listCommandAuditEvents(scope: ScopeGuard, filter: DrenyraAuditEventFilter = {}): Promise<AuditEvent[]> {
		const conditions = [
			eq(drenyraAuditEvents.companyId, scope.companyId),
			eq(drenyraAuditEvents.companyRuc, scope.companyRuc),
			eq(drenyraAuditEvents.period, scope.period),
			eq(drenyraAuditEvents.organizationId, scope.organizationId),
			inArray(drenyraAuditEvents.eventType, ["CAPABILITY_ALLOWED", "CAPABILITY_DENIED"]),
		];
		if (filter.caseId) conditions.push(eq(drenyraAuditEvents.caseId, filter.caseId));
		if (filter.eventType) conditions.push(eq(drenyraAuditEvents.eventType, filter.eventType));

		const rows = await db
			.select()
			.from(drenyraAuditEvents)
			.where(and(...conditions))
			.orderBy(desc(drenyraAuditEvents.occurredAt));
		return rows
			.map(mapAudit)
			.filter((event) => !filter.commandId || event.metadata.commandId === filter.commandId);
	}
}
