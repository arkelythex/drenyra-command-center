/**
 * GetReconciled — Returns completed reconciliations.
 *
 * @module reconciliations/application/queries
 */

import { ReconciliationService } from "../services/reconciliation.service";

/**
 * Returns completed reconciliations for a company.
 *
 * @param companyId - The company UUID
 * @param limit - Max number of results (default: 50)
 * @returns Array of reconciled transactions
 */
export async function getReconciled(companyId: string, limit = 50) {
	const service = new ReconciliationService();
	return service.getReconciled(companyId, limit);
}
