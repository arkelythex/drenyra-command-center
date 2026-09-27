import { AgentRun, ApprovalRequest, AuditEvent, EvidenceItem, FiscalCase } from "@drenyra/domain/entities";
import type { ControlTowerAuditEventFilters, ControlTowerRepository, ControlTowerScopeGuard } from "@drenyra/domain/repositories/control-tower.repository";
type ScopeGuard = ControlTowerScopeGuard;
export declare class ControlTowerPostgresRepository implements ControlTowerRepository {
    createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
    listFiscalCases(scope: ScopeGuard): Promise<FiscalCase[]>;
    getFiscalCaseById(id: string, scope: ScopeGuard): Promise<FiscalCase | null>;
    updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
    addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem>;
    listEvidence(caseId: string, scope: ScopeGuard): Promise<EvidenceItem[]>;
    createAgentRun(run: AgentRun): Promise<AgentRun>;
    updateAgentRun(run: AgentRun): Promise<AgentRun>;
    listAgentRuns(caseId: string, scope: ScopeGuard): Promise<AgentRun[]>;
    createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
    getApprovalRequestById(id: string, scope: ScopeGuard): Promise<ApprovalRequest | null>;
    updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
    listApprovalRequests(caseId: string, scope: ScopeGuard): Promise<ApprovalRequest[]>;
    createAuditEvent(event: AuditEvent): Promise<AuditEvent>;
    listAuditEvents(caseId: string, scope: ScopeGuard): Promise<AuditEvent[]>;
    listScopedAuditEvents(scope: ScopeGuard, filters?: ControlTowerAuditEventFilters): Promise<AuditEvent[]>;
}
export {};
//# sourceMappingURL=repository.d.ts.map