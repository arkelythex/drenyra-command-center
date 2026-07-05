import type { AgentRun, ApprovalRequest, AuditEvent, EvidenceItem, FiscalCase } from "@drenyra/domain/drenyra";
import type { DrenyraAuditEventFilter, DrenyraAuditEventFilters, DrenyraRepository, DrenyraScopeGuard } from "./repository";
export declare class InMemoryDrenyraRepository implements DrenyraRepository {
    private readonly fiscalCases;
    private readonly evidence;
    private readonly agentRuns;
    private readonly approvals;
    private readonly auditEvents;
    createFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
    listFiscalCases(scope: DrenyraScopeGuard): Promise<FiscalCase[]>;
    getFiscalCaseById(id: string, scope: DrenyraScopeGuard): Promise<FiscalCase | null>;
    updateFiscalCase(fiscalCase: FiscalCase): Promise<FiscalCase>;
    addEvidenceItem(item: EvidenceItem): Promise<EvidenceItem>;
    listEvidence(caseId: string, scope: DrenyraScopeGuard): Promise<EvidenceItem[]>;
    createAgentRun(run: AgentRun): Promise<AgentRun>;
    updateAgentRun(run: AgentRun): Promise<AgentRun>;
    listAgentRuns(caseId: string, scope: DrenyraScopeGuard): Promise<AgentRun[]>;
    createApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
    getApprovalRequestById(id: string, scope: DrenyraScopeGuard): Promise<ApprovalRequest | null>;
    updateApprovalRequest(request: ApprovalRequest): Promise<ApprovalRequest>;
    listApprovalRequests(caseId: string, scope: DrenyraScopeGuard): Promise<ApprovalRequest[]>;
    createAuditEvent(event: AuditEvent): Promise<AuditEvent>;
    listAuditEvents(caseId: string, scope: DrenyraScopeGuard): Promise<AuditEvent[]>;
    listScopedAuditEvents(scope: DrenyraScopeGuard, filters?: DrenyraAuditEventFilters): Promise<AuditEvent[]>;
    listCommandAuditEvents(scope: DrenyraScopeGuard, filter?: DrenyraAuditEventFilter): Promise<AuditEvent[]>;
}
//# sourceMappingURL=in-memory-repository.d.ts.map