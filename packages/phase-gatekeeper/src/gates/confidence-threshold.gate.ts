/**
 * ConfidenceThresholdGate — validates that arbitration/output confidence
 * meets the minimum threshold before proceeding.
 */

import type {
	GatekeeperCheck,
	GatekeeperContext,
	GatekeeperVerdict,
} from "../types";

export interface ConfidenceCheckInput {
	arbitrationDecision?: {
		confidence?: number;
		decision?: string;
		[key: string]: unknown;
	};
	processingLog?: {
		stages?: Record<string, { status?: string; [key: string]: unknown }>;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/** Minimum confidence threshold (0.0 - 1.0). */
export const MIN_CONFIDENCE_THRESHOLD = 0.7;

/** Lower threshold for manual review escalation. */
export const MANUAL_REVIEW_THRESHOLD = 0.5;

/**
 * Gate that checks if the arbitration/output confidence meets the threshold.
 *
 * - >= 0.7: PASS (INFO)
 * - 0.5 - 0.7: PASS with WARNING (manual review recommended)
 * - < 0.5: BLOCKING (manual review required)
 */
export const CONFIDENCE_THRESHOLD_GATE: GatekeeperCheck<ConfidenceCheckInput> =
	{
		name: "ConfidenceThresholdGate",
		description: `Validates that arbitration confidence meets minimum threshold (>= ${MIN_CONFIDENCE_THRESHOLD})`,

		check: (data, _ctx: GatekeeperContext): GatekeeperVerdict => {
			const arbitration = data.arbitrationDecision;
			const confidence = arbitration?.confidence ?? 0;

			if (confidence >= MIN_CONFIDENCE_THRESHOLD) {
				return {
					passed: true,
					reasons: [
						`Confidence ${confidence} meets threshold ${MIN_CONFIDENCE_THRESHOLD}`,
					],
					severity: "INFO",
					details: {
						confidence,
						threshold: MIN_CONFIDENCE_THRESHOLD,
						decision: arbitration?.decision,
					},
				};
			}

			if (confidence >= MANUAL_REVIEW_THRESHOLD) {
				return {
					passed: true,
					reasons: [
						`Confidence ${confidence} below preferred threshold ${MIN_CONFIDENCE_THRESHOLD} but above manual review floor ${MANUAL_REVIEW_THRESHOLD}`,
					],
					severity: "WARNING",
					details: {
						confidence,
						threshold: MIN_CONFIDENCE_THRESHOLD,
						manualReviewFloor: MANUAL_REVIEW_THRESHOLD,
					},
				};
			}

			return {
				passed: false,
				reasons: [
					`Confidence ${confidence} below minimum threshold ${MANUAL_REVIEW_THRESHOLD}`,
					"Manual review required before proceeding",
				],
				severity: "BLOCKING",
				details: {
					confidence,
					threshold: MIN_CONFIDENCE_THRESHOLD,
					manualReviewFloor: MANUAL_REVIEW_THRESHOLD,
				},
			};
		},
	};
