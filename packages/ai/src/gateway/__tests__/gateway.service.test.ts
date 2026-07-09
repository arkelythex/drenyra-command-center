/**
 * LLMGatewayService — integration tests for rate limiting, failover, budget
 *
 * @group unit
 */

process.env.OPENAI_API_KEY = "sk-test";

import { describe, expect, it, vi } from "vitest";
import { LLMGatewayService } from "../gateway.service";
import { LLMGatewayError } from "../types";

vi.mock("../gateway.request-executor", () => ({
	RequestExecutor: {
		execute: vi.fn().mockResolvedValue({
			id: "mock-resp",
			model: "gpt-4",
			choices: [
				{
					index: 0,
					message: { role: "assistant", content: "ok" },
					finishReason: "stop",
				},
			],
			usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
			created: Date.now(),
		}),
	},
}));

// ── Helpers ──────────────────────────────────────────────────────────

const req = {
	model: "gpt-4" as const,
	messages: [{ role: "user" as const, content: "test" }],
	organizationId: 1,
	userId: "u1",
};

// ── Tests ────────────────────────────────────────────────────────────

describe("LLMGatewayService", () => {
	describe("routeToProvider", () => {
		it("should use request provider when specified", () => {
			const gateway = new LLMGatewayService();
			const provider = gateway.routeToProvider({
				model: "gpt-4",
				messages: [],
				provider: "anthropic" as any,
			});
			expect(provider).toBe("anthropic");
		});

		it("should use default provider when request has none", () => {
			const gateway = new LLMGatewayService({ defaultProvider: "openai" });
			const provider = gateway.routeToProvider({
				model: "gpt-4",
				messages: [],
			});
			expect(provider).toBe("openai");
		});
	});

	describe("rate limiting", () => {
		it("should allow request when rate limit is not exceeded", async () => {
			let checkedOrg = 0;
			let incrementedOrg = 0;
			const rateLimiter = {
				check: ((orgId: number) => {
					checkedOrg = orgId;
					return {
						allowed: true,
						currentRpm: 5,
						windowRpmResetsAt: new Date(Date.now() + 60000),
					};
				}) as any,
				increment: ((orgId: number) => {
					incrementedOrg = orgId;
				}) as any,
				getStatus: () => ({}),
				providerStates: new Map(),
				config: {},
				getRetryAfter: () => 0,
				updateConfig: () => {},
				reset: () => {},
			};

			const gateway = new LLMGatewayService({
				enableRateLimiting: true,
				enableFailover: false,
				enableBudgetEnforcement: false,
				rateLimiter: rateLimiter as any,
			});

			await gateway.chat(req);
			expect(checkedOrg).toBe(1);
			expect(incrementedOrg).toBe(1);
		});

		it("should throw RATE_LIMIT_EXCEEDED when rate limit is hit", async () => {
			const rateLimiter = {
				check: () => ({
					allowed: false,
					currentRpm: 100,
					windowRpmResetsAt: new Date(Date.now() + 60000),
				}),
				increment: () => {},
				getStatus: () => ({}),
				providerStates: new Map(),
				config: {},
				getRetryAfter: () => 0,
				updateConfig: () => {},
				reset: () => {},
			};

			const gateway = new LLMGatewayService({
				enableRateLimiting: true,
				enableFailover: false,
				enableBudgetEnforcement: false,
				rateLimiter: rateLimiter as any,
			});

			await expect(gateway.chat(req)).rejects.toThrow(LLMGatewayError);
		});

		it("should skip rate limiting when disabled", async () => {
			let called = false;
			const rateLimiter = {
				check: (() => {
					called = true;
					return {
						allowed: true,
						currentRpm: 0,
						windowRpmResetsAt: new Date(),
					};
				}) as any,
				increment: () => {},
				getStatus: () => ({}),
				providerStates: new Map(),
				config: {},
				getRetryAfter: () => 0,
				updateConfig: () => {},
				reset: () => {},
			};

			const gateway = new LLMGatewayService({
				enableRateLimiting: false,
				enableFailover: false,
				enableBudgetEnforcement: false,
				rateLimiter: rateLimiter as any,
			});

			await gateway.chat(req);
			expect(called).toBe(false);
		});
	});

	describe("failover", () => {
		it("should execute with failover when enabled", async () => {
			let executed = false;
			const failover = {
				executeWithFailover: (async (
					_p: string,
					fn: (p: string) => Promise<unknown>,
				) => {
					executed = true;
					const result = await fn(_p);
					return [result, _p];
				}) as any,
				getHealthStatus: () => [],
				setFailoverChain: () => {},
				circuits: new Map(),
				healthMetrics: new Map(),
				defaultChains: new Map(),
				initializeDefaultChains: () => {},
			};

			const gateway = new LLMGatewayService({
				enableFailover: true,
				enableRateLimiting: false,
				enableBudgetEnforcement: false,
				failoverService: failover as any,
			});

			await gateway.chat(req);
			expect(executed).toBe(true);
		});

		it("should execute directly when failover is disabled", async () => {
			let executed = false;
			const failover = {
				executeWithFailover: (async () => {
					executed = true;
					return [
						{
							id: "r",
							model: "m",
							choices: [],
							usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
							created: 0,
						},
						"openai",
					];
				}) as any,
				getHealthStatus: () => [],
				setFailoverChain: () => {},
				circuits: new Map(),
				healthMetrics: new Map(),
				defaultChains: new Map(),
				initializeDefaultChains: () => {},
			};

			const gateway = new LLMGatewayService({
				enableFailover: false,
				enableRateLimiting: false,
				enableBudgetEnforcement: false,
				failoverService: failover as any,
			});

			await gateway.chat(req);
			expect(executed).toBe(false);
		});
	});

	describe("budget enforcement", () => {
		it("should check budget when enforcement is enabled", async () => {
			let checked = 0;
			const budget = {
				require: (async (orgId: number) => {
					checked = orgId;
				}) as any,
				limits: new Map(),
				store: {} as any,
				check: () => true,
				setLimits: () => {},
				getLimits: () => [],
			};

			const gateway = new LLMGatewayService({
				enableBudgetEnforcement: true,
				enableRateLimiting: false,
				enableFailover: false,
				budgetEnforcer: budget as any,
			});

			await gateway.chat(req);
			expect(checked).toBe(1);
		});

		it("should skip budget check when enforcement is disabled", async () => {
			let called = false;
			const budget = {
				require: (async () => {
					called = true;
				}) as any,
				limits: new Map(),
				store: {} as any,
				check: () => true,
				setLimits: () => {},
				getLimits: () => [],
			};

			const gateway = new LLMGatewayService({
				enableBudgetEnforcement: false,
				enableRateLimiting: false,
				enableFailover: false,
				budgetEnforcer: budget as any,
			});

			await gateway.chat(req);
			expect(called).toBe(false);
		});
	});
});
