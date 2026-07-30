import { describe, it, expect, beforeEach } from "vitest";
import { createExecutionId } from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, STATE_SOURCE } from "@drenyra/workspace-application";
import { InMemoryEventStore } from "../store/memory";
import type { EventStore } from "../store/interface";
import { CURRENT_EVENT_SCHEMA_VERSION, type DomainEvent } from "../store/types";
import type { Checkpoint } from "../projections/types";
import { replayFromCheckpoint } from "../checkpoint/replay";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
	return {
		eventId: crypto.randomUUID(),
		executionId: createExecutionId(),
		sequence: 1,
		type: "execution.started",
		payload: {},
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.PI,
		timestamp: "2026-07-15T10:00:00.000Z",
		schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
		...overrides,
	};
}

function makeCheckpoint(overrides: Partial<Checkpoint> = {}): Checkpoint {
	return {
		projectionId: "proj-1",
		executionId: createExecutionId(),
		sequence: 0,
		state: {},
		timestamp: "2026-07-15T10:00:00.000Z",
		schemaVersion: 1,
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("replayFromCheckpoint", () => {
	let store: EventStore;
	const executionId = createExecutionId();

	beforeEach(() => {
		store = new InMemoryEventStore();
	});

	it("should replay events after checkpoint sequence", () => {
		// Append events: seq 1, 2, 3, 4, 5
		for (let i = 1; i <= 5; i++) {
			store.append(makeEvent({ executionId, sequence: i }));
		}

		const checkpoint: Checkpoint = makeCheckpoint({
			executionId,
			sequence: 2,
		});

		const { events, fromSequence } = replayFromCheckpoint(
			store,
			checkpoint,
			executionId,
		);

		expect(fromSequence).toBe(2);
		// We expect events after the checkpoint's sequence (exclusive)
		const sequences = events.map((e) => e.sequence);
		expect(sequences).toEqual([3, 4, 5]);
	});

	it("should replay from sequence 0 when no checkpoint exists", () => {
		for (let i = 1; i <= 3; i++) {
			store.append(makeEvent({ executionId, sequence: i }));
		}

		const checkpoint: Checkpoint = makeCheckpoint({
			executionId,
			sequence: 0,
		});

		const { events, fromSequence } = replayFromCheckpoint(
			store,
			checkpoint,
			executionId,
		);

		expect(fromSequence).toBe(0);
		const sequences = events.map((e) => e.sequence);
		expect(sequences).toEqual([1, 2, 3]);
	});

	it("should include events appended after checkpoint", () => {
		store.append(makeEvent({ executionId, sequence: 1 }));
		store.append(makeEvent({ executionId, sequence: 2 }));

		const checkpoint: Checkpoint = makeCheckpoint({
			executionId,
			sequence: 1,
		});

		// Append more after checkpoint
		store.append(makeEvent({ executionId, sequence: 3 }));
		store.append(makeEvent({ executionId, sequence: 4 }));

		const { events } = replayFromCheckpoint(store, checkpoint, executionId);
		const sequences = events.map((e) => e.sequence);
		expect(sequences).toEqual([2, 3, 4]);
	});
});
