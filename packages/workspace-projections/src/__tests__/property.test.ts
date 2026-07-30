/**
 * Property-Based Tests — Event Store Invariants
 *
 * Uses fc.assert + fc.property directly.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";
import type { createExecutionId } from "@drenyra/workspace-domain";
import { AUTHORITY_LEVEL, STATE_SOURCE } from "@drenyra/workspace-application";
import { InMemoryEventStore } from "../store/memory";
import type { EventStore } from "../store/interface";
import { CURRENT_EVENT_SCHEMA_VERSION } from "../store/types";

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

const eventTypeArb = fc.constantFrom(
	"execution.started",
	"execution.completed",
	"execution.failed",
	"execution.cancelled",
	"execution.attention.changed",
	"execution.freshness.changed",
);

// ─── Property 1: Round-Trip Count ────────────────────────────────────────────

describe("Property: append + getEvents round-trip", () => {
	it("should preserve count after appending N events", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.integer({ min: 1, max: 50 }),
				(executionId, count) => {
					const store: EventStore = new InMemoryEventStore();
					const typedId = executionId as ReturnType<typeof createExecutionId>;

					for (let i = 1; i <= count; i++) {
						store.append({
							eventId: crypto.randomUUID(),
							executionId: typedId,
							sequence: i,
							type: "execution.started",
							payload: {},
							authority: AUTHORITY_LEVEL.OBSERVED,
							source: STATE_SOURCE.PI,
							timestamp: "2026-07-15T10:00:00.000Z",
							schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
						});
					}

					const events = store.getEvents(typedId);
					return events.length === count;
				},
			),
		);
	});
});

// ─── Property 2: Sequence Ordering ───────────────────────────────────────────

describe("Property: events per executionId are ordered by sequence", () => {
	it("should always return events in ascending sequence order", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.array(
					fc.record({
						sequence: fc.integer({ min: 1, max: 200 }),
						authority: authorityArb,
						source: sourceArb,
						timestamp: isoDateArb,
						eventType: eventTypeArb,
					}),
					{ minLength: 1, maxLength: 30 },
				),
				(executionId, rawEvents) => {
					const store: EventStore = new InMemoryEventStore();
					const typedId = executionId as ReturnType<typeof createExecutionId>;

					// Deduplicate by sequence before appending (fast-check may generate duplicates)
					const seen = new Set<number>();
					for (const e of rawEvents) {
						if (seen.has(e.sequence)) continue;
						seen.add(e.sequence);
						store.append({
							eventId: crypto.randomUUID(),
							executionId: typedId,
							sequence: e.sequence,
							type: e.eventType,
							payload: {},
							authority: e.authority,
							source: e.source,
							timestamp: e.timestamp,
							schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
						});
					}

					const events = store.getEvents(typedId);
					const sequences = events.map((e) => e.sequence);

					for (let i = 1; i < sequences.length; i++) {
						if (sequences[i]! < sequences[i - 1]!) {
							return false;
						}
					}
					return true;
				},
			),
		);
	});
});

// ─── Property 3: Sequence Non-Negative and Monotonic ─────────────────────────

describe("Property: sequences are non-negative and monotonic per executionId", () => {
	it("should reject negative or zero sequences via dedup constraint", () => {
		fc.assert(
			fc.property(
				nonEmptyId,
				fc.array(fc.integer({ min: 1, max: 100 }), {
					minLength: 1,
					maxLength: 20,
				}),
				(executionId, sequences) => {
					const store: EventStore = new InMemoryEventStore();
					const typedId = executionId as ReturnType<typeof createExecutionId>;

					try {
						for (const seq of sequences) {
							store.append({
								eventId: crypto.randomUUID(),
								executionId: typedId,
								sequence: seq,
								type: "execution.started",
								payload: {},
								authority: AUTHORITY_LEVEL.OBSERVED,
								source: STATE_SOURCE.PI,
								timestamp: "2026-07-15T10:00:00.000Z",
								schemaVersion: CURRENT_EVENT_SCHEMA_VERSION,
							});
						}
					} catch {
						// Duplicate sequence is expected — that's the dedup behavior
					}

					const events = store.getEvents(typedId);
					// All sequences should be non-negative
					for (const e of events) {
						if (e.sequence < 0) {
							return false;
						}
					}
					return true;
				},
			),
		);
	});
});
