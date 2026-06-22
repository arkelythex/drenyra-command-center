/**
 * Bank Reconciliation Repository Interface
 */

import type {
	BankReconciliation,
	ReconciliationStatus,
} from "../entities/BankReconciliation";

/**
 * Filter options for listing or counting reconciliations.
 *
 * @example
 * ```ts
 * const filters: ReconciliationFilters = {
 *   bankAccountId: 10,
 *   status: "DRAFT" as ReconciliationStatus,
 *   periodFrom: new Date("2026-01-01"),
 *   periodTo: new Date("2026-01-31"),
 * };
 * ```
 */
export interface ReconciliationFilters {
	bankAccountId?: number;
	status?: ReconciliationStatus;
	periodFrom?: Date;
	periodTo?: Date;
}

/**
 * Repository contract for {@link BankReconciliation} persistence.
 *
 * @example
 * ```ts
 * const repo: BankReconciliationRepository = getBankReconciliationRepository();
 * const reconciliation = await repo.findLatestByBankAccount(10);
 * ```
 */
export interface BankReconciliationRepository {
	/**
	 * Save a new reconciliation
	 */
	save(reconciliation: BankReconciliation): Promise<BankReconciliation>;

	/**
	 * Update an existing reconciliation
	 */
	update(reconciliation: BankReconciliation): Promise<BankReconciliation>;

	/**
	 * Find by ID
	 */
	findById(
		id: number,
		organizationId: number,
	): Promise<BankReconciliation | null>;

	/**
	 * Find all for an organization
	 */
	findAll(
		organizationId: number,
		filters?: ReconciliationFilters,
	): Promise<BankReconciliation[]>;

	/**
	 * Find latest reconciliation for a bank account
	 */
	findLatestByBankAccount(
		bankAccountId: number,
	): Promise<BankReconciliation | null>;

	/**
	 * Find pending (draft) reconciliations
	 */
	findPending(organizationId: number): Promise<BankReconciliation[]>;

	/**
	 * Count reconciliations
	 */
	count(
		organizationId: number,
		filters?: ReconciliationFilters,
	): Promise<number>;

	/**
	 * Delete (only draft)
	 */
	delete(id: number, organizationId: number): Promise<void>;
}
