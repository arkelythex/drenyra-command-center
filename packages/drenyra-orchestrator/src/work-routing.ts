/**
 * @drenyra/orchestrator — work-routing ADAPTER SHIM.
 *
 * The canonical review-workload forecast lives in `drenyra-ai` (released
 * v0.0.1-prealpha.1). This file re-exports the forecast logic from the single
 * authority. `ReviewWorkloadForecast` / `DeliveryStrategy` / `ChainStrategy`
 * stay defined in `./types.ts` (same shapes) to avoid duplicate exports.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; line counts and version numbers are JSON
 * integers, never floats.
 */

export type { WorkloadInput } from "drenyra-ai/review";
export {
	forecastReviewWorkload,
	getWorkflowInstructions,
} from "drenyra-ai/review";
