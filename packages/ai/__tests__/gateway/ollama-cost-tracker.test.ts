/**
 * Ollama Cost Tracker Tests
 *
 * Tests for duration-based cost tracking for Ollama provider.
 */

import { describe, expect, it } from "vitest";
import { CostTracker } from "../../src/gateway/cost-tracker";

describe("CostTracker - Ollama", () => {
	const tracker = new CostTracker();

	describe("calculate() for Ollama", () => {
		it("should return $0 cost for Ollama requests", () => {
			const result = tracker.calculate("llama3", "ollama", 1000, 500);

			expect(result.costUsd).toBe(0);
			expect(result.breakdown.promptCostUsd).toBe(0);
			expect(result.breakdown.completionCostUsd).toBe(0);
			expect(result.breakdown.pricing.promptPricePerM).toBe(0);
			expect(result.breakdown.pricing.completionPricePerM).toBe(0);
		});

		it("should return $0 regardless of token count", () => {
			const result = tracker.calculate("llama3", "ollama", 100000, 50000);

			expect(result.costUsd).toBe(0);
		});

		it("should still track token counts for Ollama", () => {
			const result = tracker.calculate("llama3", "ollama", 1000, 500);

			expect(result.breakdown.promptTokens).toBe(1000);
			expect(result.breakdown.completionTokens).toBe(500);
		});
	});

	describe("calculate() for other providers", () => {
		it("should calculate non-zero cost for Anthropic", () => {
			const result = tracker.calculate(
				"claude-sonnet-4-20250514",
				"anthropic",
				1000,
				500,
			);

			expect(result.costUsd).toBeGreaterThan(0);
		});

		it("should calculate non-zero cost for OpenAI", () => {
			const result = tracker.calculate("gpt-5", "openai", 1000, 500);

			expect(result.costUsd).toBeGreaterThan(0);
		});
	});

	describe("aggregateCosts() with Ollama", () => {
		it("should include Ollama in cost aggregation with $0", () => {
			const metrics = [
				{
					provider: "ollama" as const,
					model: "llama3",
					promptTokens: 1000,
					completionTokens: 500,
					totalTokens: 1500,
					costUsd: 0,
				},
				{
					provider: "anthropic" as const,
					model: "claude-sonnet-4-20250514",
					promptTokens: 1000,
					completionTokens: 500,
					totalTokens: 1500,
					costUsd: 0.00425,
				},
			];

			const aggregation = tracker.aggregateCosts(metrics, "daily");

			expect(aggregation.costByProvider.ollama).toBe(0);
			expect(aggregation.costByProvider.anthropic).toBeGreaterThan(0);
			expect(aggregation.requestCount).toBe(2);
		});
	});
});
