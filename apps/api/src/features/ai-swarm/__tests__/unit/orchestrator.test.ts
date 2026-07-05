/**
 * Orchestrator Service Tests
 *
 * @module ai-swarm/__tests__
 */

import { describe, expect, it } from "vitest";
import { OrchestratorService } from "../../orchestrator/orchestrator.service";

describe("OrchestratorService", () => {
	const orchestrator = new OrchestratorService();

	describe("analyzeTask", () => {
		it("should recommend sequential for small tasks (<5 files)", async () => {
			const analysis = await orchestrator.analyzeTask({
				fileCount: 3,
				totalSizeBytes: 1000,
				taskType: "INVOICE",
				priority: "medium",
			});

			expect(analysis.shouldParallelize).toBe(false);
			expect(analysis.batchSize).toBe(1);
			expect(analysis.estimatedCost).toBeGreaterThan(0);
			expect(analysis.estimatedTime).toBeGreaterThan(0);
			expect(analysis.agentsRequired).toContain("sunat");
		});

		it("should recommend parallel batch of 5 for medium tasks (5-20 files)", async () => {
			const analysis = await orchestrator.analyzeTask({
				fileCount: 10,
				totalSizeBytes: 5000,
				taskType: "INVOICE",
				priority: "medium",
			});

			expect(analysis.shouldParallelize).toBe(true);
			expect(analysis.batchSize).toBe(5);
			expect(analysis.estimatedCost).toBeGreaterThan(0);
			expect(analysis.estimatedTime).toBeLessThan(10 * 30); // Should be faster than sequential
		});

		it("should recommend parallel batch of 10 for large tasks (>20 files)", async () => {
			const analysis = await orchestrator.analyzeTask({
				fileCount: 50,
				totalSizeBytes: 25000,
				taskType: "INVOICE",
				priority: "high",
			});

			expect(analysis.shouldParallelize).toBe(true);
			expect(analysis.batchSize).toBe(10);
			expect(analysis.estimatedCost).toBeGreaterThan(0);
			expect(analysis.estimatedTime).toBeLessThan(50 * 30); // Should be faster than sequential
		});

		it("should select correct agents for INVOICE task", async () => {
			const analysis = await orchestrator.analyzeTask({
				fileCount: 5,
				totalSizeBytes: 2000,
				taskType: "INVOICE",
				priority: "medium",
			});

			expect(analysis.agentsRequired).toContain("ocr");
			expect(analysis.agentsRequired).toContain("sunat");
			expect(analysis.agentsRequired).toContain("pcge");
			expect(analysis.agentsRequired).toContain("evidence");
		});

		it("should select correct agents for RECONCILIATION task", async () => {
			const analysis = await orchestrator.analyzeTask({
				fileCount: 5,
				totalSizeBytes: 2000,
				taskType: "RECONCILIATION",
				priority: "medium",
			});

			expect(analysis.agentsRequired).toContain("reconciliation");
			expect(analysis.agentsRequired).toContain("evidence");
		});
	});

	describe("getBudgetUsage", () => {
		it("should return budget usage info", async () => {
			const budget = await orchestrator.getBudgetUsage();

			expect(budget).toHaveProperty("daily");
			expect(budget).toHaveProperty("monthly");
			expect(budget.daily.spent).toBeGreaterThanOrEqual(0);
			expect(budget.daily.remaining).toBeGreaterThanOrEqual(0);
			expect(budget.monthly.spent).toBeGreaterThanOrEqual(0);
			expect(budget.monthly.remaining).toBeGreaterThanOrEqual(0);
		});
	});
});
