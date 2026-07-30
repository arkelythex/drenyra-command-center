import { describe, it, expect, beforeEach } from "vitest";
import { createExecutionId } from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, STATE_SOURCE } from "@drenyra/workspace-application";
import { InMemoryEventStore } from "../store/memory";
import type { EventStore } from "../store/interface";
import { CURRENT_EVENT_SCHEMA_VERSION, type DomainEvent } from "../store/types";

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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InMemoryEventStore", () => {
	let store: EventStore;

	beforeEach(() => {
		store = new InMemoryEventStore();
	});

	describe("append + getEvents", () => {
		it("should append one event and retrieve it by executionId", () => {
			const event = makeEvent();
			store.append(event);
			const events = store.getEvents(event.executionId);
			expect(events).toHaveLength(1);
			expect(events[0]!.eventId).toBe(event.eventId);
			expect(events[0]!.executionId).toBe(event.executionId);
			expect(events[0]!.sequence).toBe(event.sequence);
		});

		it("should retrieve multiple events for the same executionId", () => {
			const executionId = createExecutionId();
			const e1 = makeEvent({ executionId, sequence: 1 });
			const e2 = makeEvent({ executionId, sequence: 2 });

			store.append(e1);
			store.append(e2);

			const events = store.getEvents(executionId);
			expect(events).toHaveLength(2);
		});
	});

	describe("appendBatch", () => {
		it("should append multiple events atomically", () => {
			const executionId = createExecutionId();
			const events = [
				makeEvent({ executionId, sequence: 1 }),
				makeEvent({ executionId, sequence: 2 }),
				makeEvent({ executionId, sequence: 3 }),
			];

			store.appendBatch(events);

			const retrieved = store.getEvents(executionId);
			expect(retrieved).toHaveLength(3);
		});
	});

	describe("deduplication", () => {
		it("should reject duplicate (executionId, sequence)", () => {
			const executionId = createExecutionId();
			const event = makeEvent({ executionId, sequence: 1 });

			store.append(event);

			expect(() => {
				store.append(makeEvent({ executionId, sequence: 1 }));
			}).toThrow();
		});
	});

	describe("getEventsSince", () => {
		it("should return only events after the given sequence", () => {
			const executionId = createExecutionId();
			store.append(makeEvent({ executionId, sequence: 1 }));
			store.append(makeEvent({ executionId, sequence: 2 }));
			store.append(makeEvent({ executionId, sequence: 3 }));

			const since = store.getEventsSince(executionId, 1);
			expect(since).toHaveLength(2);
			expect(since[0]!.sequence).toBe(2);
			expect(since[1]!.sequence).toBe(3);
		});
	});

	describe("getLatestSequence", () => {
		it("should return 0 when no events exist", () => {
			expect(store.getLatestSequence(createExecutionId())).toBe(0);
		});

		it("should return the latest sequence number", () => {
			const executionId = createExecutionId();
			store.append(makeEvent({ executionId, sequence: 1 }));
			store.append(makeEvent({ executionId, sequence: 5 }));
			store.append(makeEvent({ executionId, sequence: 3 }));

			expect(store.getLatestSequence(executionId)).toBe(5);
		});
	});

	describe("getAllExecutionIds", () => {
		it("should return unique execution IDs", () => {
			const e1 = makeEvent();
			const e2 = makeEvent();

			store.append(e1);
			store.append(e2);

			const ids = store.getAllExecutionIds();
			expect(ids).toHaveLength(2);
			expect(ids).toContain(e1.executionId);
			expect(ids).toContain(e2.executionId);
		});
	});

	describe("getEventsInRange", () => {
		it("should return ordered subset across executions", () => {
			const execA = createExecutionId();
			const execB = createExecutionId();

			store.append(makeEvent({ executionId: execA, sequence: 1 }));
			store.append(makeEvent({ executionId: execB, sequence: 1 }));
			store.append(makeEvent({ executionId: execA, sequence: 2 }));
			store.append(makeEvent({ executionId: execB, sequence: 2 }));

			const range = store.getEventsInRange(1, 2);
			// Per-execution: each has seq 1 and seq 2
			expect(range.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("isolation", () => {
		it("should isolate events by executionId", () => {
			const execA = createExecutionId();
			const execB = createExecutionId();

			store.append(makeEvent({ executionId: execA, sequence: 1 }));
			store.append(makeEvent({ executionId: execB, sequence: 1 }));

			expect(store.getEvents(execA)).toHaveLength(1);
			expect(store.getEvents(execB)).toHaveLength(1);
		});
	});
});
