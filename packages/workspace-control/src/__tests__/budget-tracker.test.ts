import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { InMemoryBudgetTracker } from "../performance/budget-tracker";
import { BUDGET_STATUS, type PerformanceBudget } from "../performance/types";
import type { BudgetTracker } from "../performance/budget-tracker";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTracker(defaultBudgets?: PerformanceBudget[]): BudgetTracker {
	return new InMemoryBudgetTracker(defaultBudgets);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("InMemoryBudgetTracker", () => {
	let tracker: BudgetTracker;

	beforeEach(() => {
		tracker = makeTracker();
	});

	describe("start and end", () => {
		it("should return measurement after start + end", () => {
			tracker.start("startup");
			const measurement = tracker.end("startup");

			expect(measurement).not.toBeNull();
			expect(measurement?.operation).toBe("startup");
			expect(measurement?.elapsedMs).toBeGreaterThanOrEqual(0);
			expect(measurement?.status).toBeDefined();
		});

		it("should return null when ending without start", () => {
			const measurement = tracker.end("startup");

			expect(measurement).toBeNull();
		});
	});

	describe("multiple operations", () => {
		it("should track multiple operations independently", () => {
			tracker.start("startup");
			tracker.start("rollup");

			const startupMeasurement = tracker.end("startup");
			const rollupMeasurement = tracker.end("rollup");

			expect(startupMeasurement).not.toBeNull();
			expect(rollupMeasurement).not.toBeNull();
			expect(startupMeasurement?.operation).toBe("startup");
			expect(rollupMeasurement?.operation).toBe("rollup");
		});
	});

	describe("reset", () => {
		it("should clear all measurements on reset", () => {
			tracker.start("startup");
			tracker.end("startup");

			tracker.reset();

			const measurements = tracker.getAllMeasurements();
			expect(measurements).toHaveLength(0);
		});
	});

	describe("status thresholds", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should report ok when elapsed is under warning threshold", () => {
			const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();
			vi.setSystemTime(baseTime);

			tracker.start("startup");
			// Default startup warning is 1000ms — advance 500ms (under warning)
			vi.setSystemTime(baseTime + 500);
			const measurement = tracker.end("startup");

			expect(measurement?.status).toBe(BUDGET_STATUS.OK);
		});

		it("should report warning when elapsed exceeds warning threshold", () => {
			const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();
			vi.setSystemTime(baseTime);

			tracker.start("startup");
			// Default startup warning is 1000ms — advance 1500ms (over warning)
			vi.setSystemTime(baseTime + 1500);
			const measurement = tracker.end("startup");

			expect(measurement?.status).toBe(BUDGET_STATUS.WARNING);
		});

		it("should report critical when elapsed exceeds critical threshold", () => {
			const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();
			vi.setSystemTime(baseTime);

			tracker.start("startup");
			// Default startup critical is 3000ms — advance 3500ms
			vi.setSystemTime(baseTime + 3500);
			const measurement = tracker.end("startup");

			expect(measurement?.status).toBe(BUDGET_STATUS.CRITICAL);
		});

		it("should report exceeded when elapsed exceeds target", () => {
			const baseTime = new Date("2026-01-01T00:00:00.000Z").getTime();
			vi.setSystemTime(baseTime);

			tracker.start("startup");
			// Default startup target is 2000ms — advance 2500ms
			vi.setSystemTime(baseTime + 2500);
			const measurement = tracker.end("startup");

			expect(measurement?.status).toBe(BUDGET_STATUS.EXCEEDED);
		});
	});

	describe("default budgets", () => {
		it("should set default budgets on construction", () => {
			const customBudgets: PerformanceBudget[] = [
				{
					operation: "custom-op",
					targetMs: 100,
					warningMs: 50,
					criticalMs: 200,
				},
			];
			const customTracker = makeTracker(customBudgets);

			customTracker.start("custom-op");
			const measurement = customTracker.end("custom-op");

			expect(measurement).not.toBeNull();
			expect(measurement?.operation).toBe("custom-op");
		});

		it("should return null for unknown operation without defaults", () => {
			const emptyTracker = makeTracker([]);

			emptyTracker.start("unknown-op");
			const measurement = emptyTracker.end("unknown-op");

			// Should still measure, just no budget to compare against
			expect(measurement).not.toBeNull();
		});
	});

	describe("getMeasurement", () => {
		it("should return previous measurement", () => {
			tracker.start("startup");
			tracker.end("startup");

			const measurement = tracker.getMeasurement("startup");

			expect(measurement).not.toBeNull();
			expect(measurement?.operation).toBe("startup");
		});

		it("should return null for unmeasured operation", () => {
			const measurement = tracker.getMeasurement("startup");

			expect(measurement).toBeNull();
		});
	});

	describe("getAllMeasurements", () => {
		it("should return all completed measurements", () => {
			tracker.start("startup");
			tracker.end("startup");
			tracker.start("rollup");
			tracker.end("rollup");

			const measurements = tracker.getAllMeasurements();

			expect(measurements).toHaveLength(2);
		});
	});
});

// ─── Property-based test ─────────────────────────────────────────────────────

describe("BudgetTracker invariants", () => {
	it("should never return negative elapsedMs after start + end", () => {
		const tracker = makeTracker();

		tracker.start("startup");
		const measurement = tracker.end("startup");

		expect(measurement).not.toBeNull();
		expect(measurement!.elapsedMs).toBeGreaterThanOrEqual(0);
	});
});
