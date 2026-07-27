/**
 * ReconciliationBatch Repository Interface
 *
 * Persistence contract for the ReconciliationBatch aggregate root.
 */

import type {
	ReconciliationBatch,
	ReconciliationBatchStatus,
} from "../entities/ReconciliationBatch";

/**
 * Repository contract for {@link ReconciliationBatch} persistence.
 *
 * @example
 * ```ts
 * const repo: ReconciliationBatchRepository = getReconciliationBatchRepo();
 * const openBatches = await repo.findOpenByAccount("ba-abc123", 1);
 * ```
 */
export interface ReconciliationBatchRepository {
	/**
	 * Save a new reconciliation batch.
	 */
	save(batch: ReconciliationBatch): Promise<ReconciliationBatch>;

	/**
	 * Update an existing reconciliation batch.
	 */
	update(batch: ReconciliationBatch): Promise<ReconciliationBatch>;

	/**
	 * Find a batch by its UUID.
	 */
	findById(
		id: string,
		companyId: string,
	): Promise<ReconciliationBatch | null>;

	/**
	 * Find all batches for a bank account (paginated).
	 */
	findByBankAccount(
		bankAccountId: string,
		companyId: string,
		options?: { limit?: number; offset?: number },
	): Promise<ReconciliationBatch[]>;

	/**
	 * Find batches by status for a tenant.
	 */
	findByStatus(
		companyId: string,
		status: ReconciliationBatchStatus,
	): Promise<ReconciliationBatch[]>;

	/**
	 * Find the open batch for a specific bank account (at most one).
	 */
	findOpenByAccount(
		bankAccountId: string,
		companyId: string,
	): Promise<ReconciliationBatch | null>;

	/**
	 * Count batches matching optional filters.
	 */
	count(
		companyId: string,
		filters?: {
			bankAccountId?: string;
			status?: ReconciliationBatchStatus;
		},
	): Promise<number>;
}
