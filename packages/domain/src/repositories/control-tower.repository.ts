import type { AuditEventType, FiscalScope } from "../drenyra/types";
import type { AgentRun } from "../entities/control-tower/agent-run.entity";
import type { ApprovalRequest } from "../entities/control-tower/approval-request.entity";
import type { AuditEvent } from "../entities/control-tower/audit-event.entity";
import type { EvidenceItem } from "../entities/control-tower/evidence-item.entity";
import type { FiscalCase } from "../entities/control-tower/fiscal-case.entity";

export type ControlTowerScopeGuard = Pick<
	FiscalScope,
	"companyId" | "companyRuc" | "period"
> & {
	organizationId: string;
};

export interface ControlTowerAuditEventFilters {
	caseId?: string;
	eventTypes?: readonly AuditEventType[];
	limit?: number;
}

export interface ControlTowerRepository {
	createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
	listFiscalCases(scope: ControlTowerScopeGuard): Promise<FiscalCase[]>;
	getFiscalCaseById(
		id: string,
		scope: ControlTowerScopeGuard,
	): Promise<FiscalCase | null>;
	updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
	addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem>;
	listEvidence(
		caseId: string,
		scope: ControlTowerScopeGuard,
	): Promise<EvidenceItem[]>;
	createAgentRun(run: AgentRun): Promise<AgentRun>;
	updateAgentRun(run: AgentRun): Promise<AgentRun>;
	listAgentRuns(
		caseId: string,
		scope: ControlTowerScopeGuard,
	): Promise<AgentRun[]>;
	createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
	getApprovalRequestById(
		id: string,
		scope: ControlTowerScopeGuard,
	): Promise<ApprovalRequest | null>;
	updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
	listApprovalRequests(
		caseId: string,
		scope: ControlTowerScopeGuard,
	): Promise<ApprovalRequest[]>;
	createAuditEvent(event: AuditEvent): Promise<AuditEvent>;
	listAuditEvents(
		caseId: string,
		scope: ControlTowerScopeGuard,
	): Promise<AuditEvent[]>;
	listScopedAuditEvents(
		scope: ControlTowerScopeGuard,
		filters?: ControlTowerAuditEventFilters,
	): Promise<AuditEvent[]>;
}
