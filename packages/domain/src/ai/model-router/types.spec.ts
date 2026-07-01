import { describe, expect, it } from "vitest";

describe("Model Router Types", () => {
	const capabilities = [
		"OCR",
		"CLASSIFICATION",
		"EXTRACTION",
		"ANALYSIS",
		"RECONCILIATION",
		"CODING",
		"AUDIT",
		"SUMMARIZATION",
		"CHAT",
	] as const;

	const providers = [
		"openai",
		"anthropic",
		"google",
		"deepseek",
		"openrouter",
	] as const;

	const strategies = [
		"capability_match",
		"cost_optimal",
		"latency_optimal",
		"quality_preferred",
		"fallback_chain",
	] as const;

	const statuses = ["ACTIVE", "DEGRADED", "OFFLINE", "DEPRECATED"] as const;

	it("all capability literals are valid", () => {
		for (const c of capabilities) {
			expect(c).toBeTypeOf("string");
			expect(c.length).toBeGreaterThan(0);
		}
	});

	it("all provider literals are valid", () => {
		for (const p of providers) {
			expect(p).toBeTypeOf("string");
			expect(p.length).toBeGreaterThan(0);
		}
	});

	it("all strategy literals are valid", () => {
		for (const s of strategies) {
			expect(s).toBeTypeOf("string");
			expect(s.length).toBeGreaterThan(0);
		}
	});

	it("all status literals are valid", () => {
		for (const s of statuses) {
			expect(s).toBeTypeOf("string");
			expect(s.length).toBeGreaterThan(0);
		}
	});

	it("capabilities are mutually distinct", () => {
		expect(new Set(capabilities).size).toBe(capabilities.length);
	});

	it("providers are mutually distinct", () => {
		expect(new Set(providers).size).toBe(providers.length);
	});

	it("strategies are mutually distinct", () => {
		expect(new Set(strategies).size).toBe(strategies.length);
	});

	it("statuses are mutually distinct", () => {
		expect(new Set(statuses).size).toBe(statuses.length);
	});

	it("ModelRegistration can be constructed with required fields", () => {
		const reg: import("./types").ModelRegistration = {
			id: "gpt-4o",
			providerName: "openai",
			modelName: "gpt-4o",
			displayName: "GPT-4o",
			capabilities: ["CHAT", "ANALYSIS"],
			status: "ACTIVE",
			priority: 1,
			costPer1KInput: 0.01,
			costPer1KOutput: 0.03,
			maxTokens: 128_000,
			avgLatencyMs: 1200,
			reliability: 0.98,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(reg.id).toBe("gpt-4o");
		expect(reg.providerName).toBe("openai");
		expect(reg.capabilities).toContain("CHAT");
		expect(reg.capabilities).toContain("ANALYSIS");
		expect(reg.status).toBe("ACTIVE");
	});

	it("CapabilityRoutingRule can be constructed with required fields", () => {
		const rule: import("./types").CapabilityRoutingRule = {
			id: "rule-chat-1",
			capability: "CHAT",
			strategy: "capability_match",
			allowedModelIds: ["gpt-4o", "claude-3.5"],
			excludedModelIds: [],
			maxRetries: 2,
			costCapCents: 50,
			latencyCapMs: 5000,
			minReliability: 0.9,
			requiresAudit: true,
			fallbackStrategy: "cost_optimal",
		};
		expect(rule.capability).toBe("CHAT");
		expect(rule.strategy).toBe("capability_match");
		expect(rule.fallbackStrategy).toBe("cost_optimal");
		expect(rule.requiresAudit).toBe(true);
	});

	it("RoutingResult can be constructed with required fields", () => {
		const result: import("./types").RoutingResult = {
			requestId: "req-001",
			capability: "EXTRACTION",
			selectedModelId: "gpt-4o",
			providerName: "openai",
			modelName: "gpt-4o",
			strategy: "capability_match",
			success: true,
			fallbackAttempted: false,
			attemptNumber: 1,
			responseContent: "extracted data",
			timestamp: new Date(),
		};
		expect(result.success).toBe(true);
		expect(result.selectedModelId).toBe("gpt-4o");
	});

	it("RoutingResult supports failure case", () => {
		const result: import("./types").RoutingResult = {
			requestId: "req-002",
			capability: "OCR",
			selectedModelId: "none",
			providerName: "openrouter",
			modelName: "none",
			strategy: "fallback_chain",
			success: false,
			fallbackAttempted: true,
			attemptNumber: 3,
			errorMessage: "All providers failed",
			timestamp: new Date(),
		};
		expect(result.success).toBe(false);
		expect(result.errorMessage).toBe("All providers failed");
	});

	it("ModelHealthProbe can be constructed", () => {
		const probe: import("./types").ModelHealthProbe = {
			modelId: "gpt-4o",
			status: "DEGRADED",
			latencyMs: 2500,
			errorRate: 0.05,
			lastSuccessAt: new Date(),
			consecutiveFailures: 2,
			checkedAt: new Date(),
		};
		expect(probe.status).toBe("DEGRADED");
		expect(probe.consecutiveFailures).toBe(2);
		expect(probe.errorRate).toBe(0.05);
	});

	it("ModelRegistration supports optional fields", () => {
		const reg: import("./types").ModelRegistration = {
			id: "custom-model",
			providerName: "deepseek",
			modelName: "deepseek-v4",
			displayName: "DeepSeek V4",
			capabilities: ["CODING"],
			status: "ACTIVE",
			priority: 10,
			costPer1KInput: 0.001,
			costPer1KOutput: 0.002,
			maxTokens: 64_000,
			metadata: { version: "4.0", family: "deepseek-v4" },
			tags: ["fast", "code"],
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(reg.metadata).toEqual({ version: "4.0", family: "deepseek-v4" });
		expect(reg.tags).toContain("fast");
	});

	it("all capabilities can be assigned to a ModelRegistration", () => {
		for (const cap of capabilities) {
			const reg: import("./types").ModelRegistration = {
				id: `model-${cap}`,
				providerName: "openai",
				modelName: `model-${cap}`,
				displayName: `Model ${cap}`,
				capabilities: [cap],
				status: "ACTIVE",
				priority: 1,
				costPer1KInput: 0.01,
				costPer1KOutput: 0.03,
				maxTokens: 8000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(reg.capabilities).toContain(cap);
		}
	});

	it("all provider names can be assigned to a ModelRegistration", () => {
		for (const provider of providers) {
			const reg: import("./types").ModelRegistration = {
				id: `model-${provider}`,
				providerName: provider,
				modelName: `model-${provider}`,
				displayName: `Model ${provider}`,
				capabilities: ["CHAT"],
				status: "ACTIVE",
				priority: 1,
				costPer1KInput: 0.01,
				costPer1KOutput: 0.03,
				maxTokens: 8000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(reg.providerName).toBe(provider);
		}
	});

	it("all statuses can be assigned to a ModelRegistration", () => {
		for (const status of statuses) {
			const reg: import("./types").ModelRegistration = {
				id: `model-${status}`,
				providerName: "openai",
				modelName: `model-${status}`,
				displayName: `Model ${status}`,
				capabilities: ["CHAT"],
				status,
				priority: 1,
				costPer1KInput: 0.01,
				costPer1KOutput: 0.03,
				maxTokens: 8000,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			expect(reg.status).toBe(status);
		}
	});

	it("all strategies can be assigned to a CapabilityRoutingRule", () => {
		for (const strategy of strategies) {
			const rule: import("./types").CapabilityRoutingRule = {
				id: `rule-${strategy}`,
				capability: "CHAT",
				strategy,
				allowedModelIds: [],
				excludedModelIds: [],
				maxRetries: 1,
				requiresAudit: false,
				fallbackStrategy:
					strategy === "fallback_chain" ? "capability_match" : "fallback_chain",
			};
			expect(rule.strategy).toBe(strategy);
		}
	});
});
