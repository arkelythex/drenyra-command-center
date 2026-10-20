/**
 * Reconciliation Service — read-only facade over the shadow metrics.
 *
 * Linking a bank movement to an invoice or bill goes only through
 * `/api/reconciliations` (features/reconciliations), which re-checks the
 * proposal and locks the document so it is linked once.
 */

import type {
	ReconciliationShadowCutoverEvaluation,
	ReconciliationShadowMetricsSnapshot,
} from "./reconciliation.types";
import { ShadowMetricsService } from "./reconciliation-shadow.service";

/**
 * Exposes the persisted Go-worker shadow runs for the cutover decision.
 *
 * @example
 * ```ts
 * const metrics = await ReconciliationService.getShadowMetrics("cmp_1");
 * ```
 */
export const ReconciliationService = {
	async getShadowMetrics(
		companyId?: string,
	): Promise<ReconciliationShadowMetricsSnapshot> {
		return ShadowMetricsService.getSnapshot(companyId);
	},

	async evaluateShadowCutover(
		companyId?: string,
		windowRuns = 30,
	): Promise<ReconciliationShadowCutoverEvaluation> {
		return ShadowMetricsService.evaluateCutover(companyId, windowRuns);
	},
};
