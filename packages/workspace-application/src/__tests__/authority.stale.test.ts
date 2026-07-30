import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
} from "@drenyra/workspace-domain";
import {
	LIFECYCLE_STATE,
	ATTENTION_STATE,
	PROJECTED_RISK_TIER,
	FRESHNESS_STATE,
} from "@drenyra/workspace-domain";
import {
	detectStaleRecords,
	reconcileUnknown,
	resolveCurrentState,
} from "../authority/stale";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
	CURRENT_AUTHORITY_SCHEMA_VERSION,
	type AuthoritativeStateRecord,
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

// ─── detectStaleRecords ──────────────────────────────────────────────────────

describe("detectStaleRecords", () => {
	it("should return empty when no records", () => {
		const result = detectStaleRecords([], "2026-07-15T10:00:00.000Z", 60000);
		expect(result).toHaveLength(0);
	});

	it("should not mark records within threshold as stale", () => {
		const record = makeRecord({ effectiveAt: "2026-07-15T09:59:30.000Z" });
		// now = 10:00:00, threshold = 60000ms (1 min), record is 30s old → within threshold
		const result = detectStaleRecords(
			[record],
			"2026-07-15T10:00:00.000Z",
			60000,
		);
		expect(result).toHaveLength(0);
	});

	it("should mark records past threshold as stale", () => {
		const record = makeRecord({ effectiveAt: "2026-07-15T09:58:00.000Z" });
		// now = 10:00:00, threshold = 60000ms (1 min), record is 2 min old → stale
		const result = detectStaleRecords(
			[record],
			"2026-07-15T10:00:00.000Z",
			60000,
		);
		expect(result).toHaveLength(1);
		expect(result[0]!.state.freshness).toBe(FRESHNESS_STATE.STALE);
	});

	it("should only mark records past threshold, not all records", () => {
		const fresh = makeRecord({
			executionId: "fresh-id" as ReturnType<typeof createExecutionId>,
			effectiveAt: "2026-07-15T09:59:30.000Z",
		});
		const stale = makeRecord({
			executionId: "stale-id" as ReturnType<typeof createExecutionId>,
			effectiveAt: "2026-07-15T09:00:00.000Z",
		});
		const result = detectStaleRecords(
			[fresh, stale],
			"2026-07-15T10:00:00.000Z",
			60000,
		);
		expect(result).toHaveLength(1);
		expect(result[0]!.state.freshness).toBe(FRESHNESS_STATE.STALE);
	});
});

// ─── reconcileUnknown ────────────────────────────────────────────────────────

describe("reconcileUnknown", () => {
	it("should return empty when no records", () => {
		const result = reconcileUnknown([]);
		expect(result).toHaveLength(0);
	});

	it("should mark non-authoritative records as UNKNOWN lifecycle", () => {
		const record = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING }),
		});
		const result = reconcileUnknown([record]);
		expect(result).toHaveLength(1);
		expect(result[0]!.state.lifecycle).toBe(LIFECYCLE_STATE.UNKNOWN);
	});

	it("should preserve authoritative records as-is", () => {
		const record = makeRecord({
			authority: AUTHORITY_LEVEL.AUTHORITATIVE,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.COMPLETED }),
		});
		const result = reconcileUnknown([record]);
		expect(result).toHaveLength(1);
		expect(result[0]!.state.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should handle mixed authoritative and non-authoritative records", () => {
		const observed = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING }),
		});
		const authoritative = makeRecord({
			authority: AUTHORITY_LEVEL.AUTHORITATIVE,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.COMPLETED }),
		});
		const result = reconcileUnknown([observed, authoritative]);
		expect(result).toHaveLength(2);
		const observedAfter = result.find(
			(r) => r.authority === AUTHORITY_LEVEL.OBSERVED,
		);
		const authAfter = result.find(
			(r) => r.authority === AUTHORITY_LEVEL.AUTHORITATIVE,
		);
		expect(observedAfter!.state.lifecycle).toBe(LIFECYCLE_STATE.UNKNOWN);
		expect(authAfter!.state.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should not mark UNKNOWN as COMPLETED", () => {
		const record = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.UNKNOWN }),
		});
		const result = reconcileUnknown([record]);
		expect(result[0]!.state.lifecycle).toBe(LIFECYCLE_STATE.UNKNOWN);
	});
});

// ─── resolveCurrentState ─────────────────────────────────────────────────────

describe("resolveCurrentState", () => {
	it("should return default UNKNOWN state for empty records", () => {
		const result = resolveCurrentState([]);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.QUEUED);
		expect(result.attention).toBe(ATTENTION_STATE.NONE);
		expect(result.risk).toBe(PROJECTED_RISK_TIER.R0);
	});

	it("should return state from most recent authoritative record", () => {
		const record = makeRecord({
			authority: AUTHORITY_LEVEL.AUTHORITATIVE,
			sequence: 5,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.COMPLETED }),
		});
		const result = resolveCurrentState([record]);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});

	it("should prefer higher authority over higher sequence", () => {
		const observed = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			sequence: 100,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.RUNNING }),
		});
		const authoritative = makeRecord({
			authority: AUTHORITY_LEVEL.AUTHORITATIVE,
			sequence: 1,
			state: createOperationalState({ lifecycle: LIFECYCLE_STATE.COMPLETED }),
		});
		const result = resolveCurrentState([observed, authoritative]);
		expect(result.lifecycle).toBe(LIFECYCLE_STATE.COMPLETED);
	});
});
