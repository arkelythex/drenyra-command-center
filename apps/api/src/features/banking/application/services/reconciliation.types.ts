/**
 * Reconciliation shadow-metrics types.
 */

export interface ShadowTotals {
	runs: number;
	failedRuns: number;
	matchedByLocalEngine: number;
	matchedByGoWorker: number;
	discrepancies: number;
}

export interface ReconciliationShadowCompanyMetrics extends ShadowTotals {
	companyId: string;
}

export interface ReconciliationShadowMetricsSnapshot extends ShadowTotals {
	enabled: boolean;
	toleranceCents: number;
	byCompany: ReconciliationShadowCompanyMetrics[];
	persistedRuns: Array<{
		id: string;
		companyId: string;
		accountId: string;
		status: "SUCCESS" | "FAILED";
		localMatchedCount: number;
		goMatchedCount: number;
		discrepancyCount: number;
		toleranceCents: number;
		errorMessage: string | null;
		createdAt: Date;
	}>;
}

export type ReconciliationShadowCutoverDecision =
	| "GO"
	| "NO_GO"
	| "INSUFFICIENT_DATA";

export interface ReconciliationShadowCutoverEvaluation {
	enabled: boolean;
	companyId: string | null;
	windowRuns: number;
	evaluatedRuns: number;
	successfulRuns: number;
	failedRuns: number;
	successRate: number;
	failureRate: number;
	discrepancyRate: number;
	maxAllowedDiscrepancyRate: number;
	maxAllowedFailureRate: number;
	minSuccessfulRuns: number;
	decision: ReconciliationShadowCutoverDecision;
	reason: string;
	evaluatedAt: Date | null;
}

export interface ShadowRunPayload {
	companyId: string;
	accountId: string;
	status: "SUCCESS" | "FAILED";
	localMatchedCount: number;
	goMatchedCount: number;
	discrepancyCount: number;
	toleranceCents: number;
	errorMessage: string | null;
	startedAt: Date;
	completedAt: Date;
}
