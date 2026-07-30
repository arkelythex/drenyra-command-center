// ─── Portfolio Projection ───────────────────────────────────────────────────

import type { AttentionRollup } from "@drenyra/workspace-domain";
import { aggregateRollups } from "@drenyra/workspace-domain";

/**
 * Combine multiple attention rollups into a portfolio-level rollup.
 *
 * Delegates to the domain's `aggregateRollups()` for the core aggregation logic.
 */
export function buildPortfolioProjection(
	rollups: readonly AttentionRollup[],
): AttentionRollup {
	return aggregateRollups(rollups);
}
