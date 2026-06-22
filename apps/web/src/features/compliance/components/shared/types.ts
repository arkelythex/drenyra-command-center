/**
 * Shared types for the Roadmap MVP feature (S1–S4).
 * Co-located here so hooks, components, and tests share one source of truth.
 */

export type RoadmapActionId =
	| "prepare-sire"
	| "collect-overdue-invoices"
	| "stabilize-cashflow"
	| "resolve-ledger-repro-mismatch";

export type RoadmapDecisionType = "APPROVE" | "REJECT" | "ESCALATE";

export type AutomationLevel = "one-click" | "review-required";

export interface RoadmapMvpAction {
	id: RoadmapActionId;
	traceId: string;
	recommendedAt: string;
	title: string;
	description: string;
	impact: string;
	confidence: number;
	automationLevel: AutomationLevel;
}

export interface RoadmapMvpSnapshot {
	companyId: string;
	period: string;
	generatedAt: string;
	phase1: {
		objective: string;
		reliabilityScore: number;
		sunatStatus: "COMPLIANT" | "WARNINGS" | "NON_COMPLIANT";
		blockingIssues: number;
		openIssues: number;
		ledgerReproducible: boolean;
		reproducibilityCoverage: "NO_DATA" | "PARTIAL_DATA" | "COMPLETE_DATA";
		differences: {
			recordCount: number;
			totalAmount: number;
			totalIGV: number;
		};
		nextFocus: string[];
	};
	phase2: {
		objective: string;
		insightScore: number;
		periodIncome: number;
		periodExpense: number;
		cashflowGap: number;
		overdueInvoices: number;
		pendingSunatInvoices: number;
		recommendedActions: RoadmapMvpAction[];
	};
}

export interface RoadmapMvpActionRunResult {
	actionId: RoadmapActionId;
	execution: "QUEUED_FOR_APPROVAL" | "REVIEW_REQUIRED";
	message: string;
	runId?: string;
	runStatus?: string;
}

export interface RoadmapMvpDecisionResult {
	actionId: RoadmapActionId;
	traceId: string;
	decision: RoadmapDecisionType;
	reason: string;
	message: string;
	runId: string;
	runStatus: string;
}

export interface RoadmapTimelineEvent {
	type: "RECOMMENDATION" | "DECISION" | "EFFECT";
	at: string;
	status: string;
	summary: string;
	reason?: string;
	runId?: string;
}

export interface RoadmapTimeline {
	companyId: string;
	period: string;
	traceId: string;
	actionId: RoadmapActionId;
	recommendation: RoadmapMvpAction;
	events: RoadmapTimelineEvent[];
}
