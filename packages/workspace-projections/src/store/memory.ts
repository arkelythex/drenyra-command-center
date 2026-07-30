// ─── In-Memory Event Store ──────────────────────────────────────────────────

import type { ExecutionId } from "@drenyra/workspace-domain";
import type { EventStore } from "./interface";
import type { DomainEvent } from "./types";

/**
 * In-memory implementation of {@link EventStore} for testing.
 *
 * Events are stored per-executionId and deduplicated by (executionId, sequence).
 */
export class InMemoryEventStore implements EventStore {
	// Map<executionId, Map<sequence, DomainEvent>>
	private readonly eventsByExecution: Map<string, Map<number, DomainEvent>> =
		new Map();

	// Global sequence counter for range queries
	private globalOrder: DomainEvent[] = [];

	append(event: DomainEvent): void {
		const key = event.executionId as string;
		let execMap = this.eventsByExecution.get(key);

		if (!execMap) {
			execMap = new Map();
			this.eventsByExecution.set(key, execMap);
		}

		if (execMap.has(event.sequence)) {
			throw new Error(
				`Duplicate event: executionId=${key} sequence=${event.sequence}`,
			);
		}

		execMap.set(event.sequence, event);
		this.globalOrder.push(event);
	}

	appendBatch(events: readonly DomainEvent[]): void {
		// Validate all first for atomicity
		for (const event of events) {
			const key = event.executionId as string;
			const execMap = this.eventsByExecution.get(key);
			if (execMap?.has(event.sequence)) {
				throw new Error(
					`Duplicate event in batch: executionId=${key} sequence=${event.sequence}`,
				);
			}
		}

		// Apply all
		for (const event of events) {
			this.append(event);
		}
	}

	getEvents(executionId: ExecutionId): readonly DomainEvent[] {
		const execMap = this.eventsByExecution.get(executionId as string);
		if (!execMap) return [];
		return Array.from(execMap.values()).sort((a, b) => a.sequence - b.sequence);
	}

	getEventsSince(
		executionId: ExecutionId,
		sequence: number,
	): readonly DomainEvent[] {
		return this.getEvents(executionId).filter((e) => e.sequence > sequence);
	}

	getLatestSequence(executionId: ExecutionId): number {
		const execMap = this.eventsByExecution.get(executionId as string);
		if (!execMap || execMap.size === 0) return 0;
		return Math.max(...execMap.keys());
	}

	getAllExecutionIds(): readonly ExecutionId[] {
		return Array.from(this.eventsByExecution.keys()) as ExecutionId[];
	}

	getEventsInRange(
		fromSequence: number,
		toSequence: number,
	): readonly DomainEvent[] {
		// Return events whose per-execution sequence falls in [fromSequence, toSequence]
		const result: DomainEvent[] = [];
		for (const execMap of this.eventsByExecution.values()) {
			for (const event of execMap.values()) {
				if (event.sequence >= fromSequence && event.sequence <= toSequence) {
					result.push(event);
				}
			}
		}
		return result.sort((a, b) => a.sequence - b.sequence);
	}
}
