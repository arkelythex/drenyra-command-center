import { describe, expect, it } from "vitest";
import type { AgentRuntimeBudget, TokenObservation } from "../../src/index";
import {
	buildTokenObservation,
	calculateCacheHitRate,
	calculateCostFromTokens,
	DEEPSEEK_V4_PRO_OPENCODE_PRICING,
	GLM_52_CLOUDFLARE_PRICING,
	validateBudget,
} from "../../src/index";

// ============================================================================
// Budget validation
// ============================================================================

describe("validateBudget", () => {
	const validBudget: AgentRuntimeBudget = {
		role: "orchestrator",
		contextLimitTokens: 128000,
		outputLimitTokens: 8192,
		warningThresholdTokens: 89000,
		compactionThresholdTokens: 102000,
		reserveTokens: 16000,
		costSoftWarningUsd: 1.6,
		costHardPauseUsd: 2.0,
		modelPricing: GLM_52_CLOUDFLARE_PRICING,
		sessionAffinityId: "session-agentic-test-001",
		responseCacheEnabled: false,
	};

	it("accepts a valid budget", () => {
		expect(() => validateBudget(validBudget)).not.toThrow();
	});

	it("rejects contextLimitTokens > 128000", () => {
		expect(() =>
			validateBudget({ ...validBudget, contextLimitTokens: 200000 }),
		).toThrow("contextLimitTokens exceeds maximum");
	});

	it("rejects reserveTokens < 16000", () => {
		expect(() =>
			validateBudget({ ...validBudget, reserveTokens: 8000 }),
		).toThrow("reserveTokens must be at least 16000");
	});

	it("rejects warningThreshold >= compactionThreshold", () => {
		expect(() =>
			validateBudget({
				...validBudget,
				warningThresholdTokens: 110000,
				compactionThresholdTokens: 102000,
			}),
		).toThrow("warningThresholdTokens must be less than");
	});
});

// ============================================================================
// Cache hit rate
// ============================================================================

describe("calculateCacheHitRate", () => {
	it("returns 0.44 for 44% hit rate (T0 baseline)", () => {
		const rate = calculateCacheHitRate(588032, 749828);
		expect(rate).toBeCloseTo(0.44, 1);
	});

	it("returns 0 when no cache read", () => {
		expect(calculateCacheHitRate(0, 1000)).toBe(0);
	});

	it("returns 1 when all from cache", () => {
		expect(calculateCacheHitRate(1000, 0)).toBe(1);
	});

	it("returns UNOBSERVABLE if cacheRead is UNOBSERVABLE", () => {
		expect(calculateCacheHitRate("UNOBSERVABLE", 1000)).toBe("UNOBSERVABLE");
	});

	it("returns UNOBSERVABLE if uncachedInput is UNOBSERVABLE", () => {
		expect(calculateCacheHitRate(1000, "UNOBSERVABLE")).toBe("UNOBSERVABLE");
	});
});

// ============================================================================
// Cost calculation
// ============================================================================

describe("calculateCostFromTokens", () => {
	const baseTokens: TokenObservation = {
		cacheReadTokens: 400000,
		uncachedInputTokens: 89255,
		outputTokens: 1398,
		cacheHitRate: 0.818,
		metricSource: "sqlite",
		observabilityStatus: "OBSERVED",
	};

	it("calculates GLM 5.2 cost correctly (Cloudflare pricing)", () => {
		const cost = calculateCostFromTokens(baseTokens, GLM_52_CLOUDFLARE_PRICING);
		// normal: 89255 * 1.40 / 1M = 0.1249
		// cached: 400000 * 0.26 / 1M = 0.1040
		// output: 1398 * 4.40 / 1M = 0.0062
		// total: ~0.2351
		expect(cost.normalInputUsd).toBeCloseTo(0.1249, 3);
		expect(cost.cachedInputUsd).toBeCloseTo(0.104, 3);
		expect(cost.outputUsd).toBeCloseTo(0.0062, 3);
		expect(cost.totalUsd).toBeCloseTo(0.2351, 3);
	});

	it("handles UNOBSERVABLE cache read", () => {
		const tokens: TokenObservation = {
			...baseTokens,
			cacheReadTokens: "UNOBSERVABLE",
			cacheHitRate: "UNOBSERVABLE",
		};
		const cost = calculateCostFromTokens(tokens, GLM_52_CLOUDFLARE_PRICING);
		expect(cost.normalInputUsd).toBeCloseTo(0.1249, 3);
		expect(cost.cachedInputUsd).toBe("NOT_APPLICABLE");
	});
});

// ============================================================================
// Token observation builder
// ============================================================================

describe("buildTokenObservation", () => {
	it("builds observation from SQLite row with 44% hit rate", () => {
		const obs = buildTokenObservation(
			{
				id: "ses_test",
				cost: 0.3355,
				tokens_input: 749828,
				tokens_output: 2428,
				tokens_cache_read: 588032,
				tokens_cache_write: 0,
				time_created: Date.now(),
				model: '{"id":"deepseek-v4-pro"}',
				title: "T0 baseline",
			},
			"sqlite",
		);
		expect(obs.cacheReadTokens).toBe(588032);
		expect(obs.uncachedInputTokens).toBe(161796);
		expect(obs.outputTokens).toBe(2428);
		expect(obs.cacheHitRate).toBeCloseTo(0.78, 1);
		expect(obs.metricSource).toBe("sqlite");
		expect(obs.observabilityStatus).toBe("OBSERVED");
	});

	it("handles zero-input row gracefully", () => {
		const obs = buildTokenObservation(
			{
				id: "ses_empty",
				cost: 0,
				tokens_input: 0,
				tokens_output: 0,
				tokens_cache_read: 0,
				tokens_cache_write: 0,
				time_created: Date.now(),
				model: "{}",
				title: "empty",
			},
			"sqlite",
		);
		expect(obs.cacheHitRate).toBe("UNOBSERVABLE");
	});
});

// ============================================================================
// Pricing constants
// ============================================================================

describe("ModelPricing constants", () => {
	it("GLM 5.2 has Cloudflare pricing from published source", () => {
		expect(GLM_52_CLOUDFLARE_PRICING.modelId).toBe("@cf/zai-org/glm-5.2");
		expect(GLM_52_CLOUDFLARE_PRICING.inputUsdPerMToken).toBe(1.4);
		expect(GLM_52_CLOUDFLARE_PRICING.cachedInputUsdPerMToken).toBe(0.26);
		expect(GLM_52_CLOUDFLARE_PRICING.outputUsdPerMToken).toBe(4.4);
		expect(GLM_52_CLOUDFLARE_PRICING.source).toContain("cloudflare.com");
	});

	it("DeepSeek V4 Pro has estimated pricing from T0 baseline", () => {
		expect(DEEPSEEK_V4_PRO_OPENCODE_PRICING.modelId).toBe(
			"deepseek/deepseek-v4-pro",
		);
		expect(DEEPSEEK_V4_PRO_OPENCODE_PRICING.provider).toBe("opencode-go");
		expect(DEEPSEEK_V4_PRO_OPENCODE_PRICING.source).toContain("T0 baseline");
	});
});
