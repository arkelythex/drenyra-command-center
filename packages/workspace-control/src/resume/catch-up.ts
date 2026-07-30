import type { ExecutionId } from "@drenyra/workspace-domain";
import { createOperationalState } from "@drenyra/workspace-domain";
import type { EventStore } from "@drenyra/workspace-projections";
import { applyEventToProjection } from "@drenyra/workspace-projections";
import type { DomainEvent } from "@drenyra/workspace-projections";
import type { OperationalState } from "@drenyra/workspace-domain";

// ─── Catch-Up ───────────────────────────────────────────────────────────────

/**
 * Catch up on events for an execution since a given sequence.
 *
 * Logic:
 * 1. Get events for executionId after fromSequence.
 * 2. Apply events in order to build the new OperationalState.
 * 3. Return caughtUp events, newState, and latest sequence number.
 * 4. If fromSequence is 0 (never seen) → return all events + built state.
 * 5. If fromSequence equals latest → return empty caughtUp, current state unchanged.
 */
export function catchUpEvents(
	executionId: ExecutionId,
	store: EventStore,
	fromSequence: number,
): {
	caughtUp: readonly DomainEvent[];
	newState: OperationalState;
	lastSequence: number;
} {
	const latestSequence = store.getLatestSequence(executionId);

	// If no events exist at all
	if (latestSequence === 0) {
		return {
			caughtUp: [],
			newState: createOperationalState(),
			lastSequence: 0,
		};
	}

	// If fromSequence equals or exceeds latest, nothing to catch up
	if (fromSequence >= latestSequence) {
		// Build current state from all events
		const allEvents = store.getEvents(executionId);
		let current = createOperationalState();
		for (const event of allEvents) {
			current = applyEventToProjection(current, event);
		}
		return {
			caughtUp: [],
			newState: current,
			lastSequence: latestSequence,
		};
	}

	// Get events after fromSequence
	const caughtUp = store.getEventsSince(executionId, fromSequence);

	// Start from default state and apply all events to get the full current state
	const allEvents = store.getEvents(executionId);
	let newState = createOperationalState();
	for (const event of allEvents) {
		newState = applyEventToProjection(newState, event);
	}

	return {
		caughtUp,
		newState,
		lastSequence: latestSequence,
	};
}
