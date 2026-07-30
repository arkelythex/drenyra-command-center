import { describe, it, expect } from "vitest";
import { createExecutionId } from "@drenyra/workspace-domain";
import type { ExecutionDeadline } from "../rollups/types";
import { findNearestDeadline, propagateDeadline } from "../rollups/deadline";
import { createEmptyAttentionRollup } from "@drenyra/workspace-domain";
import type { AttentionRollup } from "@drenyra/workspace-domain";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDeadline(daysFromNow: number, label: string): ExecutionDeadline {
	const date = new Date();
	date.setDate(date.getDate() + daysFromNow);
	return {
		executionId: createExecutionId(),
		deadline: date.toISOString(),
		label,
	};
}

// ─── Tests: findNearestDeadline ──────────────────────────────────────────────

describe("findNearestDeadline", () => {
	it("should return null for an empty array", () => {
		expect(findNearestDeadline([])).toBeNull();
	});

	it("should return the single deadline when only one exists", () => {
		const deadline = makeDeadline(5, "Tax filing");
		const result = findNearestDeadline([deadline]);
		expect(result).not.toBeNull();
		expect(result!.deadline).toBe(deadline.deadline);
		expect(result!.label).toBe("Tax filing");
	});

	it("should return the earliest deadline from multiple", () => {
		const far = makeDeadline(30, "Quarterly review");
		const near = makeDeadline(2, "Urgent SIRE");
		const mid = makeDeadline(10, "Monthly close");

		const result = findNearestDeadline([far, near, mid]);
		expect(result).not.toBeNull();
		expect(result!.label).toBe("Urgent SIRE");
	});

	it("should handle deadlines with same date by returning first found", () => {
		const sameDate = new Date().toISOString();
		const a: ExecutionDeadline = {
			executionId: createExecutionId(),
			deadline: sameDate,
			label: "A",
		};
		const b: ExecutionDeadline = {
			executionId: createExecutionId(),
			deadline: sameDate,
			label: "B",
		};
		const result = findNearestDeadline([a, b]);
		expect(result).not.toBeNull();
		expect(result!.deadline).toBe(sameDate);
	});
});

// ─── Tests: propagateDeadline ────────────────────────────────────────────────

describe("propagateDeadline", () => {
	it("should return undefined for empty rollups array", () => {
		expect(propagateDeadline([])).toBeUndefined();
	});

	it("should return undefined when no rollup has a nearestDeadline", () => {
		const rollup = createEmptyAttentionRollup();
		expect(propagateDeadline([rollup])).toBeUndefined();
	});

	it("should return the only deadline when one rollup has it", () => {
		const deadline = makeDeadline(3, "Single");
		const rollup: AttentionRollup = {
			...createEmptyAttentionRollup(),
			nearestDeadline: deadline.deadline,
		};
		expect(propagateDeadline([rollup])).toBe(deadline.deadline);
	});

	it("should return the earliest deadline from multiple rollups", () => {
		const near = makeDeadline(1, "Near");
		const far = makeDeadline(20, "Far");

		const rollupA: AttentionRollup = {
			...createEmptyAttentionRollup(),
			nearestDeadline: far.deadline,
		};
		const rollupB: AttentionRollup = {
			...createEmptyAttentionRollup(),
			nearestDeadline: near.deadline,
		};

		expect(propagateDeadline([rollupA, rollupB])).toBe(near.deadline);
	});

	it("should skip rollups with undefined nearestDeadline and use those with one", () => {
		const deadline = makeDeadline(7, "Has deadline");
		const withDeadline: AttentionRollup = {
			...createEmptyAttentionRollup(),
			nearestDeadline: deadline.deadline,
		};
		const withoutDeadline = createEmptyAttentionRollup();

		expect(propagateDeadline([withoutDeadline, withDeadline])).toBe(
			deadline.deadline,
		);
	});
});
