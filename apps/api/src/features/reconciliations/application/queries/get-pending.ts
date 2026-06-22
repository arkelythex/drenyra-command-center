/**
 * GetPending — Returns pending reconciliations.
 *
 * @module reconciliations/application/queries
 */

import { ReconciliationService } from "../services/reconciliation.service";

/**
 * Returns pending reconciliations for a company.
 *
 * @param companyId - The company UUID
 * @param limit - Max number of results (default: 10)
 * @returns Array of pending reconciliations
 */
export async function getPending(companyId: string, limit = 10) {
	const service = new ReconciliationService();
	return service.getPending(companyId, limit);
}
