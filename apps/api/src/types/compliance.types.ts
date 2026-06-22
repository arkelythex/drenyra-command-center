/**
 * Compliance Types
 */

export type IssueType =
	| "MISSING_RLS"
	| "INVALID_RUC"
	| "MISSING_SUNAT"
	| "OVERDUE_INVOICE"
	| "TAX_MISMATCH";
export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ComplianceIssue {
	id: string;
	companyId: string;
	type: IssueType;
	severity: IssueSeverity;
	title: string;
	description: string;
	affectedEntity?: string;
	affectedEntityId?: string;
	resolvedAt?: Date;
	createdAt: Date;
}

export interface ComplianceDashboard {
	score: number; // 0-100
	totalIssues: number;
	criticalIssues: number;
	highIssues: number;
	mediumIssues: number;
	lowIssues: number;
	sunatStatus: "COMPLIANT" | "WARNINGS" | "NON_COMPLIANT";
	lastAudit?: Date;
}

export interface ComplianceReproducibilityReport {
	period: string;
	companyId: string;
	reproducible: boolean;
	coverage: "NO_DATA" | "PARTIAL_DATA" | "COMPLETE_DATA";
	sire: {
		recordCount: number;
		totalAmount: number;
		totalIGV: number;
	};
	ledger: {
		recordCount: number;
		totalAmount: number;
		totalIGV: number;
	};
	differences: {
		recordCount: number;
		totalAmount: number;
		totalIGV: number;
	};
	tolerances: {
		recordCount: number;
		totalAmount: number;
		totalIGV: number;
	};
	runbookId?: string;
}

export type ComplianceRoadmapActionId =
	| "prepare-sire"
	| "collect-overdue-invoices"
	| "stabilize-cashflow"
	| "resolve-ledger-repro-mismatch";

export interface ComplianceRoadmapAction {
	id: ComplianceRoadmapActionId;
	traceId: string;
	recommendedAt: string;
	title: string;
	description: string;
	impact: string;
	confidence: number;
	automationLevel: "one-click" | "review-required";
}

export type ComplianceRoadmapDecision = "APPROVE" | "REJECT" | "ESCALATE";

export interface ComplianceRoadmapDecisionRunResult {
	actionId: ComplianceRoadmapActionId;
	traceId: string;
	decision: ComplianceRoadmapDecision;
	reason: string;
	message: string;
	runId: string;
	runStatus: string;
}

export interface ComplianceRoadmapTimelineEvent {
	type: "RECOMMENDATION" | "DECISION" | "EFFECT";
	at: string;
	actionId: ComplianceRoadmapActionId;
	traceId: string;
	status: string;
	summary: string;
	reason?: string;
	runId?: string;
}

export interface ComplianceRoadmapActionTimeline {
	companyId: string;
	period: string;
	traceId: string;
	actionId: ComplianceRoadmapActionId;
	recommendation: ComplianceRoadmapAction;
	events: ComplianceRoadmapTimelineEvent[];
}

export interface ComplianceRoadmapPhase1Snapshot {
	objective: string;
	reliabilityScore: number;
	sunatStatus: ComplianceDashboard["sunatStatus"];
	blockingIssues: number;
	openIssues: number;
	ledgerReproducible: boolean;
	reproducibilityCoverage: ComplianceReproducibilityReport["coverage"];
	differences: ComplianceReproducibilityReport["differences"];
	nextFocus: string[];
}

export interface ComplianceRoadmapPhase2Snapshot {
	objective: string;
	insightScore: number;
	periodIncome: number;
	periodExpense: number;
	cashflowGap: number;
	overdueInvoices: number;
	pendingSunatInvoices: number;
	recommendedActions: ComplianceRoadmapAction[];
}

export interface ComplianceRoadmapSnapshot {
	companyId: string;
	period: string;
	generatedAt: string;
	phase1: ComplianceRoadmapPhase1Snapshot;
	phase2: ComplianceRoadmapPhase2Snapshot;
}

export interface ComplianceRoadmapActionRunResult {
	actionId: ComplianceRoadmapActionId;
	execution: "QUEUED_FOR_APPROVAL" | "REVIEW_REQUIRED";
	message: string;
	runId?: string;
	runStatus?: string;
}
