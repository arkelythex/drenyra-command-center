import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
} from "@drenyra/workspace-domain";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
} from "@drenyra/workspace-application";
import {
	InMemoryEventStore,
	CURRENT_EVENT_SCHEMA_VERSION,
	type DomainEvent,
} from "@drenyra/workspace-projections";
import { catchUpEvents } from "../resume/catch-up";

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

describe("catchUpEvents", () => {
	it("should return all events when fromSequence is 0", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId, sequence: 1, type: "execution.started" }));
		store.append(makeEvent({ executionId, sequence: 2, type: "execution.completed" }));

		const result = catchUpEvents(executionId, store, 0);

		expect(result.caughtUp).toHaveLength(2);
		expect(result.lastSequence).toBe(2);
		expect(result.newState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should return empty result when fromSequence equals latest", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId, sequence: 1, type: "execution.started" }));
		store.append(makeEvent({ executionId, sequence: 2, type: "execution.completed" }));

		const result = catchUpEvents(executionId, store, 2);

		expect(result.caughtUp).toHaveLength(0);
		expect(result.lastSequence).toBe(2);
		// State should reflect current (full) state from all events
		expect(result.newState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should return only events newer than fromSequence from mid-sequence", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId, sequence: 1, type: "execution.started" }));
		store.append(makeEvent({ executionId, sequence: 2, type: "execution.attention.changed", payload: { attention: "blocked" } }));
		store.append(makeEvent({ executionId, sequence: 3, type: "execution.completed" }));

		const result = catchUpEvents(executionId, store, 1);

		expect(result.caughtUp).toHaveLength(2);
		expect(result.caughtUp[0]!.sequence).toBe(2);
		expect(result.caughtUp[1]!.sequence).toBe(3);
		expect(result.lastSequence).toBe(3);
	});

	it("should build correct newState after applying caught events", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId, sequence: 1, type: "execution.started" }));
		store.append(makeEvent({ executionId, sequence: 2, type: "execution.attention.changed", payload: { attention: "critical" } }));
		store.append(makeEvent({ executionId, sequence: 3, type: "execution.failed" }));

		const result = catchUpEvents(executionId, store, 1);

		// Events 2+3 applied: attention=critical → lifecycle=failed
		expect(result.newState.lifecycle).toBe(LIFECYCLE_STATE.FAILED);
		expect(result.newState.attention).toBe(ATTENTION_STATE.CRITICAL);
	});

	it("should return correct lastSequence in result", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId, sequence: 5, type: "execution.started" }));

		const result = catchUpEvents(executionId, store, 2);

		expect(result.lastSequence).toBe(5);
	});

	it("should return empty result and default state when no events exist", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		const result = catchUpEvents(executionId, store, 0);

		expect(result.caughtUp).toHaveLength(0);
		expect(result.lastSequence).toBe(0);
		expect(result.newState.lifecycle).toBe(LIFECYCLE_STATE.QUEUED);
		expect(result.newState.attention).toBe(ATTENTION_STATE.NONE);
	});
});
