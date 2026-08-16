import type {
	BankTransaction,
	BankTransactionType,
} from "../entities/BankTransaction";

/**
 * Filters for bank transaction queries
 *
 * @example
 * ```ts
 * const filters: BankTransactionFilters = {
 *   bankAccountId: 10,
 *   isReconciled: false,
 *   dateFrom: new Date("2026-01-01"),
 *   dateTo: new Date("2026-01-31"),
 * };
 * ```
 */
export interface BankTransactionFilters {
	bankAccountId?: number | undefined;
	type?: BankTransactionType | undefined;
	isReconciled?: boolean | undefined;
	dateFrom?: Date | undefined;
	dateTo?: Date | undefined;
	minAmount?: number | undefined;
	maxAmount?: number | undefined;
	importBatch?: string | undefined;
}

/**
 * Pagination options
 *
 * @example
 * ```ts
 * const pagination: PaginationOptions = { page: 1, limit: 50 };
 * ```
 */
export interface PaginationOptions {
	page: number;
	limit: number;
}

/**
 * Paginated result
 *
 * @example
 * ```ts
 * const page: PaginatedResult<BankTransaction> = {
 *   data: [],
 *   total: 0,
 *   page: 1,
 *   limit: 50,
 *   totalPages: 0,
 * };
 * ```
 * @typeParam T - Generic type parameter for PaginatedResult.
 */

export interface PaginatedResult<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

/**
 * Bank Transaction Repository Interface
 *
 * @example
 * ```ts
 * const repo: BankTransactionRepository = getBankTransactionRepository();
 * const result = await repo.findByBankAccount(10, { isReconciled: false }, { page: 1, limit: 50 });
 * ```
 */
export interface BankTransactionRepository {
	/**
	 * Save a new bank transaction
	 */
	save(transaction: BankTransaction): Promise<BankTransaction>;

	/**
	 * Save multiple transactions (batch import)
	 */
	saveMany(transactions: BankTransaction[]): Promise<BankTransaction[]>;

	/**
	 * Update an existing bank transaction
	 */
	update(transaction: BankTransaction): Promise<BankTransaction>;

	/**
	 * Find a bank transaction by ID
	 */
	findById(id: number, bankAccountId: number): Promise<BankTransaction | null>;

	/**
	 * Find all transactions for a bank account
	 */
	findByBankAccount(
		bankAccountId: number,
		filters?: BankTransactionFilters,
		pagination?: PaginationOptions,
	): Promise<PaginatedResult<BankTransaction>>;

	/**
	 * Find unreconciled transactions for a bank account
	 */
	findUnreconciled(bankAccountId: number): Promise<BankTransaction[]>;

	/**
	 * Find transactions by import batch
	 */
	findByImportBatch(importBatch: string): Promise<BankTransaction[]>;

	/**
	 * Count transactions
	 */
	count(
		bankAccountId: number,
		filters?: BankTransactionFilters,
	): Promise<number>;

	/**
	 * Get sum of amounts by type (for summaries)
	 */
	getSumByType(
		bankAccountId: number,
		dateFrom?: Date,
		dateTo?: Date,
	): Promise<Record<BankTransactionType, number>>;

	/**
	 * Delete a transaction (only if not reconciled)
	 */
	delete(id: number, bankAccountId: number): Promise<void>;

	/**
	 * Delete all transactions from an import batch
	 */
	deleteByImportBatch(importBatch: string): Promise<number>;

	/**
	 * Mark transactions as reconciled
	 */
	markAsReconciled(ids: number[], reconciliationId: number): Promise<void>;

	/**
	 * Unmark transactions from reconciliation
	 */
	unmarkReconciled(ids: number[]): Promise<void>;
}
