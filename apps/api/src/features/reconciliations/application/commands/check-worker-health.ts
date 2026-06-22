/**
 * CheckWorkerHealth — Checks the Go reconciliation worker health.
 *
 * @module reconciliations/application/commands
 */

import { ReconciliationWorkerClient } from "../../../../shared/clients/reconciliation-worker.client";

export interface WorkerHealthResult {
	status: string;
}

/**
 * Checks the health of the Go reconciliation worker.
 *
 * @returns The worker health status
 */
export async function checkWorkerHealth(): Promise<WorkerHealthResult> {
	return ReconciliationWorkerClient.healthCheck();
}
