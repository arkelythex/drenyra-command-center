// ─── Event Store Interface ───────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";
import type { DomainEvent } from "./types";

/**
 * Append-only event store contract.
 *
 * Events are immutable once written. The store is responsible for
 * per-executionId ordering and deduplication by (executionId, sequence).
 */
export interface EventStore {
	/** Append one event. Throws if (executionId, sequence) already exists. */
	append(event: DomainEvent): void;

	/** Append multiple events atomically. All-or-nothing. */
	appendBatch(events: readonly DomainEvent[]): void;

	/** Get all events for a given execution, ordered by sequence. */
	getEvents(executionId: ExecutionId): readonly DomainEvent[];

	/** Get events after a given sequence (exclusive), ordered by sequence. */
	getEventsSince(
		executionId: ExecutionId,
		sequence: number,
	): readonly DomainEvent[];

	/** Get the latest sequence number for an execution. Returns 0 if none. */
	getLatestSequence(executionId: ExecutionId): number;

	/** Return all tracked execution IDs. */
	getAllExecutionIds(): readonly ExecutionId[];

	/** Get events across all executions within a range of global ordering. */
	getEventsInRange(
		fromSequence: number,
		toSequence: number,
	): readonly DomainEvent[];
}
