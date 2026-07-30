import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	FRESHNESS_STATE,
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
import {
	detachFromExecution,
	detachFromExecutionSafe,
} from "../detach/service";
import type { DetachRequest } from "../detach/types";

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

describe("detachFromExecution", () => {
	it("should succeed with executionContinues=true for existing execution", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));

		const request: DetachRequest = { executionId };
		const result = detachFromExecution(request, store);

		expect(result.executionId).toBe(executionId);
		expect(result.executionContinues).toBe(true);
	});

	it("should return detachedAt timestamp as ISO 8601", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));

		const request: DetachRequest = { executionId };
		const result = detachFromExecution(request, store);

		expect(result.detachedAt).toBeTruthy();
		// Must parse as valid ISO 8601
		expect(new Date(result.detachedAt).toISOString()).toBe(result.detachedAt);
	});

	it("should return DISCONNECTED freshness on detach", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));

		const request: DetachRequest = { executionId };
		const result = detachFromExecution(request, store);

		expect(result.freshness).toBe(FRESHNESS_STATE.DISCONNECTED);
	});

	it("should throw for non-existent execution", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		const request: DetachRequest = { executionId };

		expect(() => detachFromExecution(request, store)).toThrow();
	});

	it("should include clientId in detach event when provided", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));

		const request: DetachRequest = {
			executionId,
			clientId: "client-abc",
		};
		const result = detachFromExecution(request, store);

		expect(result.executionId).toBe(executionId);
		expect(result.executionContinues).toBe(true);

		// The detach event should have been appended with clientId in payload
		const events = store.getEvents(executionId);
		const detachEvent = events.find((e) => e.type === "client.detached");
		expect(detachEvent).toBeDefined();
		expect(detachEvent!.payload["clientId"]).toBe("client-abc");
	});

	it("should never cancel execution — executionContinues is always true", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));
		store.append(
			makeEvent({ executionId, sequence: 2, type: "execution.completed" }),
		);

		const request: DetachRequest = { executionId };
		const result = detachFromExecution(request, store);

		expect(result.executionContinues).toBe(true);

		// Verify no cancellation event was appended
		const events = store.getEvents(executionId);
		const cancelledEvent = events.find((e) => e.type === "execution.cancelled");
		expect(cancelledEvent).toBeUndefined();
	});
});

describe("detachFromExecutionSafe", () => {
	it("should return ok=true with result for existing execution", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		store.append(makeEvent({ executionId }));

		const request: DetachRequest = { executionId };
		const outcome = detachFromExecutionSafe(request, store);

		expect(outcome.ok).toBe(true);
		expect(outcome.ok && outcome.result.executionId).toBe(executionId);
	});

	it("should return ok=false with error message for non-existent execution", () => {
		const store = new InMemoryEventStore();
		const executionId = createExecutionId();

		const request: DetachRequest = { executionId };
		const outcome = detachFromExecutionSafe(request, store);

		expect(outcome.ok).toBe(false);
		if (!outcome.ok) {
			expect(outcome.error).toBeTruthy();
			expect(typeof outcome.error).toBe("string");
		}
	});
});
