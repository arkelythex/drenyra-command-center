import type { AgentRun, ApprovalRequest, AuditEvent, EvidenceItem, FiscalCase } from "@drenyra/domain/entities";
import type { drenyraAgentRuns, drenyraApprovalRequests, drenyraAuditEvents, drenyraEvidenceItems, drenyraFiscalCases } from "../../schema/drenyra-command-center.schema";
export declare function fiscalCaseEntityToRow(entity: FiscalCase): typeof drenyraFiscalCases.$inferInsert;
export declare function evidenceItemEntityToRow(entity: EvidenceItem): typeof drenyraEvidenceItems.$inferInsert;
export declare function agentRunEntityToRow(entity: AgentRun): typeof drenyraAgentRuns.$inferInsert;
export declare function approvalRequestEntityToRow(entity: ApprovalRequest): typeof drenyraApprovalRequests.$inferInsert;
export declare function auditEventEntityToRow(entity: AuditEvent): typeof drenyraAuditEvents.$inferInsert;
//# sourceMappingURL=entity-mappers.d.ts.map