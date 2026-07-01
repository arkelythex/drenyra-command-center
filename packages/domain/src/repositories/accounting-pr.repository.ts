import type { AccountingPr } from "../entities/accounting-pr";

export interface AccountingPrFilters {
	companyId?: string;
	status?: string;
	reviewerId?: string;
}

export interface PaginationOptions {
	limit?: number;
	offset?: number;
}

export interface AccountingPrRepository {
	save(pr: AccountingPr): Promise<void>;

	update(pr: AccountingPr): Promise<void>;

	findById(id: string): Promise<AccountingPr | null>;

	findAll(
		filters?: AccountingPrFilters,
		pagination?: PaginationOptions,
	): Promise<AccountingPr[]>;

	findByPrNumber(
		companyId: string,
		prNumber: number,
	): Promise<AccountingPr | null>;

	count(filters?: AccountingPrFilters): Promise<number>;
}
