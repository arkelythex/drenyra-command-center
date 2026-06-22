/**
 * GetReconciliationStats — Returns reconciliation statistics for a company.
 *
 * @module reconciliations/application/queries
 */

import { ReconciliationService } from "../services/reconciliation.service";

/**
 * Returns reconciliation statistics for a company.
 *
 * @param companyId - The company UUID
 * @returns Reconciliation stats with counts and amounts
 */
export async function getStats(companyId: string) {
	const service = new ReconciliationService();
	return service.getStats(companyId);
}
