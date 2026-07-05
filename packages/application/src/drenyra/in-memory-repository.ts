/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
	FiscalScope,
} from "@drenyra/domain/drenyra";
import type { DrenyraAuditEventFilter, DrenyraAuditEventFilters, DrenyraRepository, DrenyraScopeGuard } from "./repository";

function sameScope(entityScope: FiscalScope, scope: DrenyraScopeGuard): boolean {
	return (
		entityScope.companyId === scope.companyId &&
		entityScope.companyRuc === scope.companyRuc &&
		entityScope.period === scope.period &&
		entityScope.organizationId === scope.organizationId
	);
}

function byNewest<T extends { createdAt?: string; startedAt?: string; requestedAt?: string; occurredAt?: string }>(items: T[]): T[] {
	return [...items].sort((a, b) => {
		const aTime = a.createdAt ?? a.startedAt ?? a.requestedAt ?? a.occurredAt ?? "";
		const bTime = b.createdAt ?? b.startedAt ?? b.requestedAt ?? b.occurredAt ?? "";
		return bTime.localeCompare(aTime);
	});
}

export class InMemoryDrenyraRepository implements DrenyraRepository {
	private readonly fiscalCases = new Map<string, FiscalCase>();
	private readonly evidence = new Map<string, EvidenceItem>();
	private readonly agentRuns = new Map<string, AgentRun>();
	private readonly approvals = new Map<string, ApprovalRequest>();
	private readonly auditEvents = new Map<string, AuditEvent>();

	async createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase> {
		this.fiscalCases.set(fiscalCase.id, fiscalCase);
		return fiscalCase;
	}

	async listFiscalCases(scope: DrenyraScopeGuard): Promise<FiscalCase[]> {
		return byNewest([...this.fiscalCases.values()].filter((item) => sameScope(item.scope, scope)));
	}

	async getFiscalCaseById(id: string, scope: DrenyraScopeGuard): Promise<FiscalCase | null> {
		const fiscalCase = this.fiscalCases.get(id);
		return fiscalCase && sameScope(fiscalCase.scope, scope) ? fiscalCase : null;
	}

	async updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase> {
		this.fiscalCases.set(fiscalCase.id, fiscalCase);
		return fiscalCase;
	}

	async addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem> {
		this.evidence.set(item.id, item);
		return item;
	}

	async listEvidence(caseId: string, scope: DrenyraScopeGuard): Promise<EvidenceItem[]> {
		return byNewest([...this.evidence.values()].filter((item) => item.caseId === caseId && sameScope(item.scope, scope)));
	}

	async createAgentRun(run: AgentRun): Promise<AgentRun> {
		this.agentRuns.set(run.id, run);
		return run;
	}

	async updateAgentRun(run: AgentRun): Promise<AgentRun> {
		this.agentRuns.set(run.id, run);
		return run;
	}

	async listAgentRuns(caseId: string, scope: DrenyraScopeGuard): Promise<AgentRun[]> {
		return byNewest([...this.agentRuns.values()].filter((run) => run.caseId === caseId && sameScope(run.scope, scope)));
	}

	async createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest> {
		this.approvals.set(request.id, request);
		return request;
	}

	async getApprovalRequestById(id: string, scope: DrenyraScopeGuard): Promise<ApprovalRequest | null> {
		const request = this.approvals.get(id);
		return request && sameScope(request.scope, scope) ? request : null;
	}

	async updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest> {
		this.approvals.set(request.id, request);
		return request;
	}

	async listApprovalRequests(caseId: string, scope: DrenyraScopeGuard): Promise<ApprovalRequest[]> {
		return byNewest([...this.approvals.values()].filter((request) => request.caseId === caseId && sameScope(request.scope, scope)));
	}

	async createAuditEvent(event: AuditEvent): Promise<AuditEvent> {
		this.auditEvents.set(event.id, event);
		return event;
	}

	async listAuditEvents(caseId: string, scope: DrenyraScopeGuard): Promise<AuditEvent[]> {
		return byNewest([...this.auditEvents.values()].filter((event) => event.caseId === caseId && sameScope(event.scope, scope)));
	}

	async listScopedAuditEvents(scope: DrenyraScopeGuard, filters: DrenyraAuditEventFilters = {}): Promise<AuditEvent[]> {
		const eventTypes = new Set(filters.eventTypes ?? []);
		const events = byNewest(
			[...this.auditEvents.values()].filter((event) => {
				if (!sameScope(event.scope, scope)) return false;
				if (filters.caseId && event.caseId !== filters.caseId) return false;
				return eventTypes.size === 0 || eventTypes.has(event.eventType);
			}),
		);
		return typeof filters.limit === "number" ? events.slice(0, filters.limit) : events;
	}

	async listCommandAuditEvents(scope: DrenyraScopeGuard, filter: DrenyraAuditEventFilter = {}): Promise<AuditEvent[]> {
		return byNewest(
			[...this.auditEvents.values()].filter(
				(event) =>
					sameScope(event.scope, scope) &&
					(event.eventType === "CAPABILITY_ALLOWED" || event.eventType === "CAPABILITY_DENIED") &&
					(!filter.caseId || event.caseId === filter.caseId) &&
					(!filter.commandId || event.metadata.commandId === filter.commandId) &&
					(!filter.eventType || event.eventType === filter.eventType),
			),
		);
	}
}
