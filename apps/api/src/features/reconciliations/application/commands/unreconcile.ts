/**
 * Unreconcile — Reverts a reconciled transaction.
 *
 * @module reconciliations/application/commands
 */

import { ReconciliationService } from "../services/reconciliation.service";

/**
 * Reverts a reconciled transaction back to pending.
 *
 * @param companyId - The company UUID
 * @param transactionId - The transaction ID to unreconcile
 * @returns The unreconciled transaction, or null if not found
 */
export async function unreconcile(companyId: string, transactionId: string) {
	const service = new ReconciliationService();
	return service.unreconcile(companyId, transactionId);
}
