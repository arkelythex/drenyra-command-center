// ─── Attention Projection ───────────────────────────────────────────────────

import type {
	ExecutionId,
	OperationalState,
	AttentionRollup,
} from "@drenyra/workspace-domain";
import {
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	createEmptyAttentionRollup,
	PROJECTED_RISK_TIER,
} from "@drenyra/workspace-domain";

/**
 * Derive an AttentionRollup from a set of execution states.
 *
 * Pure function — no side effects.
 */
export function buildAttentionProjection(
	executionStates: ReadonlyMap<ExecutionId, OperationalState>,
): AttentionRollup {
	const base = createEmptyAttentionRollup();

	if (executionStates.size === 0) {
		return base;
	}

	let total = 0;
	let completed = 0;
	let failed = 0;
	let cancelled = 0;
	let inProgress = 0;
	let blocked_lifecycle = 0;
	let unknown_lifecycle = 0;

	const counts = { ...base.counts };

	for (const state of executionStates.values()) {
		total++;

		// Lifecycle summary
		switch (state.lifecycle) {
			case LIFECYCLE_STATE.COMPLETED:
				completed++;
				break;
			case LIFECYCLE_STATE.FAILED:
				failed++;
				break;
			case LIFECYCLE_STATE.CANCELLED:
				cancelled++;
				break;
			case LIFECYCLE_STATE.UNKNOWN:
				unknown_lifecycle++;
				break;
			default:
				// running, starting, verifying, waiting — in progress
				inProgress++;
				break;
		}

		// Attention counts
		switch (state.attention) {
			case ATTENTION_STATE.CRITICAL:
				counts.critical++;
				break;
			case ATTENTION_STATE.BLOCKED:
				counts.blocked++;
				blocked_lifecycle++;
				break;
			case ATTENTION_STATE.APPROVAL_REQUIRED:
				counts.approvalRequired++;
				break;
			case ATTENTION_STATE.EVIDENCE_REQUIRED:
				counts.evidenceRequired++;
				break;
		}

		// Lifecycle-based counts
		switch (state.lifecycle) {
			case LIFECYCLE_STATE.FAILED:
				counts.failed++;
				break;
			case LIFECYCLE_STATE.CANCELLED:
				counts.cancelled++;
				break;
			case LIFECYCLE_STATE.UNKNOWN:
				counts.unknown++;
				break;
			case LIFECYCLE_STATE.COMPLETED:
				counts.completed++;
				break;
			default:
				// running, starting, verifying, waiting
				counts.working++;
				break;
		}
	}

	return {
		lifecycle: {
			total,
			completed,
			failed,
			cancelled,
			inProgress,
			blocked: blocked_lifecycle,
			unknown: unknown_lifecycle,
		},
		counts,
		highestRisk: PROJECTED_RISK_TIER.R0,
		affectedCompanies: 0,
		topReasons: [],
	};
}
