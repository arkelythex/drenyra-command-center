import type { AgentRun, ApprovalRequest, AuditEvent, EvidenceItem, FiscalCase, FiscalScope } from "@drenyra/domain/drenyra";
import type { drenyraAgentRuns, drenyraApprovalRequests, drenyraAuditEvents, drenyraEvidenceItems, drenyraFiscalCases } from "../../schema/drenyra-command-center.schema";
import type { AgentRunRow, ApprovalRow, AuditRow, EvidenceRow, FiscalCaseRow } from "./types";
export declare function rowScope(row: {
    companyId: string;
    companyRuc: string;
    organizationId: string | null;
    period: string;
    countryCode: string;
}): FiscalScope;
export declare function toDate(value: string): Date;
export declare function toIso(value: Date): string;
export declare function mapFiscalCase(row: FiscalCaseRow): FiscalCase;
export declare function fiscalCaseValues(fiscalCase: FiscalCase): typeof drenyraFiscalCases.$inferInsert;
export declare function mapEvidence(row: EvidenceRow): EvidenceItem;
export declare function evidenceValues(item: EvidenceItem): typeof drenyraEvidenceItems.$inferInsert;
export declare function mapAgentRun(row: AgentRunRow): AgentRun;
export declare function agentRunValues(run: AgentRun): typeof drenyraAgentRuns.$inferInsert;
export declare function mapApproval(row: ApprovalRow): ApprovalRequest;
export declare function approvalValues(request: ApprovalRequest): typeof drenyraApprovalRequests.$inferInsert;
export declare function requireOrganizationId(scope: FiscalScope): string;
export declare function mapAudit(row: AuditRow): AuditEvent;
export declare function auditValues(event: AuditEvent): typeof drenyraAuditEvents.$inferInsert;
//# sourceMappingURL=mappers.d.ts.map