import { describe, expect, it } from "vitest";
import { getRAGConfig } from "../api/routes";

describe("AI RAG Service", () => {
	describe("getRAGConfig", () => {
		it("should return default RAG configuration", () => {
			const config = getRAGConfig();

			expect(config).toBeDefined();
			expect(config.maxTokens).toBeGreaterThan(0);
			expect(config.temperature).toBeGreaterThanOrEqual(0);
			expect(config.temperature).toBeLessThanOrEqual(2);
		});

		it("should include search options", () => {
			const config = getRAGConfig();

			expect(config.searchOptions).toBeDefined();
			expect(config.searchOptions.topK).toBeGreaterThan(0);
		});

		it("should include reranking settings", () => {
			const config = getRAGConfig();

			expect(config.rerank).toBeDefined();
			expect(config.rerank.enabled).toBe(true);
		});
	});
});
