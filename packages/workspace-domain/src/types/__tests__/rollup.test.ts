import { describe, it, expect } from "vitest";
import {
	createEmptyAttentionRollup,
	aggregateRollups,
	type AttentionRollup,
} from "../rollup";
import { ATTENTION_STATE, PROJECTED_RISK_TIER } from "../state";

describe("createEmptyAttentionRollup", () => {
	it("should create an empty rollup with zero counts", () => {
		const rollup = createEmptyAttentionRollup();

		expect(rollup.lifecycle).toEqual({
			total: 0,
			completed: 0,
			failed: 0,
			cancelled: 0,
			inProgress: 0,
			blocked: 0,
			unknown: 0,
		});
		expect(rollup.counts.critical).toBe(0);
		expect(rollup.counts.blocked).toBe(0);
		expect(rollup.counts.approvalRequired).toBe(0);
		expect(rollup.counts.evidenceRequired).toBe(0);
		expect(rollup.counts.failed).toBe(0);
		expect(rollup.counts.cancelled).toBe(0);
		expect(rollup.counts.unknown).toBe(0);
		expect(rollup.counts.working).toBe(0);
		expect(rollup.counts.completed).toBe(0);
		expect(rollup.highestRisk).toBe("R0");
		expect(rollup.nearestDeadline).toBeUndefined();
		expect(rollup.estimatedExposure).toBeUndefined();
		expect(rollup.affectedCompanies).toBe(0);
		expect(rollup.topReasons).toEqual([]);
	});

	it("should have explicit failed and cancelled fields at zero", () => {
		const rollup = createEmptyAttentionRollup();
		expect(rollup.counts.failed).toBe(0);
		expect(rollup.counts.cancelled).toBe(0);
		expect("failed" in rollup.counts).toBe(true);
		expect("cancelled" in rollup.counts).toBe(true);
	});
});

describe("aggregateRollups", () => {
	it("should merge counts from multiple rollups", () => {
		const r1 = createEmptyAttentionRollup();
		const r2 = createEmptyAttentionRollup();

		const rollupA: AttentionRollup = {
			...r1,
			counts: {
				...r1.counts,
				critical: 2,
				blocked: 1,
				working: 3,
			},
			affectedCompanies: 5,
		};

		const rollupB: AttentionRollup = {
			...r2,
			counts: {
				...r2.counts,
				approvalRequired: 3,
				blocked: 2,
				working: 1,
			},
			affectedCompanies: 3,
		};

		const aggregated = aggregateRollups([rollupA, rollupB]);

		expect(aggregated.counts.critical).toBe(2);
		expect(aggregated.counts.blocked).toBe(3); // 1 + 2
		expect(aggregated.counts.approvalRequired).toBe(3);
		expect(aggregated.counts.working).toBe(4); // 3 + 1
		expect(aggregated.affectedCompanies).toBe(8); // 5 + 3
	});

	it("should aggregate failed and cancelled counts", () => {
		const base = createEmptyAttentionRollup();
		const r1: AttentionRollup = {
			...base,
			counts: { ...base.counts, failed: 2, cancelled: 1 },
		};
		const r2: AttentionRollup = {
			...base,
			counts: { ...base.counts, failed: 3, cancelled: 0 },
		};

		const aggregated = aggregateRollups([r1, r2]);
		expect(aggregated.counts.failed).toBe(5);
		expect(aggregated.counts.cancelled).toBe(1);
	});

	it("should calculate highest risk correctly", () => {
		const base = createEmptyAttentionRollup();
		const r1: AttentionRollup = {
			...base,
			highestRisk: PROJECTED_RISK_TIER.R1,
		};
		const r2: AttentionRollup = {
			...base,
			highestRisk: PROJECTED_RISK_TIER.R3,
		};
		const r3: AttentionRollup = {
			...base,
			highestRisk: PROJECTED_RISK_TIER.R2,
		};

		const aggregated = aggregateRollups([r1, r2, r3]);
		expect(aggregated.highestRisk).toBe("R3");
	});

	it("should merge lifecycle summaries including failed/cancelled", () => {
		const base = createEmptyAttentionRollup();
		const r1: AttentionRollup = {
			...base,
			lifecycle: {
				total: 10,
				completed: 5,
				failed: 1,
				cancelled: 0,
				inProgress: 3,
				blocked: 2,
				unknown: 0,
			},
		};
		const r2: AttentionRollup = {
			...base,
			lifecycle: {
				total: 5,
				completed: 2,
				failed: 0,
				cancelled: 1,
				inProgress: 1,
				blocked: 0,
				unknown: 2,
			},
		};

		const aggregated = aggregateRollups([r1, r2]);
		expect(aggregated.lifecycle).toEqual({
			total: 15,
			completed: 7,
			failed: 1,
			cancelled: 1,
			inProgress: 4,
			blocked: 2,
			unknown: 2,
		});
	});

	it("should merge topReasons", () => {
		const base = createEmptyAttentionRollup();
		const r1: AttentionRollup = {
			...base,
			topReasons: [
				{
					severity: ATTENTION_STATE.CRITICAL,
					message: "Disk failure",
					affectedCount: 3,
				},
				{
					severity: ATTENTION_STATE.BLOCKED,
					message: "Rate limit",
					affectedCount: 5,
				},
			],
		};
		const r2: AttentionRollup = {
			...base,
			topReasons: [
				{
					severity: ATTENTION_STATE.APPROVAL_REQUIRED,
					message: "Pending review",
					affectedCount: 2,
				},
				{
					severity: ATTENTION_STATE.BLOCKED,
					message: "Rate limit",
					affectedCount: 1,
				},
			],
		};

		const aggregated = aggregateRollups([r1, r2]);
		expect(aggregated.topReasons).toHaveLength(3);
		const rateLimit = aggregated.topReasons.find(
			(r) => r.message === "Rate limit",
		);
		expect(rateLimit?.affectedCount).toBe(6);
	});

	it("should handle empty array", () => {
		const aggregated = aggregateRollups([]);
		const empty = createEmptyAttentionRollup();
		expect(aggregated).toEqual(empty);
	});

	it("should handle single rollup with failed/cancelled", () => {
		const base = createEmptyAttentionRollup();
		const rollup: AttentionRollup = {
			...base,
			lifecycle: {
				total: 3,
				completed: 1,
				failed: 1,
				cancelled: 0,
				inProgress: 1,
				blocked: 0,
				unknown: 0,
			},
			counts: { ...base.counts, critical: 1, working: 2, failed: 1 },
			affectedCompanies: 4,
		};

		const aggregated = aggregateRollups([rollup]);
		expect(aggregated.lifecycle.total).toBe(3);
		expect(aggregated.counts.critical).toBe(1);
		expect(aggregated.counts.failed).toBe(1);
		expect(aggregated.affectedCompanies).toBe(4);
	});
});
