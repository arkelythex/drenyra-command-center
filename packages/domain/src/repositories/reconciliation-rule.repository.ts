/**
 * ReconciliationRule Repository Interface
 *
 * Persistence contract for the ReconciliationRule entity.
 */

import type { ReconciliationRule } from "../entities/ReconciliationRule";

/**
 * Repository contract for {@link ReconciliationRule} persistence.
 *
 * @example
 * ```ts
 * const repo: ReconciliationRuleRepository = getReconciliationRuleRepo();
 * const activeRules = await repo.findActiveByTenant(1);
 * ```
 */
export interface ReconciliationRuleRepository {
	/**
	 * Save a new reconciliation rule.
	 */
	save(rule: ReconciliationRule): Promise<ReconciliationRule>;

	/**
	 * Update an existing reconciliation rule.
	 */
	update(rule: ReconciliationRule): Promise<ReconciliationRule>;

	/**
	 * Find a rule by its UUID.
	 */
	findById(
		id: string,
		companyId: string,
	): Promise<ReconciliationRule | null>;

	/**
	 * Find all rules for a tenant.
	 */
	findByTenant(companyId: string): Promise<ReconciliationRule[]>;

	/**
	 * Find active rules for a tenant, ordered by priority.
	 */
	findActiveByTenant(companyId: string): Promise<ReconciliationRule[]>;

	/**
	 * Find rules by priority range.
	 */
	findByPriority(
		companyId: string,
		minPriority: number,
		maxPriority: number,
	): Promise<ReconciliationRule[]>;
}
