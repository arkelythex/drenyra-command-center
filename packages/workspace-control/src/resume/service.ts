import {
	createOperationalState,
	FRESHNESS_STATE,
} from "@drenyra/workspace-domain";
import type { AuthorityStore } from "@drenyra/workspace-application";
import type { EventStore } from "@drenyra/workspace-projections";
import { buildExecutionProjection } from "@drenyra/workspace-projections";
import type {
	ResumeRequest,
	ResumeResult,
	ResumeExecutionState,
} from "./types";

// ─── Resume Service ─────────────────────────────────────────────────────────

/**
 * Resume a workspace by checking execution states.
 *
 * Logic:
 * 1. For each executionId:
 *    a. Load events from EventStore.
 *    b. Build current state via buildExecutionProjection.
 *    c. Check freshness based on latest event timestamp.
 *    d. Count caughtUpEvents.
 * 2. Categorize as "live", "stale", or "unavailable".
 * 3. Return ResumeResult with all states.
 */
export function resumeWorkspace(
	request: ResumeRequest,
	store: EventStore,
	_authorityStore: AuthorityStore,
): ResumeResult {
	const { workspaceId, executionIds } = request;

	const states: ResumeExecutionState[] = [];
	let attended = 0;

	for (const executionId of executionIds) {
		const allEvents = store.getEvents(executionId);
		const latestSequence = store.getLatestSequence(executionId);

		if (latestSequence === 0 || allEvents.length === 0) {
			// No events — unavailable
			states.push({
				executionId,
				currentState: createOperationalState(),
				lastSequence: 0,
				caughtUpEvents: 0,
				status: "unavailable",
			});
		} else {
			// Has events — determine freshness
			const { current, lastSequence } = buildExecutionProjection(
				executionId,
				allEvents,
			);

			const caughtUpEvents = allEvents.length;

			// Determine status based on freshness
			let status: "live" | "stale" | "unavailable";
			const freshness = current.freshness;

			if (
				freshness === FRESHNESS_STATE.LIVE ||
				freshness === FRESHNESS_STATE.RECONCILING
			) {
				status = "live";
				attended++;
			} else if (
				freshness === FRESHNESS_STATE.STALE ||
				freshness === FRESHNESS_STATE.DELAYED
			) {
				status = "stale";
				attended++;
			} else {
				// DISCONNECTED or any other state
				status = "live";
				attended++;
			}

			states.push({
				executionId,
				currentState: current,
				lastSequence,
				caughtUpEvents,
				status,
			});
		}
	}

	return {
		workspaceId,
		executionStates: states,
		attended,
		total: executionIds.length,
		resumedAt: new Date().toISOString(),
	};
}
