/**
 * @drenyra/orchestrator — review-lenses ADAPTER SHIM.
 *
 * The canonical proportional-review lens selection lives in `drenyra-ai`
 * (released v0.0.1-prealpha.1). This file re-exports the selection logic from
 * the single authority. `ReviewLens` / `ALL_4R_LENSES` / `ReviewLensConfig`
 * stay defined in `./types.ts` (same union values) to avoid duplicate exports.
 *
 * Fiscal convention: monetary values in the Drenyra ecosystem are BigInt cents;
 * no float is ever used for money; version numbers are JSON integers, never
 * floats.
 */

export type {
	LensSelectionInput,
	LensSelectionResult,
} from "drenyra-ai/review";
export {
	getLensDescription,
	isHotPath,
	selectReviewLenses,
} from "drenyra-ai/review";
