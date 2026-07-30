// ─── Freshness Projection ───────────────────────────────────────────────────

import type { ExecutionId, FreshnessState } from "@drenyra/workspace-domain";
import { FRESHNESS_STATE } from "@drenyra/workspace-domain";
import type { DomainEvent } from "../store/types";

/**
 * Derive freshness states for a set of executions based on their latest events.
 *
 * Threshold bands (relative to staleThresholdMs):
 *   - within 1x        → LIVE
 *   - between 1x–2x    → DELAYED
 *   - past 2x          → STALE
 *   - past 5x          → DISCONNECTED
 */
export function buildFreshnessProjection(
	events: readonly DomainEvent[],
	now: string,
	staleThresholdMs: number,
): Map<ExecutionId, FreshnessState> {
	const nowMs = new Date(now).getTime();

	// Group events by executionId and find latest timestamp per execution
	const latestByExecution = new Map<ExecutionId, string>();

	for (const event of events) {
		const existing = latestByExecution.get(event.executionId);
		if (!existing || event.timestamp > existing) {
			latestByExecution.set(event.executionId, event.timestamp);
		}
	}

	const result = new Map<ExecutionId, FreshnessState>();

	for (const [executionId, latestTimestamp] of latestByExecution) {
		const eventMs = new Date(latestTimestamp).getTime();
		const ageMs = nowMs - eventMs;

		if (ageMs <= staleThresholdMs) {
			result.set(executionId, FRESHNESS_STATE.LIVE);
		} else if (ageMs <= 2 * staleThresholdMs) {
			result.set(executionId, FRESHNESS_STATE.DELAYED);
		} else if (ageMs <= 5 * staleThresholdMs) {
			result.set(executionId, FRESHNESS_STATE.STALE);
		} else {
			result.set(executionId, FRESHNESS_STATE.DISCONNECTED);
		}
	}

	return result;
}
