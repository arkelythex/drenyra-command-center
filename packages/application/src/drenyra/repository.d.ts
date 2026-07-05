import type {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	AuditEventType,
	EvidenceItem,
	FiscalCase,
	FiscalScope,
} from "@drenyra/domain/drenyra";
export type DrenyraScopeGuard = Pick<
	FiscalScope,
	"companyId" | "companyRuc" | "period"
> & {
	organizationId: string;
};
export interface DrenyraAuditEventFilters {
	caseId?: string;
	eventTypes?: readonly AuditEventType[];
	limit?: number;
}
export interface DrenyraAuditEventFilter {
	caseId?: string;
	commandId?: string;
	eventType?: Extract<
		AuditEventType,
		"CAPABILITY_ALLOWED" | "CAPABILITY_DENIED"
	>;
}
export interface DrenyraRepository {
	createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
	listFiscalCases(scope: DrenyraScopeGuard): Promise<FiscalCase[]>;
	getFiscalCaseById(
		id: string,
		scope: DrenyraScopeGuard,
	): Promise<FiscalCase | null>;
	updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
	addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem>;
	listEvidence(
		caseId: string,
		scope: DrenyraScopeGuard,
	): Promise<EvidenceItem[]>;
	createAgentRun(run: AgentRun): Promise<AgentRun>;
	updateAgentRun(run: AgentRun): Promise<AgentRun>;
	listAgentRuns(caseId: string, scope: DrenyraScopeGuard): Promise<AgentRun[]>;
	createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
	getApprovalRequestById(
		id: string,
		scope: DrenyraScopeGuard,
	): Promise<ApprovalRequest | null>;
	updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
	listApprovalRequests(
		caseId: string,
		scope: DrenyraScopeGuard,
	): Promise<ApprovalRequest[]>;
	createAuditEvent(event: AuditEvent): Promise<AuditEvent>;
	listAuditEvents(
		caseId: string,
		scope: DrenyraScopeGuard,
	): Promise<AuditEvent[]>;
	listScopedAuditEvents(
		scope: DrenyraScopeGuard,
		filters?: DrenyraAuditEventFilters,
	): Promise<AuditEvent[]>;
	listCommandAuditEvents(
		scope: DrenyraScopeGuard,
		filter?: DrenyraAuditEventFilter,
	): Promise<AuditEvent[]>;
}
//# sourceMappingURL=repository.d.ts.map
