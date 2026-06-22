import type { TenantCompanyRucScope } from "./contracts";

export type SunatImpact = "none" | "low" | "medium" | "high" | "critical";

export type FiscalApprovalLevel =
	| "auto"
	| "notify"
	| "gate"
	| "fiscal_gate"
	| "deny";

export const FISCAL_POLICY_VIOLATION_CODES = {
	FISCAL_SCOPE_REQUIRED: "FISCAL_SCOPE_REQUIRED",
	ACCOUNTING_PERIOD_CLOSED: "ACCOUNTING_PERIOD_CLOSED",
	CPE_IMMUTABLE: "CPE_IMMUTABLE",
	EVIDENCE_REQUIRED: "EVIDENCE_REQUIRED",
	DETERMINISTIC_ENGINE_REQUIRED: "DETERMINISTIC_ENGINE_REQUIRED",
	FISCAL_TOOL_MAPPING_REQUIRED: "FISCAL_TOOL_MAPPING_REQUIRED",
	CRITICAL_SUNAT_IMPACT_DENIED: "CRITICAL_SUNAT_IMPACT_DENIED",
} as const;

export type FiscalPolicyViolationCode =
	(typeof FISCAL_POLICY_VIOLATION_CODES)[keyof typeof FISCAL_POLICY_VIOLATION_CODES];

export type FiscalToolFamily =
	| "cpe"
	| "sire"
	| "ple"
	| "tax"
	| "detraction"
	| "journal";

export type FiscalAction = "read" | "write" | "execute" | "admin";

export interface FiscalPolicyToolMapping {
	family: FiscalToolFamily;
	pattern: `${FiscalToolFamily}.*`;
	defaultSunatImpact: SunatImpact;
	requiresEvidence: boolean;
	requiresDeterministicEngine: boolean;
	immutableWhenAcceptedCpe: boolean;
}

export interface FiscalPolicyInput {
	traceId: string;
	toolName: string;
	action: FiscalAction;
	tenantScope?: Partial<TenantCompanyRucScope>;
	sunatImpact?: SunatImpact;
	evidenceRefs?: readonly string[];
	documentType?: "cpe" | "sire" | "ple" | "journal" | "other";
	documentStatus?: "draft" | "accepted" | "voided" | "rejected";
	accountingPeriodStatus?: "open" | "closed";
	deterministicEngineRef?: string;
}

export interface FiscalPolicyResult {
	traceId: string;
	toolName: string;
	allowed: boolean;
	sunatImpact: SunatImpact;
	approvalLevel: FiscalApprovalLevel;
	requiresApproval: boolean;
	violations: FiscalPolicyViolationCode[];
	mapping?: FiscalPolicyToolMapping;
}
