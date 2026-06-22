/**
 * Reconcile — Marks a transaction as reconciled.
 *
 * @module reconciliations/application/commands
 */

import type { ReconcileInput } from "../../infrastructure/reconciliation.repository";
import { ReconciliationService } from "../services/reconciliation.service";

/**
 * Marks a transaction as reconciled with the given details.
 *
 * @param companyId - The company UUID
 * @param transactionId - The transaction ID to reconcile
 * @param reconciliationData - Optional reconciliation data
 * @returns The reconciled transaction, or null if not found
 */
export async function reconcile(
	companyId: string,
	transactionId: string,
	reconciliationData?: ReconcileInput,
) {
	const service = new ReconciliationService();
	return service.reconcile(companyId, transactionId, reconciliationData);
}
