import { beforeEach, describe, expect, it } from "vitest";
import type { Conflict } from "../result-merger";
import { Supervisor } from "../supervisor";

describe("Supervisor", () => {
	let supervisor: Supervisor;

	beforeEach(() => {
		supervisor = new Supervisor();
	});

	describe("resolveConflicts", () => {
		const conflicts: Conflict[] = [
			{
				between: ["compliance", "finance"],
				field: "igv_amount",
				values: [180, 200],
				resolvedBy: "",
			},
			{
				between: ["audit", "operations"],
				field: "total",
				values: [5000, 5100],
				resolvedBy: "",
			},
		];

		it("should resolve with highest-confidence strategy", () => {
			const resolved = supervisor.resolveConflicts(
				conflicts,
				"highest-confidence",
			);
			expect(resolved).toHaveLength(2);
			expect(resolved[0].resolvedBy).toBe("");
		});

		it("should resolve with latest strategy", () => {
			const resolved = supervisor.resolveConflicts(conflicts, "latest");
			for (const c of resolved) {
				expect(c.resolvedBy).toBe("latest-timestamp");
			}
		});

		it("should resolve with default strategy for unknown strategy", () => {
			const resolved = supervisor.resolveConflicts(
				conflicts,
				"majority" as never,
			);
			for (const c of resolved) {
				expect(c.resolvedBy).toBe("default-strategy");
			}
		});

		it("should handle empty conflicts array", () => {
			const resolved = supervisor.resolveConflicts([]);
			expect(resolved).toEqual([]);
		});
	});

	describe("canProceed", () => {
		it("should allow proceeding when no failures", () => {
			const result = supervisor.canProceed([
				{ domainId: "compliance", status: "completed" },
				{ domainId: "finance", status: "completed" },
			]);
			expect(result.proceed).toBe(true);
		});

		it("should allow proceeding when failures are within threshold", () => {
			const result = supervisor.canProceed([
				{ domainId: "compliance", status: "completed" },
				{ domainId: "finance", status: "error" },
				{ domainId: "operations", status: "completed" },
			]);
			expect(result.proceed).toBe(true);
		});

		it("should block proceeding when failures exceed half", () => {
			const result = supervisor.canProceed([
				{ domainId: "compliance", status: "completed" },
				{ domainId: "finance", status: "error" },
				{ domainId: "operations", status: "timeout" },
			]);
			expect(result.proceed).toBe(false);
			expect(result.reason).toContain("Too many failures");
		});

		it("should handle empty results", () => {
			const result = supervisor.canProceed([]);
			expect(result.proceed).toBe(true);
		});
	});

	describe("timing", () => {
		it("should record timing for a domain", () => {
			const start = new Date(Date.now() - 1000);
			const end = new Date();
			supervisor.recordTiming("compliance", start, end);

			const timings = supervisor.getTimings();
			expect(timings).toHaveLength(1);
			expect(timings[0].domain).toBe("compliance");
			expect(timings[0].durationMs).toBeGreaterThanOrEqual(900);
		});

		it("should provide performance summary", () => {
			supervisor.recordTiming("fast", new Date(Date.now() - 50), new Date());
			supervisor.recordTiming("slow", new Date(Date.now() - 500), new Date());

			const summary = supervisor.getPerformanceSummary();
			expect(summary.totalPhases).toBe(2);
			expect(summary.totalDurationMs).toBeGreaterThan(0);
			expect(summary.slowest?.domain).toBe("slow");
			expect(summary.fastest?.domain).toBe("fast");
		});

		it("should handle empty timings in summary", () => {
			const summary = supervisor.getPerformanceSummary();
			expect(summary.totalPhases).toBe(0);
			expect(summary.totalDurationMs).toBe(0);
			expect(summary.slowest).toBeUndefined();
			expect(summary.fastest).toBeUndefined();
		});
	});
});
