import type { DrenyraAgentType, DrenyraFiscalScope } from "./types";
export declare const DRENYRA_TOOL_ID: {
    readonly LIST_FISCAL_CASES: "list_fiscal_cases";
    readonly EXPLAIN_EVIDENCE: "explain_evidence";
    readonly EXPLAIN_RISK: "explain_risk";
    readonly RUN_AGENT_REVIEW: "run_agent_review";
    readonly CALCULATE_IGV: "calculate_igv";
    readonly VALIDATE_CPE: "validate_cpe";
    readonly GET_TAX_CALENDAR: "get_tax_calendar";
    readonly PROPOSE_LEDGER_ENTRY: "propose_ledger_entry";
    readonly REQUEST_APPROVAL: "request_approval";
    readonly PROMOTE_FISCAL_TRUTH: "promote_fiscal_truth";
    readonly SUBMIT_SUNAT_SIRE: "submit_sunat_sire";
};
export type DrenyraToolId = (typeof DRENYRA_TOOL_ID)[keyof typeof DRENYRA_TOOL_ID];
export declare const DRENYRA_TOOL_ACTION: {
    readonly READ: "read";
    readonly EXPLAIN: "explain";
    readonly DRAFT: "draft";
    readonly PROPOSE: "propose";
    readonly REQUEST_APPROVAL: "request_approval";
    readonly MATERIAL_ACTION: "material_action";
};
export type DrenyraToolAction = (typeof DRENYRA_TOOL_ACTION)[keyof typeof DRENYRA_TOOL_ACTION];
export declare const DRENYRA_CAPABILITY_RISK: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
};
export type DrenyraCapabilityRisk = (typeof DRENYRA_CAPABILITY_RISK)[keyof typeof DRENYRA_CAPABILITY_RISK];
export declare const DRENYRA_CAPABILITY_DECISION: {
    readonly ALLOWED: "allowed";
    readonly DENIED: "denied";
};
export type DrenyraCapabilityDecision = (typeof DRENYRA_CAPABILITY_DECISION)[keyof typeof DRENYRA_CAPABILITY_DECISION];
export interface DrenyraCapabilityPolicy {
    agentType: DrenyraAgentType;
    toolId: DrenyraToolId;
    action: DrenyraToolAction;
    risk: DrenyraCapabilityRisk;
    requiresApproval: boolean;
    requiresRedaction: boolean;
}
export interface DrenyraCapabilityGrant {
    agentType: DrenyraAgentType;
    toolId: DrenyraToolId;
    scope: DrenyraFiscalScope;
    grantedBy: string;
    grantedAt: string;
}
export interface DrenyraCapabilityRequest {
    agentType: DrenyraAgentType;
    toolId: DrenyraToolId;
    scope: DrenyraFiscalScope;
    redactionOk: boolean;
    approvalId?: string;
}
export interface DrenyraCapabilityEvaluation {
    decision: DrenyraCapabilityDecision;
    reason: string;
    policy: DrenyraCapabilityPolicy;
    auditEventType: "CAPABILITY_ALLOWED" | "CAPABILITY_DENIED";
}
//# sourceMappingURL=capability-types.d.ts.map