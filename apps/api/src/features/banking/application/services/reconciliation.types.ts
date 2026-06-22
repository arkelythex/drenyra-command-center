/**
 * Reconciliation types and interfaces.
 */
import type { MatchCandidate } from "../../domain/services/matching-strategy";

export interface ReconciliationResult {
	reconciledCount: number;
	attemptedCount: number;
	matches: Array<{
		transactionId: string;
		documentId: string;
		documentType: "INVOICE" | "BILL";
		matchScore: number;
		matchCriteria: MatchCandidate["criteria"];
	}>;
}

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

export interface RawBankTransaction {
	id: string;
	companyId: string;
	accountId: string;
	transactionDate: string;
	description: string | null;
	reference: string | null;
	type: "DEBIT" | "CREDIT";
	amount: string;
	isReconciled: boolean;
	invoiceId: string | null;
	billId: string | null;
}
