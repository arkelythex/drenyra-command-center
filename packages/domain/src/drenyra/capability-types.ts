import type { DrenyraAgentType, DrenyraFiscalScope } from "./types";

export const DRENYRA_TOOL_ID = {
	LIST_FISCAL_CASES: "list_fiscal_cases",
	EXPLAIN_EVIDENCE: "explain_evidence",
	EXPLAIN_RISK: "explain_risk",
	RUN_AGENT_REVIEW: "run_agent_review",
	CALCULATE_IGV: "calculate_igv",
	VALIDATE_CPE: "validate_cpe",
	GET_TAX_CALENDAR: "get_tax_calendar",
	PROPOSE_LEDGER_ENTRY: "propose_ledger_entry",
	REQUEST_APPROVAL: "request_approval",
	PROMOTE_FISCAL_TRUTH: "promote_fiscal_truth",
	SUBMIT_SUNAT_SIRE: "submit_sunat_sire",
} as const;
export type DrenyraToolId =
	(typeof DRENYRA_TOOL_ID)[keyof typeof DRENYRA_TOOL_ID];

export const DRENYRA_TOOL_ACTION = {
	READ: "read",
	EXPLAIN: "explain",
	DRAFT: "draft",
	PROPOSE: "propose",
	REQUEST_APPROVAL: "request_approval",
	MATERIAL_ACTION: "material_action",
} as const;
export type DrenyraToolAction =
	(typeof DRENYRA_TOOL_ACTION)[keyof typeof DRENYRA_TOOL_ACTION];

export const DRENYRA_CAPABILITY_RISK = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	CRITICAL: "critical",
} as const;
export type DrenyraCapabilityRisk =
	(typeof DRENYRA_CAPABILITY_RISK)[keyof typeof DRENYRA_CAPABILITY_RISK];

export const DRENYRA_CAPABILITY_DECISION = {
	ALLOWED: "allowed",
	DENIED: "denied",
} as const;
export type DrenyraCapabilityDecision =
	(typeof DRENYRA_CAPABILITY_DECISION)[keyof typeof DRENYRA_CAPABILITY_DECISION];

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
