import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
	LIFECYCLE_STATE,
} from "@drenyra/workspace-domain";
import { reduceExecutionState } from "../authority/reducer";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
	CURRENT_AUTHORITY_SCHEMA_VERSION,
	type AuthoritativeStateRecord,
	type StateEvent,
} from "../authority/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRecord(
	overrides: Partial<AuthoritativeStateRecord> = {},
): AuthoritativeStateRecord {
	const now = "2026-07-15T10:00:00.000Z";
	return {
		executionId: createExecutionId(),
		state: createOperationalState(),
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.PI,
		sequence: 1,
		observedAt: now,
		effectiveAt: now,
		schemaVersion: CURRENT_AUTHORITY_SCHEMA_VERSION,
		...overrides,
	};
}

function makeEvent(overrides: Partial<StateEvent> = {}): StateEvent {
	const now = "2026-07-15T10:00:00.000Z";
	return {
		executionId: createExecutionId(),
		newState: createOperationalState(),
		authority: AUTHORITY_LEVEL.OBSERVED,
		source: STATE_SOURCE.PI,
		sequence: 1,
		observedAt: now,
		effectiveAt: now,
		...overrides,
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("reduceExecutionState — State Reducer", () => {
	it("should apply a valid event to empty records", () => {
		const event = makeEvent();
		const result = reduceExecutionState([], event);

		expect(result.records).toHaveLength(1);
		expect(result.records[0]!.executionId).toBe(event.executionId);
		expect(result.records[0]!.sequence).toBe(event.sequence);
		expect(result.current).toEqual(event.newState);
	});

	it("should reject duplicate event (same executionId + sequence)", () => {
		const event = makeEvent({ sequence: 1 });
		const existingRecord = makeRecord({
			executionId: event.executionId,
			sequence: 1,
		});
		const result = reduceExecutionState([existingRecord], event);

		expect(result.records).toHaveLength(1);
	});

	it("should apply two sequential events and set current to latest", () => {
		const executionId = createExecutionId();
		const event1 = makeEvent({
			executionId,
			sequence: 1,
			newState: createOperationalState({
				lifecycle: LIFECYCLE_STATE.RUNNING,
			}),
		});
		const event2 = makeEvent({
			executionId,
			sequence: 2,
			newState: createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
			}),
		});

		const afterFirst = reduceExecutionState([], event1);
		const afterSecond = reduceExecutionState(afterFirst.records, event2);

		expect(afterSecond.records).toHaveLength(2);
		expect(afterSecond.current.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should reject lower authority event after higher authority", () => {
		const executionId = createExecutionId();
		const authoritativeEvent = makeEvent({
			executionId,
			sequence: 1,
			authority: AUTHORITY_LEVEL.REPORTED,
		});
		const observedEvent = makeEvent({
			executionId,
			sequence: 2,
			authority: AUTHORITY_LEVEL.OBSERVED,
		});

		const afterAuth = reduceExecutionState([], authoritativeEvent);
		const afterObs = reduceExecutionState(afterAuth.records, observedEvent);

		expect(afterObs.records).toHaveLength(1);
		expect(afterObs.records[0]!.authority).toBe(AUTHORITY_LEVEL.REPORTED);
	});

	it("should reject same authority out-of-order sequence", () => {
		const executionId = createExecutionId();
		const event1 = makeEvent({
			executionId,
			sequence: 5,
			authority: AUTHORITY_LEVEL.REPORTED,
		});
		const event2 = makeEvent({
			executionId,
			sequence: 2,
			authority: AUTHORITY_LEVEL.REPORTED,
		});

		const afterFirst = reduceExecutionState([], event1);
		const afterSecond = reduceExecutionState(afterFirst.records, event2);

		expect(afterSecond.records).toHaveLength(1);
	});

	it("should track multiple executionIds independently", () => {
		const execA = createExecutionId();
		const execB = createExecutionId();
		const eventA = makeEvent({ executionId: execA, sequence: 1 });
		const eventB = makeEvent({ executionId: execB, sequence: 1 });

		const afterA = reduceExecutionState([], eventA);
		const afterB = reduceExecutionState(afterA.records, eventB);

		expect(afterB.records).toHaveLength(2);
		const ids = afterB.records.map((r) => r.executionId);
		expect(ids).toContain(execA);
		expect(ids).toContain(execB);
	});

	it("should not change records when event is rejected", () => {
		const executionId = createExecutionId();
		const existing = makeRecord({
			executionId,
			sequence: 5,
			authority: AUTHORITY_LEVEL.REPORTED,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING }),
		});
		const rejected = makeEvent({
			executionId,
			sequence: 2,
			authority: AUTHORITY_LEVEL.REPORTED,
			newState: createOperationalState({
				lifecycle: LIFECYCLE_STATE.COMPLETED,
			}),
		});

		const result = reduceExecutionState([existing], rejected);

		expect(result.records).toHaveLength(1);
		expect(result.records[0]!.sequence).toBe(5);
		expect(result.current.lifecycle).toBe(LIFECYCLE_STATE.RUNNING);
	});
});
