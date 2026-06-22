import { describe, it, expect, vi, beforeEach } from "vitest";
import { knowledgeBaseModule } from "../../module";

const mockHybridSearch = vi.fn();
const mockBuildContext = vi.fn();
const mockGetStats = vi.fn();

vi.mock(
	"@arkelythex/infrastructure/services/sunat-knowledge/sunat-knowledge.service",
	() => ({
		sunatKnowledgeService: {
			get hybridSearch() {
				return mockHybridSearch;
			},
			get buildContext() {
				return mockBuildContext;
			},
			get getStats() {
				return mockGetStats;
			},
		},
	}),
);

describe("knowledge-base module", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /categories", () => {
		it("returns all available knowledge categories", async () => {
			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/categories"),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.success).toBe(true);
			expect(payload.data.categories).toHaveLength(9);
			expect(payload.data.categories).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: "igv", name: expect.any(String) }),
					expect.objectContaining({
						id: "detraccion",
						name: expect.any(String),
					}),
					expect.objectContaining({ id: "sire", name: expect.any(String) }),
					expect.objectContaining({ id: "ruc", name: expect.any(String) }),
					expect.objectContaining({
						id: "bancarizacion",
						name: expect.any(String),
					}),
					expect.objectContaining({ id: "pcge", name: expect.any(String) }),
					expect.objectContaining({ id: "uit", name: expect.any(String) }),
					expect.objectContaining({
						id: "retencion",
						name: expect.any(String),
					}),
					expect.objectContaining({
						id: "percepcion",
						name: expect.any(String),
					}),
				]),
			);
		});
	});

	describe("GET /stats", () => {
		it("returns knowledge base statistics", async () => {
			mockGetStats.mockResolvedValue({
				igv: 45,
				detraccion: 30,
				sire: 25,
				ruc: 20,
				bancarizacion: 15,
				pcge: 50,
				uit: 10,
				retencion: 18,
				percepcion: 12,
			});

			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/stats"),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.success).toBe(true);
			expect(payload.data.byCategory.igv).toBe(45);
			expect(payload.data.totalChunks).toBe(225);
		});

		it("handles empty stats gracefully", async () => {
			mockGetStats.mockResolvedValue({});

			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/stats"),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.data.totalChunks).toBe(0);
		});
	});

	describe("POST /search", () => {
		it("returns search results with metadata", async () => {
			mockHybridSearch.mockResolvedValue([
				{
					id: "chunk-1",
					title: "IGV Rate",
					content: "El IGV es 18%",
					category: "igv",
					source: "sunat-norm",
					scores: {
						bm25Score: 0.8,
						denseScore: 0.9,
						hybridScore: 0.85,
						rerankScore: 0.92,
						finalScore: 0.88,
					},
				},
			]);

			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "Cuál es la tasa del IGV",
						limit: 5,
					}),
				}),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.success).toBe(true);
			expect(payload.data.results).toHaveLength(1);
			expect(payload.meta.totalFound).toBe(1);
			expect(payload.meta.searchStrategy).toBe("hybrid");
			expect(payload.meta.searchTimeMs).toBeGreaterThanOrEqual(0);
		});

		it("rejects search with query shorter than 3 characters", async () => {
			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "IG",
					}),
				}),
			);

			expect(response.status).toBe(422);
		});

		it("rejects search with query longer than 500 characters", async () => {
			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "a".repeat(501),
					}),
				}),
			);

			expect(response.status).toBe(422);
		});

		it("filters by categories when provided", async () => {
			mockHybridSearch.mockResolvedValue([
				{
					id: "chunk-igv",
					title: "IGV Calculation",
					content: "IGV = base * 0.18",
					category: "igv",
					source: "sunat-norm",
					scores: {
						bm25Score: 0.9,
						denseScore: 0.85,
						hybridScore: 0.88,
						rerankScore: 0.9,
						finalScore: 0.89,
					},
				},
			]);

			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "calculo del impuesto general",
						categories: ["igv"],
						limit: 5,
					}),
				}),
			);

			expect(response.status).toBe(200);
			expect(mockHybridSearch).toHaveBeenCalledWith(
				expect.objectContaining({
					categories: ["igv"],
				}),
				expect.any(Object),
			);
		});

		it("uses default search options when not provided", async () => {
			mockHybridSearch.mockResolvedValue([]);

			await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/search", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "detracciones",
					}),
				}),
			);

			expect(mockHybridSearch).toHaveBeenCalledWith(
				expect.objectContaining({
					query: "detracciones",
					categories: undefined,
					limit: 20,
				}),
				expect.objectContaining({
					topK: 20,
					finalK: 5,
					minScore: 0.5,
					hybridSearch: true,
					denseWeight: 0.7,
					rerank: true,
				}),
			);
		});
	});

	describe("POST /context", () => {
		it("returns formatted context for LLM injection", async () => {
			mockBuildContext.mockResolvedValue({
				formattedContext: "## IGV\nEl IGV es 18%...\n\n## Detracciones\n...",
				chunks: [
					{
						id: "chunk-1",
						title: "IGV Rate",
						content: "El IGV es 18%",
						category: "igv",
					},
				],
				totalChunks: 1,
			});

			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/context", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "Cómo calculo el IGV",
						limit: 3,
					}),
				}),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.success).toBe(true);
			expect(payload.data.formattedContext).toContain("IGV");
			expect(payload.data.chunks).toHaveLength(1);
		});

		it("rejects context request with short query", async () => {
			const response = await knowledgeBaseModule.handle(
				new Request("http://localhost/knowledge/context", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						query: "IG",
					}),
				}),
			);

			expect(response.status).toBe(422);
		});
	});
});
