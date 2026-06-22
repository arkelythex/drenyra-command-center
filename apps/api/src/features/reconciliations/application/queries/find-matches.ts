/**
 * FindMatches — Finds matching transactions for reconciliation.
 *
 * @module reconciliations/application/queries
 */

import { ReconciliationService } from "../services/reconciliation.service";

/**
 * Finds matching transactions for a given transaction.
 *
 * @param companyId - The company UUID
 * @param transactionId - The transaction ID to find matches for
 * @returns Match result with matches array and confidence, or null if not found
 */
export async function findMatches(companyId: string, transactionId: string) {
	const service = new ReconciliationService();
	return service.findMatches(companyId, transactionId);
}
