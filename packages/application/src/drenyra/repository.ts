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
	AuditEventType,
	EvidenceItem,
	FiscalCase,
	FiscalScope,
} from "@drenyra/domain/drenyra";

/**
 * Scope required for every Drenyra command-center repository read.
 *
 * The guard intentionally includes fiscal period and organization because Drenyra cases are fiscal-workspace
 * records, not global company records. Do not weaken this type when adding new repositories.
 *
 * @example
 * const scope: DrenyraScopeGuard = {
 *   companyId: "company-001",
 *   companyRuc: "20123456789",
 *   organizationId: "org-001",
 *   period: "2026-05",
 * };
 */
export type DrenyraScopeGuard = Pick<FiscalScope, "companyId" | "companyRuc" | "period"> & { organizationId: string };

export interface DrenyraAuditEventFilters {
	caseId?: string;
	eventTypes?: readonly AuditEventType[];
	limit?: number;
}

export interface DrenyraAuditEventFilter {
	caseId?: string;
	commandId?: string;
	eventType?: Extract<AuditEventType, "CAPABILITY_ALLOWED" | "CAPABILITY_DENIED">;
}

/**
 * Persistence port for the Drenyra Fiscal Command Center.
 *
 * Implementations must preserve company, RUC, organization and fiscal-period isolation. The application
 * service owns business orchestration; adapters only persist and retrieve scoped fiscal records.
 *
 * @example
 * const fiscalCase = await repository.getFiscalCaseById(caseId, scope);
 * if (!fiscalCase) throw new Error("FISCAL_CASE_NOT_FOUND");
 */
export interface DrenyraRepository {
	/**
	 * Persists a new fiscal case.
	 *
	 * @param fiscalCase - Case with complete fiscal scope and audit metadata.
	 * @returns The persisted fiscal case.
	 */
	createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
	/**
	 * Lists fiscal cases visible in a specific scoped fiscal workspace.
	 *
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Matching cases ordered by repository convention.
	 */
	listFiscalCases(scope: DrenyraScopeGuard): Promise<FiscalCase[]>;
	/**
	 * Finds one fiscal case by id without crossing tenant or period boundaries.
	 *
	 * @param id - Fiscal case identifier.
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Matching case, or null when out of scope or missing.
	 */
	getFiscalCaseById(id: string, scope: DrenyraScopeGuard): Promise<FiscalCase | null>;
	/**
	 * Updates a fiscal case inside its own scope.
	 *
	 * @param fiscalCase - Updated case; adapters must scope update predicates with its fiscal scope.
	 * @returns Updated case.
	 */
	updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
	/**
	 * Persists an evidence item attached to a fiscal case.
	 *
	 * @param item - Evidence with source, hash and fiscal scope.
	 * @returns Persisted evidence item.
	 */
	addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem>;
	/**
	 * Lists evidence attached to a scoped fiscal case.
	 *
	 * @param caseId - Fiscal case identifier.
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Evidence items for the case and scope.
	 */
	listEvidence(caseId: string, scope: DrenyraScopeGuard): Promise<EvidenceItem[]>;
	/**
	 * Persists a started agent run.
	 *
	 * @param run - Agent run record using deterministic mock-agent metadata in this foundation.
	 * @returns Persisted agent run.
	 */
	createAgentRun(run: AgentRun): Promise<AgentRun>;
	/**
	 * Updates an agent run after deterministic completion or failure.
	 *
	 * @param run - Updated run; adapters must scope update predicates with its fiscal scope.
	 * @returns Updated agent run.
	 */
	updateAgentRun(run: AgentRun): Promise<AgentRun>;
	/**
	 * Lists agent runs for a scoped fiscal case.
	 *
	 * @param caseId - Fiscal case identifier.
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Agent runs for the case and scope.
	 */
	listAgentRuns(caseId: string, scope: DrenyraScopeGuard): Promise<AgentRun[]>;
	/**
	 * Persists a human approval request.
	 *
	 * @param request - Approval request including diff payload and autonomy level.
	 * @returns Persisted approval request.
	 */
	createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
	/**
	 * Finds an approval request by id within the fiscal workspace scope.
	 *
	 * @param id - Approval request identifier.
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Approval request, or null when out of scope or missing.
	 */
	getApprovalRequestById(id: string, scope: DrenyraScopeGuard): Promise<ApprovalRequest | null>;
	/**
	 * Updates an approval request after a human decision.
	 *
	 * @param request - Approval request with decision fields populated.
	 * @returns Updated approval request.
	 */
	updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
	/**
	 * Lists approval requests for a scoped fiscal case.
	 *
	 * @param caseId - Fiscal case identifier.
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Approval requests for the case and scope.
	 */
	listApprovalRequests(caseId: string, scope: DrenyraScopeGuard): Promise<ApprovalRequest[]>;
	/**
	 * Persists an immutable audit event.
	 *
	 * @param event - Audit event describing a user or agent-visible fiscal action.
	 * @returns Persisted audit event.
	 */
	createAuditEvent(event: AuditEvent): Promise<AuditEvent>;
	/**
	 * Lists audit events for a scoped fiscal case.
	 *
	 * @param caseId - Fiscal case identifier.
	 * @param scope - Company/RUC/organization/period guard.
	 * @returns Audit events for the case and scope.
	 */
	listAuditEvents(caseId: string, scope: DrenyraScopeGuard): Promise<AuditEvent[]>;
	/**
	 * Lists audit events in a fiscal workspace, including case-less governance events.
	 *
	 * @param scope - Company/RUC/organization/period guard.
	 * @param filters - Optional case/type/limit filters.
	 * @returns Scoped audit events ordered newest first.
	 */
	listScopedAuditEvents(scope: DrenyraScopeGuard, filters?: DrenyraAuditEventFilters): Promise<AuditEvent[]>;
	/**
	 * Lists command capability audit events across a scoped fiscal workspace, including case-less events.
	 *
	 * @param scope - Company/RUC/organization/period guard.
	 * @param filter - Optional case, command and capability-decision filters.
	 * @returns Matching CAPABILITY_ALLOWED/CAPABILITY_DENIED events ordered by repository convention.
	 */
	listCommandAuditEvents(scope: DrenyraScopeGuard, filter?: DrenyraAuditEventFilter): Promise<AuditEvent[]>;
}
