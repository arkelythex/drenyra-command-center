import type { AuditEventType } from "@arkelythex/domain/drenyra";
import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
} from "@arkelythex/domain/entities";
import type {
	ControlTowerAuditEventFilters,
	ControlTowerRepository,
	ControlTowerScopeGuard,
} from "@arkelythex/domain/repositories/control-tower.repository";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../client";
import {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "../../schema";
import {
	agentRunEntityToRow,
	approvalRequestEntityToRow,
	auditEventEntityToRow,
	evidenceItemEntityToRow,
	fiscalCaseEntityToRow,
} from "./entity-mappers";

type ScopeGuard = ControlTowerScopeGuard;

function scopeConditions(
	table: { companyId: any; companyRuc: any; period: any; organizationId: any },
	scope: ScopeGuard,
) {
	return [
		eq(table.companyId, scope.companyId),
		eq(table.companyRuc, scope.companyRuc),
		eq(table.period, scope.period),
		eq(table.organizationId, scope.organizationId),
	];
}

export class ControlTowerPostgresRepository implements ControlTowerRepository {
	async createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase> {
		await db
			.insert(drenyraFiscalCases)
			.values(fiscalCaseEntityToRow(fiscalCase));
		return fiscalCase;
	}

	async listFiscalCases(scope: ScopeGuard): Promise<FiscalCase[]> {
		const rows = await db
			.select()
			.from(drenyraFiscalCases)
			.where(and(...scopeConditions(drenyraFiscalCases, scope)))
			.orderBy(desc(drenyraFiscalCases.createdAt));
		return rows.map(mapFiscalCaseRow);
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
					...scopeConditions(drenyraFiscalCases, scope),
				),
			)
			.limit(1);
		return rows[0] ? mapFiscalCaseRow(rows[0]) : null;
	}

	async updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase> {
		const json = fiscalCase.toJSON();
		const s = json.scope as Record<string, unknown>;
		await db
			.update(drenyraFiscalCases)
			.set(fiscalCaseEntityToRow(fiscalCase))
			.where(
				and(
					eq(drenyraFiscalCases.id, fiscalCase.id),
					eq(drenyraFiscalCases.companyId, s.companyId as string),
					eq(drenyraFiscalCases.companyRuc, s.companyRuc as string),
					eq(drenyraFiscalCases.period, s.period as string),
					eq(drenyraFiscalCases.organizationId, s.organizationId as string),
				),
			);
		return fiscalCase;
	}

	async addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem> {
		await db.insert(drenyraEvidenceItems).values(evidenceItemEntityToRow(item));
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
					...scopeConditions(drenyraEvidenceItems, scope),
				),
			)
			.orderBy(desc(drenyraEvidenceItems.createdAt));
		return rows.map(mapEvidenceRow);
	}

	async createAgentRun(run: AgentRun): Promise<AgentRun> {
		await db.insert(drenyraAgentRuns).values(agentRunEntityToRow(run));
		return run;
	}

	async updateAgentRun(run: AgentRun): Promise<AgentRun> {
		const json = run.toJSON();
		const s = json.scope as Record<string, unknown>;
		await db
			.update(drenyraAgentRuns)
			.set(agentRunEntityToRow(run))
			.where(
				and(
					eq(drenyraAgentRuns.id, run.id),
					eq(drenyraAgentRuns.companyId, s.companyId as string),
					eq(drenyraAgentRuns.companyRuc, s.companyRuc as string),
					eq(drenyraAgentRuns.period, s.period as string),
					eq(drenyraAgentRuns.organizationId, s.organizationId as string),
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
					...scopeConditions(drenyraAgentRuns, scope),
				),
			)
			.orderBy(desc(drenyraAgentRuns.startedAt));
		return rows.map(mapAgentRunRow);
	}

	async createApprovalRequest(
		request: ApprovalRequest,
	): Promise<ApprovalRequest> {
		await db
			.insert(drenyraApprovalRequests)
			.values(approvalRequestEntityToRow(request));
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
					...scopeConditions(drenyraApprovalRequests, scope),
				),
			)
			.limit(1);
		return rows[0] ? mapApprovalRow(rows[0]) : null;
	}

	async updateApprovalRequest(
		request: ApprovalRequest,
	): Promise<ApprovalRequest> {
		const json = request.toJSON();
		const s = json.scope as Record<string, unknown>;
		await db
			.update(drenyraApprovalRequests)
			.set(approvalRequestEntityToRow(request))
			.where(
				and(
					eq(drenyraApprovalRequests.id, request.id),
					eq(drenyraApprovalRequests.companyId, s.companyId as string),
					eq(drenyraApprovalRequests.companyRuc, s.companyRuc as string),
					eq(drenyraApprovalRequests.period, s.period as string),
					eq(
						drenyraApprovalRequests.organizationId,
						s.organizationId as string,
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
					...scopeConditions(drenyraApprovalRequests, scope),
				),
			)
			.orderBy(desc(drenyraApprovalRequests.requestedAt));
		return rows.map(mapApprovalRow);
	}

	async createAuditEvent(event: AuditEvent): Promise<AuditEvent> {
		await db.insert(drenyraAuditEvents).values(auditEventEntityToRow(event));
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
					...scopeConditions(drenyraAuditEvents, scope),
				),
			)
			.orderBy(desc(drenyraAuditEvents.occurredAt));
		return rows.map(mapAuditRow);
	}

	async listScopedAuditEvents(
		scope: ScopeGuard,
		filters?: ControlTowerAuditEventFilters,
	): Promise<AuditEvent[]> {
		const predicates = [...scopeConditions(drenyraAuditEvents, scope)];
		if (filters?.caseId)
			predicates.push(eq(drenyraAuditEvents.caseId, filters.caseId));
		if (filters?.eventTypes?.length) {
			predicates.push(
				inArray(drenyraAuditEvents.eventType, [...filters.eventTypes]),
			);
		}
		const rows = await db
			.select()
			.from(drenyraAuditEvents)
			.where(and(...predicates))
			.orderBy(desc(drenyraAuditEvents.occurredAt))
			.limit(filters?.limit ?? 100);
		return rows.map(mapAuditRow);
	}
}

function mapFiscalCaseRow(
	row: typeof drenyraFiscalCases.$inferSelect,
): FiscalCase {
	return FiscalCase.fromPrimitives({
		id: row.id,
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ?? undefined,
			period: row.period,
			countryCode: row.countryCode,
		},
		type: row.type,
		status: row.status,
		title: row.title,
		description: row.description,
		riskLevel: row.riskLevel,
		riskScore: row.riskScore,
		autonomyLevel: row.autonomyLevel,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		metadata: row.metadata,
	});
}

function mapEvidenceRow(
	row: typeof drenyraEvidenceItems.$inferSelect,
): EvidenceItem {
	return EvidenceItem.fromPrimitives({
		id: row.id,
		caseId: row.caseId,
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ?? undefined,
			period: row.period,
			countryCode: row.countryCode,
		},
		type: row.type,
		title: row.title,
		summary: row.summary,
		source: row.source,
		sourceRef: row.sourceRef ?? undefined,
		contentHash: row.contentHash,
		addedBy: row.addedBy,
		createdAt: row.createdAt,
		metadata: row.metadata,
	});
}

function mapAgentRunRow(row: typeof drenyraAgentRuns.$inferSelect): AgentRun {
	return AgentRun.fromPrimitives({
		id: row.id,
		caseId: row.caseId,
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ?? undefined,
			period: row.period,
			countryCode: row.countryCode,
		},
		agentType: row.agentType,
		status: row.status,
		startedBy: row.startedBy,
		startedAt: row.startedAt,
		completedAt: row.completedAt ?? undefined,
		output: row.output ?? undefined,
		metadata: row.metadata,
	});
}

function mapApprovalRow(
	row: typeof drenyraApprovalRequests.$inferSelect,
): ApprovalRequest {
	return ApprovalRequest.fromPrimitives({
		id: row.id,
		caseId: row.caseId,
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ?? undefined,
			period: row.period,
			countryCode: row.countryCode,
		},
		status: row.status,
		title: row.title,
		description: row.description,
		autonomyLevel: row.autonomyLevel,
		requestedBy: row.requestedBy,
		requestedAt: row.requestedAt,
		decidedBy: row.decidedBy ?? undefined,
		decidedAt: row.decidedAt ?? undefined,
		decisionReason: row.decisionReason ?? undefined,
		diff: row.diff,
		metadata: row.metadata,
	});
}

function mapAuditRow(row: typeof drenyraAuditEvents.$inferSelect): AuditEvent {
	return AuditEvent.fromPrimitives({
		id: row.id,
		caseId: row.caseId ?? undefined,
		scope: {
			companyId: row.companyId,
			companyRuc: row.companyRuc,
			organizationId: row.organizationId ?? undefined,
			period: row.period,
			countryCode: row.countryCode,
		},
		eventType: row.eventType,
		actorId: row.actorId,
		message: row.message,
		occurredAt: row.occurredAt,
		metadata: row.metadata,
	});
}
