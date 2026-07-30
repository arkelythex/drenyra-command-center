import { describe, it, expect } from "vitest";
import {
	createExecutionId,
	createOperationalState,
} from "@drenyra/workspace-domain";
import { shouldApplyState } from "../authority/precedence";
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("shouldApplyState — Authority Precedence Matrix", () => {
	it("should apply when incoming has higher authority (reported > observed)", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			sequence: 1,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(true);
		expect(result.reason).toContain("higher authority");
	});

	it("should reject when incoming has higher authority but older effectiveAt", () => {
		const earlier = "2026-07-14T10:00:00.000Z";
		const later = "2026-07-15T10:00:00.000Z";
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			effectiveAt: later,
			sequence: 1,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			effectiveAt: earlier,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(false);
		expect(result.reason).toContain("older");
	});

	it("should apply when same authority and incoming has higher sequence", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 1,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(true);
		expect(result.reason).toContain("sequence");
	});

	it("should reject when same authority and incoming has lower sequence", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 5,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(false);
		expect(result.reason).toContain("sequence");
	});

	it("should reject when incoming has lower authority", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 1,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(false);
		expect(result.reason).toContain("lower");
	});

	it("should reject when incoming is duplicate (same authority, same sequence)", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 1,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.REPORTED,
			sequence: 1,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(false);
		expect(result.reason).toContain("duplicate");
	});

	it("authoritative should always beat observed", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			sequence: 1,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.AUTHORITATIVE,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(true);
	});

	it("should reject incoming with sequence <= existing sequence", () => {
		const existing = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			sequence: 3,
		});
		const incoming = makeRecord({
			authority: AUTHORITY_LEVEL.OBSERVED,
			sequence: 2,
		});

		const result = shouldApplyState(existing, incoming);

		expect(result.apply).toBe(false);
		expect(result.reason).toContain("duplicate");
	});
});
