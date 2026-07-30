import {
	createOperationalState,
	FRESHNESS_STATE,
} from "@drenyra/workspace-domain";
import type { AuthorityStore } from "@drenyra/workspace-application";
import type { EventStore } from "@drenyra/workspace-projections";
import { buildExecutionProjection } from "@drenyra/workspace-projections";
import type { AttachRequest, AttachResult } from "./types";

// ─── Attach Service ─────────────────────────────────────────────────────────

/**
 * Attach to an execution.
 *
 * - If fromSequence is provided (client reconnecting after disconnect),
 *   loads events since fromSequence and applies them to rebuild current state.
 * - If no fromSequence or 0 (fresh attach), loads all events and builds
 *   projection from scratch.
 * - If no events exist, returns default OperationalState gracefully.
 *
 * Attach does NOT cancel anything. It only reads.
 */
export function attachToExecution(
	request: AttachRequest,
	store: EventStore,
	authorityStore: AuthorityStore,
): AttachResult {
	const { executionId } = request;
	const fromSequence = request.fromSequence ?? 0;

	// Load events: after fromSequence if > 0, otherwise all events
	const events =
		fromSequence > 0
			? store.getEventsSince(executionId, fromSequence)
			: store.getEvents(executionId);

	// If no events exist at all, return default state gracefully
	if (events.length === 0 && store.getLatestSequence(executionId) === 0) {
		return {
			executionId,
			currentState: createOperationalState(),
			lastSequence: 0,
			caughtUpEvents: 0,
			attachedAt: new Date().toISOString(),
			freshness: FRESHNESS_STATE.LIVE,
		};
	}

	// Build projection from all events for this execution
	// (for catch-up, we only applied newer events, but projection needs full context)
	const allEvents = store.getEvents(executionId);
	const { current, lastSequence } = buildExecutionProjection(
		executionId,
		allEvents,
	);

	// Get latest authoritative record for freshness
	const latest = authorityStore.getLatestRecord(executionId);

	return {
		executionId,
		currentState: current,
		lastSequence,
		caughtUpEvents: events.length,
		attachedAt: new Date().toISOString(),
		freshness: latest?.state.freshness ?? current.freshness,
	};
}
