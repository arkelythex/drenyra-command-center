/**
 * Ollama Gateway Routing Tests
 *
 * Tests for Ollama provider routing in the LLM Gateway Service.
 */

import { describe, expect, it } from "vitest";
import { LLMGatewayService } from "../../src/gateway/gateway.service";
import { LLM_PROVIDER } from "../../src/gateway/types";

describe("LLMGatewayService - Ollama Routing", () => {
	describe("routeToProvider", () => {
		it("should return ollama when provider is explicitly set", () => {
			const gateway = new LLMGatewayService();
			const provider = gateway.routeToProvider({
				model: "llama3",
				messages: [{ role: "user", content: "Hello" }],
				provider: "ollama",
			});

			expect(provider).toBe("ollama");
		});

		it("should return default provider when none specified", () => {
			const gateway = new LLMGatewayService();
			const provider = gateway.routeToProvider({
				model: "gpt-5",
				messages: [{ role: "user", content: "Hello" }],
			});

			// Default is openrouter per DEFAULT_CONFIG
			expect(provider).toBe("openrouter");
		});
	});

	describe("LLM_PROVIDER enum", () => {
		it("should include ollama in the provider enum", () => {
			expect(LLM_PROVIDER.OLLAMA).toBe("ollama");
		});

		it("should have all expected providers", () => {
			const providers = Object.values(LLM_PROVIDER);
			expect(providers).toContain("anthropic");
			expect(providers).toContain("openai");
			expect(providers).toContain("google");
			expect(providers).toContain("grok");
			expect(providers).toContain("openrouter");
			expect(providers).toContain("ollama");
		});
	});
});
