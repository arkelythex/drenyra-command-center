/**
 * Property-Based Tests — State Authority Invariants
 *
 * Uses fc.assert + fc.property directly for cross-version compatibility.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";
import {
	createExecutionId,
	createOperationalState,
} from "@drenyra/workspace-domain";
import { shouldApplyState } from "../authority/precedence";
import { reduceExecutionState } from "../authority/reducer";
import {
	AUTHORITY_LEVEL,
	STATE_SOURCE,
	CURRENT_AUTHORITY_SCHEMA_VERSION,
	type AuthoritativeStateRecord,
	type StateEvent,
} from "../authority/types";

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const authorityArb = fc.constantFrom(
	AUTHORITY_LEVEL.OBSERVED,
	AUTHORITY_LEVEL.REPORTED,
	AUTHORITY_LEVEL.AUTHORITATIVE,
);

const sourceArb = fc.constantFrom(
	STATE_SOURCE.PI,
	STATE_SOURCE.WORKFLOW,
	STATE_SOURCE.APPROVAL_CONTROL_PLANE,
	STATE_SOURCE.CONNECTOR,
	STATE_SOURCE.RECONCILER,
	STATE_SOURCE.SYSTEM,
);

const isoDateArb = fc
	.integer({ min: 1700000000000, max: 1800000000000 })
	.map((ts) => new Date(ts).toISOString());

const nonEmptyId = fc.string({ minLength: 1 });

// ─── Property 1: Determinism ─────────────────────────────────────────────────

describe("Property: shouldApplyState determinism", () => {
	it("should be deterministic for the same pair", () => {
		fc.assert(
			fc.property(
				authorityArb,
				authorityArb,
				fc.integer({ min: 1, max: 1000 }),
				fc.integer({ min: 1, max: 1000 }),
				isoDateArb,
				isoDateArb,
				isoDateArb,
				isoDateArb,
				(auth1, auth2, seq1, seq2, eff1, eff2, obs1, obs2) => {
					const existing: AuthoritativeStateRecord = {
						executionId: createExecutionId(),
						state: createOperationalState(),
						authority: auth1,
						source: STATE_SOURCE.PI,
						sequence: seq1,
						observedAt: obs1,
						effectiveAt: eff1,
						schemaVersion: CURRENT_AUTHORITY_SCHEMA_VERSION,
					};
					const incoming: AuthoritativeStateRecord = {
						executionId: createExecutionId(),
						state: createOperationalState(),
						authority: auth2,
						source: STATE_SOURCE.PI,
						sequence: seq2,
						observedAt: obs2,
						effectiveAt: eff2,
						schemaVersion: CURRENT_AUTHORITY_SCHEMA_VERSION,
					};

					const r1 = shouldApplyState(existing, incoming);
					const r2 = shouldApplyState(existing, incoming);
					return r1.apply === r2.apply && r1.reason === r2.reason;
				},
			),
		);
	});
});

// ─── Property 2: Sequence Monotonicity ───────────────────────────────────────

describe("Property: sequence monotonicity", () => {
	it("records are always appended in increasing sequence per executionId", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.array(
					fc.record({
						sequence: fc.integer({ min: 1, max: 100 }),
						authority: authorityArb,
						source: sourceArb,
						effectiveAt: isoDateArb,
					}),
					{ minLength: 1, maxLength: 20 },
				),
				(executionId, events) => {
					const sortedEvents = [...events].sort(
						(a, b) => a.sequence - b.sequence,
					);
					const stateEvents: StateEvent[] = sortedEvents.map((e) => ({
						executionId: executionId as ReturnType<typeof createExecutionId>,
						newState: createOperationalState(),
						authority: e.authority,
						source: e.source,
						sequence: e.sequence,
						observedAt: e.effectiveAt,
						effectiveAt: e.effectiveAt,
					}));

					let records: readonly AuthoritativeStateRecord[] = [];
					for (const event of stateEvents) {
						const result = reduceExecutionState(records, event);
						records = result.records;
					}

					// Verify sequences for this executionId are monotonically increasing
					const execRecords = records.filter(
						(r) => r.executionId === executionId,
					);
					const sequences = execRecords.map((r) => r.sequence);
					for (let i = 1; i < sequences.length; i++) {
						if (sequences[i]! <= sequences[i - 1]!) {
							return false;
						}
					}
					return true;
				},
			),
		);
	});
});

// ─── Property 3: Authority Non-Regression ─────────────────────────────────────

describe("Property: authority non-regression", () => {
	it("once authoritative, observed never overwrites", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.integer({ min: 1, max: 100 }),
				(executionId, baseSequence) => {
					// Set up: authoritative record exists
					const authoritativeEvent: StateEvent = {
						executionId: executionId as ReturnType<typeof createExecutionId>,
						newState: createOperationalState(),
						authority: AUTHORITY_LEVEL.AUTHORITATIVE,
						source: STATE_SOURCE.WORKFLOW,
						sequence: baseSequence,
						observedAt: "2026-07-15T10:00:00.000Z",
						effectiveAt: "2026-07-15T10:00:00.000Z",
					};

					let result = reduceExecutionState([], authoritativeEvent);
					const recordsAfterAuth = result.records;

					// Try to overwrite with observed
					const observedEvent: StateEvent = {
						executionId: executionId as ReturnType<typeof createExecutionId>,
						newState: createOperationalState(),
						authority: AUTHORITY_LEVEL.OBSERVED,
						source: STATE_SOURCE.PI,
						sequence: baseSequence + 1,
						observedAt: "2026-07-15T10:00:01.000Z",
						effectiveAt: "2026-07-15T10:00:01.000Z",
					};

					result = reduceExecutionState(recordsAfterAuth, observedEvent);

					// Should still only have the authoritative record
					const execRecords = result.records.filter(
						(r) => r.executionId === executionId,
					);
					return (
						execRecords.length === 1 &&
						execRecords[0]!.authority === AUTHORITY_LEVEL.AUTHORITATIVE
					);
				},
			),
		);
	});
});
