/**
 * ExternalReconcile — Runs reconciliation via the external Go worker.
 *
 * @module reconciliations/application/commands
 */

import { ReconciliationWorkerClient } from "../../../../shared/clients/reconciliation-worker.client";

export interface ExternalReconcileInput {
	sourceA: Array<{ reference: string; amountCents: number }>;
	sourceB: Array<{ reference: string; amountCents: number }>;
	toleranceCents?: number;
}

/**
 * Runs external reconciliation via the Go worker.
 * The worker performs fuzzy matching across two data sources.
 *
 * @param input - The reconciliation input with two data sources
 * @returns The reconciliation result from the external worker
 */
export async function externalReconcile(input: ExternalReconcileInput) {
	return ReconciliationWorkerClient.reconcile({
		sourceA: input.sourceA,
		sourceB: input.sourceB,
		...(input.toleranceCents !== undefined
			? { toleranceCents: input.toleranceCents }
			: {}),
	});
}
