// ─── Replay Engine ──────────────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";
import type { EventStore } from "../store/interface";
import type { DomainEvent } from "../store/types";
import type { Checkpoint } from "../projections/types";

/**
 * Replay events from a checkpoint.
 *
 * 1. Read the checkpoint's lastAppliedSequence.
 * 2. Load all events after that sequence from the store.
 * 3. Return the events and the starting sequence for projection rebuild.
 */
export function replayFromCheckpoint(
	store: EventStore,
	checkpoint: Checkpoint,
	executionId: ExecutionId,
): { events: readonly DomainEvent[]; fromSequence: number } {
	const fromSequence = checkpoint.sequence;
	const events = store.getEventsSince(executionId, fromSequence);

	return { events, fromSequence };
}
