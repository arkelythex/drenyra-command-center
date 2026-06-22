export type ComplianceSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface ComplianceFinding {
	readonly id: string;
	readonly severity: ComplianceSeverity;
	readonly category: string;
	readonly message: string;
	readonly evidenceRefs: readonly string[];
	readonly recommendedAction: string;
	readonly requiresApproval: boolean;
}

export interface ComplianceContext {
	readonly tenantId?: string;
	readonly companyId?: string;
	readonly ruc?: string;
	readonly userId?: string;
	readonly period?: string;
	readonly traceId?: string;
}

export interface ComplianceReportBase {
	readonly findings: readonly ComplianceFinding[];
	readonly riskScore: number;
	readonly advisoryOnly: true;
}

export interface ComplianceEvidenceRef {
	readonly id: string;
	readonly type?: string;
	readonly traceId?: string;
}
