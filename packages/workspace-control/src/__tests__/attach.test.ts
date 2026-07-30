import { describe, it, expect } from "vitest";
import {
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	FRESHNESS_STATE,
	createExecutionId,
} from "@drenyra/workspace-domain";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
	InMemoryAuthorityStore,
} from "@drenyra/workspace-application";
import {
	InMemoryEventStore,
	CURRENT_EVENT_SCHEMA_VERSION,
	type DomainEvent,
} from "@drenyra/workspace-projections";
import { attachToExecution } from "../attach/service";
import type { AttachRequest } from "../attach/types";

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

function makeAttachRequest(
	overrides: Partial<AttachRequest> = {},
): AttachRequest {
	return {
		executionId: createExecutionId(),
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("attachToExecution", () => {
	it("should return default OperationalState when no prior events exist", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();
		const request = makeAttachRequest({ executionId });

		const result = attachToExecution(request, store, authorityStore);

		expect(result.executionId).toBe(executionId);
		expect(result.currentState.lifecycle).toBe(LIFECYCLE_STATE.QUEUED);
		expect(result.currentState.attention).toBe(ATTENTION_STATE.NONE);
		expect(result.currentState.risk).toBe("R0");
		expect(result.currentState.freshness).toBe(FRESHNESS_STATE.LIVE);
		expect(result.lastSequence).toBe(0);
		expect(result.caughtUpEvents).toBe(0);
	});

	it("should build state from events via projection", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
		);
		store.append(
			makeEvent({ executionId, sequence: 2, type: "execution.completed" }),
		);

		const request = makeAttachRequest({ executionId });
		const result = attachToExecution(request, store, authorityStore);

		expect(result.currentState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
		expect(result.lastSequence).toBe(2);
		expect(result.caughtUpEvents).toBe(2);
	});

	it("should only catch up events since fromSequence when provided", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
		);
		store.append(
			makeEvent({ executionId, sequence: 2, type: "execution.attention.changed", payload: { attention: "critical" } }),
		);
		store.append(
			makeEvent({ executionId, sequence: 3, type: "execution.completed" }),
		);

		const request = makeAttachRequest({ executionId, fromSequence: 1 });
		const result = attachToExecution(request, store, authorityStore);

		// Only events 2 and 3 applied (after sequence 1)
		expect(result.caughtUpEvents).toBe(2);
		expect(result.lastSequence).toBe(3);
		expect(result.currentState.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
		expect(result.currentState.attention).toBe(ATTENTION_STATE.CRITICAL);
	});

	it("should catch up all events when fromSequence is 0", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
		);

		const request = makeAttachRequest({ executionId, fromSequence: 0 });
		const result = attachToExecution(request, store, authorityStore);

		expect(result.caughtUpEvents).toBe(1);
		expect(result.lastSequence).toBe(1);
		expect(result.currentState.lifecycle).toBe(LIFECYCLE_STATE.RUNNING);
	});

	it("should return correct caughtUpEvents count", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
		);
		store.append(
			makeEvent({ executionId, sequence: 2, type: "execution.failed" }),
		);
		store.append(
			makeEvent({ executionId, sequence: 3, type: "execution.attention.changed", payload: { attention: "critical" } }),
		);

		const request = makeAttachRequest({ executionId, fromSequence: 1 });
		const result = attachToExecution(request, store, authorityStore);

		expect(result.caughtUpEvents).toBe(2);
	});

	it("should return correct freshness in the result", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		store.append(
			makeEvent({
				executionId,
				sequence: 1,
				type: "execution.freshness.changed",
				payload: { freshness: "stale" },
			}),
		);

		const request = makeAttachRequest({ executionId });
		const result = attachToExecution(request, store, authorityStore);

		expect(result.freshness).toBe("stale");
	});

	it("should return default state gracefully for non-existent executionId", () => {
		const store = new InMemoryEventStore();
		const authorityStore = new InMemoryAuthorityStore();
		const executionId = createExecutionId();

		const request = makeAttachRequest({ executionId });
		const result = attachToExecution(request, store, authorityStore);

		expect(result.executionId).toBe(executionId);
		expect(result.currentState.lifecycle).toBe(LIFECYCLE_STATE.QUEUED);
		expect(result.lastSequence).toBe(0);
		expect(result.caughtUpEvents).toBe(0);
		// Not an error — graceful fallback
		expect(result.freshness).toBe(FRESHNESS_STATE.LIVE);
	});
});
