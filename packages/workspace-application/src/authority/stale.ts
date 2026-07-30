import {
	createOperationalState,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	PROJECTED_RISK_TIER,
	FRESHNESS_STATE,
} from "@drenyra/workspace-domain";
import type { OperationalState } from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, type AuthoritativeStateRecord } from "./types";

// ─── Stale Detection ─────────────────────────────────────────────────────────

/**
 * Returns records whose effectiveAt is older than now - staleThresholdMs.
 * Each returned record has its freshness set to "stale".
 */
export function detectStaleRecords(
	records: readonly AuthoritativeStateRecord[],
	now: string,
	staleThresholdMs: number,
): AuthoritativeStateRecord[] {
	const nowMs = new Date(now).getTime();

	return records
		.filter((record) => {
			const effectiveMs = new Date(record.effectiveAt).getTime();
			return nowMs - effectiveMs > staleThresholdMs;
		})
		.map((record) => ({
			...record,
			state: {
				...record.state,
				freshness: FRESHNESS_STATE.STALE,
			},
		}));
}

// ─── Reconcile Unknown ───────────────────────────────────────────────────────

/**
 * If no authoritative record exists for an execution for too long,
 * the reconciled state lifecycle becomes UNKNOWN — never COMPLETED.
 *
 * Only changes non-authoritative records.
 * Authoritative records are preserved as-is.
 */
export function reconcileUnknown(
	records: readonly AuthoritativeStateRecord[],
): AuthoritativeStateRecord[] {
	return records.map((record) => {
		if (record.authority === AUTHORITY_LEVEL.AUTHORITATIVE) {
			return record;
		}

		// Non-authoritative: set lifecycle to UNKNOWN if not already terminal
		return {
			...record,
			state: {
				...record.state,
				lifecycle: LIFECYCLE_STATE.UNKNOWN,
			},
		};
	});
}

// ─── Resolve Current State ───────────────────────────────────────────────────

/**
 * Returns the OperationalState from the most recent authoritative record.
 * If no records exist, returns a default state.
 *
 * Priority: authority level first, then sequence number.
 */
export function resolveCurrentState(
	records: readonly AuthoritativeStateRecord[],
): OperationalState {
	if (records.length === 0) {
		return createOperationalState({
			lifecycle: LIFECYCLE_STATE.QUEUED,
			attention: ATTENTION_STATE.NONE,
			risk: PROJECTED_RISK_TIER.R0,
			freshness: FRESHNESS_STATE.DISCONNECTED,
		});
	}

	const sorted = [...records].sort((a, b) => {
		const rankA = authorityRank(a.authority);
		const rankB = authorityRank(b.authority);
		if (rankA !== rankB) return rankB - rankA; // Higher authority first
		return b.sequence - a.sequence; // Higher sequence first
	});

	const best = sorted[0];
	if (!best) {
		return createOperationalState();
	}

	return best.state;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authorityRank(authority: string): number {
	if (authority === AUTHORITY_LEVEL.AUTHORITATIVE) return 3;
	if (authority === AUTHORITY_LEVEL.REPORTED) return 2;
	return 1;
}
