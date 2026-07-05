/**
 * SUNAT Knowledge API Routes
 *
 * HTTP endpoints for the RAG pipeline Phase 3.
 * Provides search, context building, and health check endpoints.
 *
 * @module features/ai-rag/knowledge-base/api/routes
 */

import { sunatKnowledgeService } from "@drenyra/infrastructure/services/sunat-knowledge";
import type { KnowledgeCategory } from "@drenyra/infrastructure/services/sunat-knowledge/sunat-knowledge.types";
import { Elysia, t } from "elysia";

/**
 * Default search options matching RAGSearchOptions interface
 */
const DEFAULT_SEARCH_OPTIONS = {
	topK: 20,
	finalK: 5,
	minScore: 0.5,
	hybridSearch: true,
	denseWeight: 0.7,
	rerank: true,
	includeContext: true,
	contextWindow: 1,
} as const;

/**
 * Request validation schemas
 */
const searchSchema = t.Object({
	query: t.String({ minLength: 3, maxLength: 500 }),
	categories: t.Optional(
		t.Array(
			t.Enum({
				igv: "igv",
				detraccion: "detraccion",
				sire: "sire",
				ruc: "ruc",
				bancarizacion: "bancarizacion",
				pcge: "pcge",
				uit: "uit",
				retencion: "retencion",
				percepcion: "percepcion",
			}),
		),
	),
	limit: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
	minScore: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
	hybridSearch: t.Optional(t.Boolean()),
	denseWeight: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
	rerank: t.Optional(t.Boolean()),
	finalK: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
});

const contextSchema = t.Object({
	query: t.String({ minLength: 3, maxLength: 500 }),
	categories: t.Optional(t.Array(t.String())),
	limit: t.Optional(t.Number({ minimum: 1, maximum: 10 })),
});

/**
 * API response helpers
 */
function successResponse<T>(data: T, meta?: Record<string, unknown>) {
	return {
		success: true,
		data,
		meta,
	};
}

function errorResponse(code: string, message: string, details?: unknown) {
	return {
		success: false,
		error: { code, message, details },
	};
}

/**
 * SUNAT Knowledge API routes
 *
 * Endpoints:
 * - POST /search - Hybrid search with optional reranking
 * - POST /context - Build context for LLM injection
 * - GET /stats - Knowledge base statistics
 * - GET /categories - Available categories
 */
export const knowledgeBaseRoutes = new Elysia({ name: "knowledge-base" })
	/**
	 * POST /search - Hybrid search endpoint
	 *
	 * Performs hybrid search combining BM25 (FTS) + Dense (vector) with optional reranking.
	 * Returns chunks with score breakdown.
	 */
	.post(
		"/search",
		async ({ body }) => {
			const startTime = Date.now();

			const {
				query,
				categories,
				limit = DEFAULT_SEARCH_OPTIONS.topK,
				minScore = DEFAULT_SEARCH_OPTIONS.minScore,
				hybridSearch = DEFAULT_SEARCH_OPTIONS.hybridSearch,
				denseWeight = DEFAULT_SEARCH_OPTIONS.denseWeight,
				rerank = DEFAULT_SEARCH_OPTIONS.rerank,
				finalK = DEFAULT_SEARCH_OPTIONS.finalK,
			} = body as {
				query: string;
				categories?: KnowledgeCategory[];
				limit?: number;
				minScore?: number;
				hybridSearch?: boolean;
				denseWeight?: number;
				rerank?: boolean;
				finalK?: number;
			};

			const options = {
				topK: limit,
				finalK,
				minScore,
				hybridSearch,
				denseWeight,
				rerank,
				includeContext: false,
				contextWindow: 0,
			};

			const results = await sunatKnowledgeService.hybridSearch(
				{ query, categories, limit },
				options,
			);

			const searchTimeMs = Date.now() - startTime;

			return successResponse(
				{ results },
				{
					query,
					totalFound: results.length,
					searchTimeMs,
					searchStrategy: hybridSearch ? "hybrid" : "bm25",
				},
			);
		},
		{
			body: searchSchema,
			detail: {
				tags: ["SUNAT Knowledge"],
				summary: "Search SUNAT knowledge base",
				description:
					"Perform hybrid search (BM25 + Dense) on the SUNAT knowledge base with optional cross-encoder reranking. Returns relevant legal chunks with score breakdown.",
				responses: {
					200: {
						description: "Search results with scores",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										success: { type: "boolean" },
										data: {
											type: "object",
											properties: {
												results: {
													type: "array",
													items: {
														type: "object",
														properties: {
															id: { type: "string" },
															title: { type: "string" },
															content: { type: "string" },
															category: { type: "string" },
															source: { type: "string" },
															scores: {
																type: "object",
																properties: {
																	bm25Score: { type: "number" },
																	denseScore: { type: "number" },
																	hybridScore: { type: "number" },
																	rerankScore: { type: "number" },
																	finalScore: { type: "number" },
																},
															},
														},
													},
												},
											},
										},
										meta: {
											type: "object",
											properties: {
												query: { type: "string" },
												totalFound: { type: "number" },
												searchTimeMs: { type: "number" },
												searchStrategy: {
													type: "string",
													enum: ["bm25", "dense", "hybrid"],
												},
											},
										},
									},
								},
							},
						},
					},
					400: {
						description: "Invalid request parameters",
					},
					500: {
						description: "Internal server error",
					},
				},
			},
		},
	)
	/**
	 * POST /context - Build context for LLM injection
	 *
	 * Returns formatted context string ready for LLM consumption.
	 */
	.post(
		"/context",
		async ({ body }) => {
			const {
				query,
				categories,
				limit = 5,
			} = body as {
				query: string;
				categories?: KnowledgeCategory[];
				limit?: number;
			};

			const context = await sunatKnowledgeService.buildContext({
				query,
				categories,
				limit,
			});

			return successResponse(context, {
				query,
				categories,
				limit,
			});
		},
		{
			body: contextSchema,
			detail: {
				tags: ["SUNAT Knowledge"],
				summary: "Build LLM context from SUNAT norms",
				description:
					"Retrieve relevant SUNAT norms and format them as context for LLM injection. Returns formatted string and raw chunks.",
				responses: {
					200: {
						description: "Context ready for LLM",
					},
					400: {
						description: "Invalid request parameters",
					},
					500: {
						description: "Internal server error",
					},
				},
			},
		},
	)
	/**
	 * GET /stats - Knowledge base statistics
	 *
	 * Returns count of chunks per category.
	 */
	.get(
		"/stats",
		async () => {
			const stats = await sunatKnowledgeService.getStats();

			return successResponse({
				byCategory: stats,
				totalChunks: Object.values(stats).reduce<number>(
					(sum, n) => sum + Number(n),
					0,
				),
			});
		},
		{
			detail: {
				tags: ["SUNAT Knowledge"],
				summary: "Get knowledge base statistics",
				description:
					"Returns statistics about the SUNAT knowledge base including chunk counts per category.",
				responses: {
					200: {
						description: "Statistics",
					},
				},
			},
		},
	)
	/**
	 * GET /categories - Available knowledge categories
	 */
	.get(
		"/categories",
		() => {
			return successResponse({
				categories: [
					{ id: "igv", name: "IGV / Impuesto General a las Ventas" },
					{ id: "detraccion", name: "Detracciones" },
					{ id: "sire", name: "SIRE" },
					{ id: "ruc", name: "RUC / Registro Único de Contribuyentes" },
					{ id: "bancarizacion", name: "Bancarización" },
					{ id: "pcge", name: "PCGE / Plan Contable General Empresarial" },
					{ id: "uit", name: "UIT" },
					{ id: "retencion", name: "Retenciones" },
					{ id: "percepcion", name: "Percepciones" },
				],
			});
		},
		{
			detail: {
				tags: ["SUNAT Knowledge"],
				summary: "List available knowledge categories",
				description: "Returns all available SUNAT knowledge categories.",
				responses: {
					200: {
						description: "Categories list",
					},
				},
			},
		},
	);
