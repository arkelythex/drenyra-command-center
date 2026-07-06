/**
 * Accounting PRs — DTO types for frontend consumption.
 *
 * @module application/features/accounting-prs
 */

export interface AccountingPrDTO {
	id: string;
	companyId: string;
	prNumber: number;
	title: string;
	description: string | null;
	status: string;
	entries: string[];
	evidenceIds: string[];
	totalDebitCents: number;
	totalCreditCents: number;
	reviewerId: string | null;
	reviewedAt: string | null;
	reviewComment: string | null;
	approveSignerIds: string[] | null;
	approveSignatures: unknown[] | null;
	createdById: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface FromEntriesRequest {
	title: string;
	description?: string;
	entryIds: string[];
}

export interface CreatePrRequest {
	title: string;
	description?: string;
	entries: string[];
	evidenceIds?: string[];
	totalDebitCents: number;
	totalCreditCents: number;
}

export interface UpdatePrRequest {
	title?: string;
	description?: string;
	entries?: string[];
	evidenceIds?: string[];
	totalDebitCents?: number;
	totalCreditCents?: number;
}

export interface PrListQuery {
	status?: string;
	reviewerId?: string;
	limit?: string;
	offset?: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	limit: number;
	offset: number;
}
