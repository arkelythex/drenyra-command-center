/**
 * Transaction Repository — PORT (Interface)
 *
 * Defines the data-access contract for the transactions bounded context.
 * The Drizzle adapter in infrastructure/ MUST implement this interface.
 * Domain and application layers NEVER import from infrastructure directly.
 */

import type {
	TransactionFilters,
	TransactionInsertData,
	TransactionRow,
	TransactionWithPartner,
	TypeSummaryEntry,
} from "./transaction.entity";

/**
 * ITransactionRepository interface.
 *
 * @example
 * ```ts
 * const value: ITransactionRepository = {} as ITransactionRepository;
 * console.log(value);
 * ```
 */
export interface ITransactionRepository {
	/**
	 * Returns transactions matching the given filters, with partner relation.
	 * Filtering is performed at the database level (WHERE clause) for performance.
	 */
	list(filters: TransactionFilters): Promise<TransactionWithPartner[]>;

	/**
	 * Persists a new transaction record with pre-computed tax amounts.
	 * Tax calculation is the handler's responsibility, not the repository's.
	 */
	insertOne(data: TransactionInsertData): Promise<TransactionRow>;

	/**
	 * Returns a transaction by ID with its partner relation, or undefined if not found.
	 */
	findById(
		id: string,
		companyId: string,
	): Promise<TransactionWithPartner | undefined>;

	/**
	 * Applies partial updates to a transaction. Accepts only column-level primitives.
	 * Complex update logic (tax recalculation, tag merging) is the handler's responsibility.
	 */
	update(
		id: string,
		updates: Record<string, unknown>,
		companyId: string,
	): Promise<TransactionRow | undefined>;

	/**
	 * Deletes a transaction by ID.
	 */
	delete(id: string, companyId: string): Promise<boolean>;

	/**
	 * Returns aggregate counts, totals, and IGV grouped by transaction type.
	 */
	getSummaryByType(
		companyId: string,
	): Promise<Record<string, TypeSummaryEntry>>;
}
