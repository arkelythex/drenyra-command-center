/**
 * SIRE Comparison — DTO types for frontend consumption.
 *
 * @module application/features/sire-comparison
 */

// ─── Enums ───────────────────────────────────────────────────────

export type DiscrepancyType =
	| "SUNAT_ONLY"
	| "LOCAL_ONLY"
	| "AMOUNT_MISMATCH"
	| "STATUS_MISMATCH";
export type DiscrepancyResolution =
	| "UNRESOLVED"
	| "ACCEPTED"
	| "FLAGGED"
	| "REVIEWING";
export type ReconciliationAction =
	| "ACCEPT_SUNAT"
	| "ACCEPT_LOCAL"
	| "MANUAL_FIX"
	| "FLAG_FOR_REVIEW";

// ─── Supporting Types ───────────────────────────────────────────

export interface SireDocumentRecordDTO {
	id: string;
	documentType: string;
	series: string;
	number: string;
	amount: number;
	currency?: string;
	issueDate: string;
	status: string;
}

// ─── DTOs ───────────────────────────────────────────────────────

export interface ComparisonSummary {
	totalRecords: number;
	sunatOnly: number;
	localOnly: number;
	amountMismatch: number;
	statusMismatch: number;
	matchPercent: number;
}

export interface DiscrepancyDTO {
	id: string;
	type: DiscrepancyType;
	sunatRecord?: SireDocumentRecordDTO;
	localRecord?: SireDocumentRecordDTO;
	diffAmount?: number;
	status: DiscrepancyResolution;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ComparisonReport {
	period: string;
	companyId: string;
	summary: ComparisonSummary;
	discrepancies: DiscrepancyDTO[];
	generatedAt: string;
}

export interface DashboardPeriodStat {
	period: string;
	totalRecords: number;
	matchPercent: number;
	unresolvedCount: number;
}

export interface ComparisonDashboard {
	periods: DashboardPeriodStat[];
	overallMatchPercent: number;
}
