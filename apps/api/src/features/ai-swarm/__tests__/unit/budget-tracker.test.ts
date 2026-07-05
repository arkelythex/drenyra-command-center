/**
 * Budget Tracker Tests
 *
 * @module ai-swarm/__tests__/unit
 */

import { beforeEach, describe, expect, it } from "vitest";
import { BudgetTracker } from "../../tools/budget-tracker";

describe("BudgetTracker", () => {
	let tracker: BudgetTracker;

	beforeEach(() => {
		tracker = new BudgetTracker();
	});

	describe("record", () => {
		it("should record usage", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 0.0005,
			});

			const usage = tracker.getUsage();

			expect(usage.daily.spent).toBe(0.0005);
			expect(usage.monthly.spent).toBe(0.0005);
			expect(usage.byAgent.sunat).toBeDefined();
			expect(usage.byAgent.sunat.calls).toBe(1);
		});

		it("should aggregate multiple records", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 0.0005,
			});

			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 600,
				costUsd: 0.0006,
			});

			tracker.record({
				agentType: "pcge",
				modelUsed: "gemini-thinking",
				tokensUsed: 800,
				costUsd: 0.001,
			});

			const usage = tracker.getUsage();

			expect(usage.daily.spent).toBeCloseTo(0.0021, 4);
			expect(usage.byAgent.sunat.calls).toBe(2);
			expect(usage.byAgent.sunat.totalCost).toBeCloseTo(0.0011, 4);
			expect(usage.byAgent.pcge.calls).toBe(1);
		});
	});

	describe("canAfford", () => {
		it("should allow operation within budget", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 1.0,
			});

			const result = tracker.canAfford(10.0);

			expect(result.allowed).toBe(true);
		});

		it("should reject operation exceeding daily budget", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 45.0,
			});

			const result = tracker.canAfford(10.0); // Would exceed $50 daily limit

			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Daily budget exceeded");
		});

		it("should reject operation exceeding monthly budget", () => {
			// Simulate high monthly spend (small amounts to not hit daily limit)
			for (let i = 0; i < 250; i++) {
				tracker.record({
					agentType: "ocr",
					modelUsed: "gpt-4-vision",
					tokensUsed: 1500,
					costUsd: 2.0, // $2 per record = $500 total
				});
			}

			const result = tracker.canAfford(10.0); // Would exceed $500 monthly limit

			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("budget exceeded");
		});
	});

	describe("getUsage", () => {
		it("should calculate percentages correctly", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 25.0, // 50% of daily budget
			});

			const usage = tracker.getUsage();

			expect(usage.daily.percentage).toBeCloseTo(50, 1);
			expect(usage.daily.remaining).toBeCloseTo(25, 1);
		});

		it("should calculate average cost per agent", () => {
			tracker.record({
				agentType: "ocr",
				modelUsed: "gpt-4-vision",
				tokensUsed: 1500,
				costUsd: 0.01,
			});

			tracker.record({
				agentType: "ocr",
				modelUsed: "gpt-4-vision",
				tokensUsed: 1500,
				costUsd: 0.02,
			});

			const usage = tracker.getUsage();

			expect(usage.byAgent.ocr.averageCost).toBeCloseTo(0.015, 3);
		});
	});

	describe("getTrend", () => {
		it("should generate daily trend", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 1.0,
			});

			const trend = tracker.getTrend(7);

			expect(trend).toHaveLength(1);
			expect(trend[0].spent).toBe(1.0);
			expect(trend[0].calls).toBe(1);
		});
	});

	describe("export/import", () => {
		it("should export and import records", () => {
			tracker.record({
				agentType: "sunat",
				modelUsed: "gemini-flash",
				tokensUsed: 500,
				costUsd: 0.0005,
			});

			const exported = tracker.export();

			const newTracker = new BudgetTracker();
			newTracker.import(exported);

			const usage = newTracker.getUsage();

			expect(usage.byAgent.sunat.calls).toBe(1);
		});
	});
});
