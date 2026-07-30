import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
	LIFECYCLE_STATE,
	ATTENTION_STATE,
} from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, STATE_SOURCE } from "@drenyra/workspace-application";
import { CURRENT_EVENT_SCHEMA_VERSION, type DomainEvent } from "../store/types";
import {
	buildExecutionProjection,
	applyEventToProjection,
} from "../projections/execution-projection";

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

describe("applyEventToProjection", () => {
	it("should set lifecycle to running on execution.started", () => {
		const current = createOperationalState();
		const event = makeEvent({ type: "execution.started" });
		const result = applyEventToProjection(current, event);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.RUNNING);
	});

	it("should set lifecycle to completed on execution.completed", () => {
		const current = createOperationalState();
		const event = makeEvent({ type: "execution.completed" });
		const result = applyEventToProjection(current, event);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should set lifecycle to failed on execution.failed", () => {
		const current = createOperationalState();
		const event = makeEvent({ type: "execution.failed" });
		const result = applyEventToProjection(current, event);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.FAILED);
	});

	it("should set lifecycle to cancelled on execution.cancelled", () => {
		const current = createOperationalState();
		const event = makeEvent({ type: "execution.cancelled" });
		const result = applyEventToProjection(current, event);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.CANCELLED);
	});

	it("should update attention on execution.attention.changed", () => {
		const current = createOperationalState();
		const event = makeEvent({
			type: "execution.attention.changed",
			payload: { attention: "critical" },
		});
		const result = applyEventToProjection(current, event);
		expect(result.attention).toBe(ATTENTION_STATE.CRITICAL);
	});

	it("should update freshness on execution.freshness.changed", () => {
		const current = createOperationalState();
		const event = makeEvent({
			type: "execution.freshness.changed",
			payload: { freshness: "stale" },
		});
		const result = applyEventToProjection(current, event);
		expect(result.freshness).toBe("stale");
	});
});

describe("buildExecutionProjection", () => {
	it("should return default OperationalState for no events", () => {
		const executionId = createExecutionId();
		const { current } = buildExecutionProjection(executionId, []);
		expect(current.lifecycle).toBe(LIFECYCLE_STATE.QUEUED);
		expect(current.attention).toBe(ATTENTION_STATE.NONE);
	});

	it("should apply multiple events in sequence order", () => {
		const executionId = createExecutionId();
		const events: DomainEvent[] = [
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
			makeEvent({ executionId, sequence: 2, type: "execution.completed" }),
		];

		const { current, lastSequence } = buildExecutionProjection(
			executionId,
			events,
		);
		expect(current.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
		expect(lastSequence).toBe(2);
	});

	it("should process events in order despite insertion order", () => {
		const executionId = createExecutionId();
		const events: DomainEvent[] = [
			makeEvent({ executionId, sequence: 3, type: "execution.completed" }),
			makeEvent({ executionId, sequence: 1, type: "execution.started" }),
			makeEvent({
				executionId,
				sequence: 2,
				type: "execution.attention.changed",
				payload: { attention: "blocked" },
			}),
		];

		const { current } = buildExecutionProjection(executionId, events);
		// Sequence order: 1=started → running, 2=attention→blocked, 3=completed
		expect(current.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
		expect(current.attention).toBe(ATTENTION_STATE.BLOCKED);
	});
});
