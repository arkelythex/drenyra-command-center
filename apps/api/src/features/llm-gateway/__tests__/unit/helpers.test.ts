import { describe, it, expect, vi, beforeEach } from "vitest";
import {
	getProviderConfig,
	validateProviderKey,
	calculateTokenCost,
} from "../helpers";

describe("LLM Gateway Helpers", () => {
	describe("getProviderConfig", () => {
		it("should return config for openai provider", () => {
			const config = getProviderConfig("openai");

			expect(config).toBeDefined();
			expect(config.name).toBe("OpenAI");
			expect(config.supportsStreaming).toBe(true);
		});

		it("should return config for anthropic provider", () => {
			const config = getProviderConfig("anthropic");

			expect(config).toBeDefined();
			expect(config.name).toBe("Anthropic");
			expect(config.supportsStreaming).toBe(true);
		});

		it("should return config for google provider", () => {
			const config = getProviderConfig("google");

			expect(config).toBeDefined();
			expect(config.name).toBe("Google");
		});

		it("should throw for unknown provider", () => {
			expect(() => getProviderConfig("unknown")).toThrow("Unknown provider");
		});
	});

	describe("validateProviderKey", () => {
		it("should validate openai API key format", () => {
			const result = validateProviderKey(
				"openai",
				"sk-abc1234567890abcdefghijklmnop",
			);

			expect(result).toBe(true);
		});

		it("should validate anthropic API key format", () => {
			const result = validateProviderKey("anthropic", "sk-ant-api03-abc123");

			expect(result).toBe(true);
		});

		it("should reject empty API key", () => {
			const result = validateProviderKey("openai", "");

			expect(result).toBe(false);
		});

		it("should reject invalid format for openai", () => {
			const result = validateProviderKey("openai", "invalid-key");

			expect(result).toBe(false);
		});
	});

	describe("calculateTokenCost", () => {
		it("should calculate cost for openai gpt-4", () => {
			const cost = calculateTokenCost("openai", "gpt-4", 1000, 500);

			expect(cost).toBeGreaterThan(0);
			expect(cost.input).toBeGreaterThan(0);
			expect(cost.output).toBeGreaterThan(0);
		});

		it("should calculate cost for anthropic claude-3", () => {
			const cost = calculateTokenCost("anthropic", "claude-3-opus", 1000, 500);

			expect(cost).toBeGreaterThan(0);
		});

		it("should return zero for unknown model", () => {
			const cost = calculateTokenCost("openai", "unknown-model", 1000, 500);

			expect(cost.total).toBe(0);
		});
	});
});
