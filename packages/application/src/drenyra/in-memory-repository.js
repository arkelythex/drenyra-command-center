function sameScope(entityScope, scope) {
	return (
		entityScope.companyId === scope.companyId &&
		entityScope.companyRuc === scope.companyRuc &&
		entityScope.period === scope.period &&
		entityScope.organizationId === scope.organizationId
	);
}
function byNewest(items) {
	return [...items].sort((a, b) => {
		const aTime =
			a.createdAt ?? a.startedAt ?? a.requestedAt ?? a.occurredAt ?? "";
		const bTime =
			b.createdAt ?? b.startedAt ?? b.requestedAt ?? b.occurredAt ?? "";
		return bTime.localeCompare(aTime);
	});
}
export class InMemoryDrenyraRepository {
	fiscalCases = new Map();
	evidence = new Map();
	agentRuns = new Map();
	approvals = new Map();
	auditEvents = new Map();
	async createFiscalCase(fiscalCase) {
		this.fiscalCases.set(fiscalCase.id, fiscalCase);
		return fiscalCase;
	}
	async listFiscalCases(scope) {
		return byNewest(
			[...this.fiscalCases.values()].filter((item) =>
				sameScope(item.scope, scope),
			),
		);
	}
	async getFiscalCaseById(id, scope) {
		const fiscalCase = this.fiscalCases.get(id);
		return fiscalCase && sameScope(fiscalCase.scope, scope) ? fiscalCase : null;
	}
	async updateFiscalCase(fiscalCase) {
		this.fiscalCases.set(fiscalCase.id, fiscalCase);
		return fiscalCase;
	}
	async addEvidenceItem(item) {
		this.evidence.set(item.id, item);
		return item;
	}
	async listEvidence(caseId, scope) {
		return byNewest(
			[...this.evidence.values()].filter(
				(item) => item.caseId === caseId && sameScope(item.scope, scope),
			),
		);
	}
	async createAgentRun(run) {
		this.agentRuns.set(run.id, run);
		return run;
	}
	async updateAgentRun(run) {
		this.agentRuns.set(run.id, run);
		return run;
	}
	async listAgentRuns(caseId, scope) {
		return byNewest(
			[...this.agentRuns.values()].filter(
				(run) => run.caseId === caseId && sameScope(run.scope, scope),
			),
		);
	}
	async createApprovalRequest(request) {
		this.approvals.set(request.id, request);
		return request;
	}
	async getApprovalRequestById(id, scope) {
		const request = this.approvals.get(id);
		return request && sameScope(request.scope, scope) ? request : null;
	}
	async updateApprovalRequest(request) {
		this.approvals.set(request.id, request);
		return request;
	}
	async listApprovalRequests(caseId, scope) {
		return byNewest(
			[...this.approvals.values()].filter(
				(request) =>
					request.caseId === caseId && sameScope(request.scope, scope),
			),
		);
	}
	async createAuditEvent(event) {
		this.auditEvents.set(event.id, event);
		return event;
	}
	async listAuditEvents(caseId, scope) {
		return byNewest(
			[...this.auditEvents.values()].filter(
				(event) => event.caseId === caseId && sameScope(event.scope, scope),
			),
		);
	}
	async listScopedAuditEvents(scope, filters = {}) {
		const eventTypes = new Set(filters.eventTypes ?? []);
		const events = byNewest(
			[...this.auditEvents.values()].filter((event) => {
				if (!sameScope(event.scope, scope)) return false;
				if (filters.caseId && event.caseId !== filters.caseId) return false;
				return eventTypes.size === 0 || eventTypes.has(event.eventType);
			}),
		);
		return typeof filters.limit === "number"
			? events.slice(0, filters.limit)
			: events;
	}
	async listCommandAuditEvents(scope, filter = {}) {
		return byNewest(
			[...this.auditEvents.values()].filter(
				(event) =>
					sameScope(event.scope, scope) &&
					(event.eventType === "CAPABILITY_ALLOWED" ||
						event.eventType === "CAPABILITY_DENIED") &&
					(!filter.caseId || event.caseId === filter.caseId) &&
					(!filter.commandId ||
						event.metadata.commandId === filter.commandId) &&
					(!filter.eventType || event.eventType === filter.eventType),
			),
		);
	}
}
//# sourceMappingURL=in-memory-repository.js.map
