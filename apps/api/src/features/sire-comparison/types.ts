import type { SireDocumentRecord } from "../sire/services/sire-diff.service";

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
	sunatRecord?: SireDocumentRecord;
	localRecord?: SireDocumentRecord;
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
