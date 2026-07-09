/**
 * LLMGatewayService — unit tests
 *
 * @group unit
 */

import { describe, expect, it } from "vitest";
import { LLMGatewayService } from "../gateway.service";

// ── Tests ────────────────────────────────────────────────────────────

describe("LLMGatewayService", () => {
	const gateway = new LLMGatewayService();

	describe("constructor", () => {
		it("should initialize with default config when no config is provided", () => {
			const g = new LLMGatewayService();
			expect(g).toBeInstanceOf(LLMGatewayService);
		});

		it("should initialize with custom config", () => {
			const g = new LLMGatewayService({
				defaultProvider: "openai",
				enableFailover: false,
				enableRateLimiting: false,
				enableBudgetEnforcement: false,
				timeout: 15000,
			});
			expect(g).toBeInstanceOf(LLMGatewayService);
		});
	});

	describe("getHealthStatus", () => {
		it("should return provider health statuses as an array", () => {
			const status = gateway.getHealthStatus();
			expect(Array.isArray(status)).toBe(true);
			if (status.length > 0) {
				expect(status[0]).toHaveProperty("avgLatencyMs");
			}
		});
	});

	describe("getRateLimitStatus", () => {
		it("should return rate limit status for a provider", () => {
			const status = gateway.getRateLimitStatus(1, "openai");
			expect(status).toBeDefined();
		});
	});

	describe("getMetrics", () => {
		it("should return metrics without throwing", () => {
			const metrics = gateway.getMetrics();
			expect(metrics).toBeDefined();
		});
	});

	describe("clearMetrics", () => {
		it("should clear metrics without throwing", () => {
			expect(() => gateway.clearMetrics()).not.toThrow();
		});
	});
});
