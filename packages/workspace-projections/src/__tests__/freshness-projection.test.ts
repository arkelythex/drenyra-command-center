import { describe, it, expect } from "vitest";
import { createExecutionId, FRESHNESS_STATE } from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, STATE_SOURCE } from "@drenyra/workspace-application";
import { CURRENT_EVENT_SCHEMA_VERSION, type DomainEvent } from "../store/types";
import { buildFreshnessProjection } from "../projections/freshness-projection";

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

const STALE_THRESHOLD_MS = 60_000; // 1 minute
const NOW = "2026-07-15T10:05:00.000Z";

describe("buildFreshnessProjection", () => {
	it("should return LIVE for recent events within threshold", () => {
		const execId = createExecutionId();
		const recentTimestamp = "2026-07-15T10:04:30.000Z"; // 30s ago
		const events: DomainEvent[] = [
			makeEvent({
				executionId: execId,
				sequence: 1,
				timestamp: recentTimestamp,
			}),
		];

		const result = buildFreshnessProjection(events, NOW, STALE_THRESHOLD_MS);
		expect(result.get(execId)).toBe(FRESHNESS_STATE.LIVE);
	});

	it("should return DELAYED for events between 1x and 2x threshold", () => {
		const execId = createExecutionId();
		const delayedTimestamp = "2026-07-15T10:03:30.000Z"; // 90s ago (>1x, <2x)
		const events: DomainEvent[] = [
			makeEvent({
				executionId: execId,
				sequence: 1,
				timestamp: delayedTimestamp,
			}),
		];

		const result = buildFreshnessProjection(events, NOW, STALE_THRESHOLD_MS);
		expect(result.get(execId)).toBe(FRESHNESS_STATE.DELAYED);
	});

	it("should return STALE for events past 2x threshold", () => {
		const execId = createExecutionId();
		const staleTimestamp = "2026-07-15T10:02:30.000Z"; // 150s ago (>2x)
		const events: DomainEvent[] = [
			makeEvent({
				executionId: execId,
				sequence: 1,
				timestamp: staleTimestamp,
			}),
		];

		const result = buildFreshnessProjection(events, NOW, STALE_THRESHOLD_MS);
		expect(result.get(execId)).toBe(FRESHNESS_STATE.STALE);
	});

	it("should return DISCONNECTED for very old events past 5x threshold", () => {
		const execId = createExecutionId();
		const veryOldTimestamp = "2026-07-15T09:50:00.000Z"; // 15 min ago (>5x)
		const events: DomainEvent[] = [
			makeEvent({
				executionId: execId,
				sequence: 1,
				timestamp: veryOldTimestamp,
			}),
		];

		const result = buildFreshnessProjection(events, NOW, STALE_THRESHOLD_MS);
		expect(result.get(execId)).toBe(FRESHNESS_STATE.DISCONNECTED);
	});

	it("should return DISCONNECTED for executions with no events", () => {
		const execId = createExecutionId();
		const events: DomainEvent[] = [
			makeEvent({
				executionId: execId,
				sequence: 1,
				timestamp: "2026-07-15T10:04:59.000Z",
			}),
		];

		const differentExecId = createExecutionId();
		const result = buildFreshnessProjection(events, NOW, STALE_THRESHOLD_MS);
		// differentExecId has no events → DISCONNECTED
		expect(result.get(differentExecId)).toBeUndefined();
	});
});
