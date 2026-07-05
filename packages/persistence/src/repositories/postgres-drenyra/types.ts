import type { DrenyraScopeGuard } from "@drenyra/application/drenyra";
import {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "../../schema/drenyra-command-center.schema";

export type ScopeGuard = DrenyraScopeGuard;

export type FiscalCaseRow = typeof drenyraFiscalCases.$inferSelect;
export type EvidenceRow = typeof drenyraEvidenceItems.$inferSelect;
export type AgentRunRow = typeof drenyraAgentRuns.$inferSelect;
export type ApprovalRow = typeof drenyraApprovalRequests.$inferSelect;
export type AuditRow = typeof drenyraAuditEvents.$inferSelect;
