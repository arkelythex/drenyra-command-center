import type { AttentionState, ProjectedRiskTier } from "./state";
import { PROJECTED_RISK_TIER } from "./state";

// ─── Current Schema Version ─────────────────────────────────────────────────

/**
 * Bump this when AttentionRollup shape changes.
 */
export const CURRENT_ROLLUP_SCHEMA_VERSION = 1;

// ─── LifecycleSummary ───────────────────────────────────────────────────────

export interface LifecycleSummary {
	readonly total: number;
	readonly completed: number;
	readonly failed: number;
	readonly cancelled: number;
	readonly inProgress: number;
	readonly blocked: number;
	readonly unknown: number;
}

// ─── RollupReason ───────────────────────────────────────────────────────────

export interface RollupReason {
	readonly severity: AttentionState;
	readonly message: string;
	readonly affectedCount: number;
}

// ─── AttentionRollup ────────────────────────────────────────────────────────

export interface AttentionRollup {
	readonly lifecycle: LifecycleSummary;
	readonly counts: AttentionCounts;
	readonly highestRisk: ProjectedRiskTier;
	readonly nearestDeadline?: string;
	readonly estimatedExposure?: string;
	readonly affectedCompanies: number;
	readonly topReasons: readonly RollupReason[];
}

// ─── AttentionCounts ────────────────────────────────────────────────────────

/**
 * Counts per attention dimension.
 * failed and cancelled are explicit — never lumped into a generic "resolved".
 */
export interface AttentionCounts {
	readonly critical: number;
	readonly blocked: number;
	readonly approvalRequired: number;
	readonly evidenceRequired: number;
	readonly failed: number;
	readonly cancelled: number;
	readonly unknown: number;
	readonly working: number;
	readonly completed: number;
}

// ─── Empty Defaults ─────────────────────────────────────────────────────────

const EMPTY_COUNTS: AttentionCounts = {
	critical: 0,
	blocked: 0,
	approvalRequired: 0,
	evidenceRequired: 0,
	failed: 0,
	cancelled: 0,
	unknown: 0,
	working: 0,
	completed: 0,
};

const EMPTY_LIFECYCLE: LifecycleSummary = {
	total: 0,
	completed: 0,
	failed: 0,
	cancelled: 0,
	inProgress: 0,
	blocked: 0,
	unknown: 0,
};

// ─── Factory ────────────────────────────────────────────────────────────────

export function createEmptyAttentionRollup(): AttentionRollup {
	return {
		lifecycle: { ...EMPTY_LIFECYCLE },
		counts: { ...EMPTY_COUNTS },
		highestRisk: PROJECTED_RISK_TIER.R0,
		affectedCompanies: 0,
		topReasons: [],
	};
}

// ─── Risk Ordering ──────────────────────────────────────────────────────────

const RISK_ORDER: Record<ProjectedRiskTier, number> = {
	[PROJECTED_RISK_TIER.R0]: 0,
	[PROJECTED_RISK_TIER.R1]: 1,
	[PROJECTED_RISK_TIER.R2]: 2,
	[PROJECTED_RISK_TIER.R3]: 3,
};

function highestRisk(
	a: ProjectedRiskTier,
	b: ProjectedRiskTier,
): ProjectedRiskTier {
	return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}

// ─── Aggregation ────────────────────────────────────────────────────────────

export function aggregateRollups(
	rollups: readonly AttentionRollup[],
): AttentionRollup {
	if (rollups.length === 0) {
		return createEmptyAttentionRollup();
	}

	let lifecycleTotal = 0;
	let lifecycleCompleted = 0;
	let lifecycleFailed = 0;
	let lifecycleCancelled = 0;
	let lifecycleInProgress = 0;
	let lifecycleBlocked = 0;
	let lifecycleUnknown = 0;

	let critical = 0;
	let blocked = 0;
	let approvalRequired = 0;
	let evidenceRequired = 0;
	let failed = 0;
	let cancelled = 0;
	let unknown = 0;
	let working = 0;
	let completed = 0;

	let maxRisk: ProjectedRiskTier = PROJECTED_RISK_TIER.R0;
	let affectedCompanies = 0;

	const reasonMap = new Map<string, RollupReason>();

	for (const r of rollups) {
		lifecycleTotal += r.lifecycle.total;
		lifecycleCompleted += r.lifecycle.completed;
		lifecycleFailed += r.lifecycle.failed;
		lifecycleCancelled += r.lifecycle.cancelled;
		lifecycleInProgress += r.lifecycle.inProgress;
		lifecycleBlocked += r.lifecycle.blocked;
		lifecycleUnknown += r.lifecycle.unknown;

		critical += r.counts.critical;
		blocked += r.counts.blocked;
		approvalRequired += r.counts.approvalRequired;
		evidenceRequired += r.counts.evidenceRequired;
		failed += r.counts.failed;
		cancelled += r.counts.cancelled;
		unknown += r.counts.unknown;
		working += r.counts.working;
		completed += r.counts.completed;

		maxRisk = highestRisk(maxRisk, r.highestRisk);
		affectedCompanies += r.affectedCompanies;

		for (const reason of r.topReasons) {
			const existing = reasonMap.get(reason.message);
			if (existing) {
				reasonMap.set(reason.message, {
					...existing,
					affectedCount: existing.affectedCount + reason.affectedCount,
				});
			} else {
				reasonMap.set(reason.message, { ...reason });
			}
		}
	}

	return {
		lifecycle: {
			total: lifecycleTotal,
			completed: lifecycleCompleted,
			failed: lifecycleFailed,
			cancelled: lifecycleCancelled,
			inProgress: lifecycleInProgress,
			blocked: lifecycleBlocked,
			unknown: lifecycleUnknown,
		},
		counts: {
			critical,
			blocked,
			approvalRequired,
			evidenceRequired,
			failed,
			cancelled,
			unknown,
			working,
			completed,
		},
		highestRisk: maxRisk,
		affectedCompanies,
		topReasons: Array.from(reasonMap.values()),
	};
}
