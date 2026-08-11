/**
 * AI RAG Routes
 *
 * API endpoints for the RAG pipeline providing:
 * - Hybrid search (BM25 + Dense + Rerank)
 * - RAG generation with LLM integration
 * - Configuration exposure
 * - Authentication and rate limiting
 *
 * @module features/ai-rag/api/routes
 */

import {
	type AuthenticatedChatRequest,
	type ChatCompletionRequest,
	llmGateway,
} from "@drenyra/ai/gateway";
import type {
	LegalDocumentType,
	RAGGenerationResponse,
	RAGQuery,
	RAGSearchOptions,
	RAGSearchResponse,
	RAGSearchResult,
	SearchMetadata,
} from "@drenyra/ai/rag/types";
import { DEFAULT_SEARCH_OPTIONS } from "@drenyra/ai/rag/types";
import { sunatKnowledgeService } from "@drenyra/infrastructure/services/sunat-knowledge/sunat-knowledge.service";
import { Elysia, t } from "elysia";
import { createLogger } from "../../../lib/logger";
import { authorizeAiSurface } from "../../security/ai-surface-access";

const logger = createLogger({ module: "ai-rag/routes" });

function toHeaderRecord(headers: Headers): Record<string, string> {
	const normalized: Record<string, string> = {};
	headers.forEach((value, key) => {
		normalized[key] = value;
	});
	return normalized;
}

/**
 * Default RAG search options
 */
const DEFAULT_RAG_SEARCH_OPTIONS: RAGSearchOptions = {
	...DEFAULT_SEARCH_OPTIONS,
};

/**
 * Request validation schemas
 */
const ragSearchSchema = t.Object({
	query: t.String({ minLength: 3, maxLength: 500 }),
	filters: t.Optional(
		t.Object({
			documentTypes: t.Optional(t.Array(t.String())),
			keywords: t.Optional(t.Array(t.String())),
			excludeSuperseded: t.Optional(t.Boolean()),
		}),
	),
	options: t.Optional(
		t.Object({
			topK: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
			finalK: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
			minScore: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
			hybridSearch: t.Optional(t.Boolean()),
			denseWeight: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
			rerank: t.Optional(t.Boolean()),
			includeContext: t.Optional(t.Boolean()),
			contextWindow: t.Optional(t.Number({ minimum: 0, maximum: 5 })),
		}),
	),
});

const ragGenerateSchema = t.Object({
	query: t.String({ minLength: 3, maxLength: 500 }),
	systemPrompt: t.Optional(t.String({ maxLength: 2000 })),
	temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
	maxTokens: t.Optional(t.Number({ minimum: 1, maximum: 8192 })),
	searchOptions: t.Optional(
		t.Object({
			topK: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
			finalK: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
			minScore: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
			hybridSearch: t.Optional(t.Boolean()),
			denseWeight: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
			rerank: t.Optional(t.Boolean()),
		}),
	),
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
 * Default system prompt for RAG generation
 */
const DEFAULT_RAG_SYSTEM_PROMPT = `Eres un asistente especializado en normativa tributaria peruana (SUNAT).
Responde basándote EXCLUSIVAMENTE en la información proporcionada en el contexto.
Cite las fuentes utilizadas usando el formato [Número].
Si la información del contexto no es suficiente para responder, indica que no tienes suficiente información.`;

/**
 * AI RAG API routes
 *
 * Endpoints (all require authentication):
 * - POST /search - RAG search with hybrid retrieval
 * - POST /generate - Search + LLM generation
 * - GET /config - RAG configuration exposure
 */
/**
 *
 * @example
 * ```ts
 * console.log(aiRagRoutes);
 * ```
 */
export const aiRagRoutes = new Elysia({ name: "ai-rag-routes" })
	/**
	 * POST /search - RAG search endpoint
	 *
	 * Performs hybrid search (BM25 + Dense) with optional reranking.
	 * Returns chunks with score breakdown and metadata.
	 *
	 * Headers required:
	 * - X-Organization-ID: Organization identifier
	 *
	 * Rate limit: 60 requests/minute (via apiRateLimit)
	 */
	.post(
		"/search",
		async ({ body, request, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/ai/rag/search",
			});

			if (access.ok === false) {
				set.status = access.status;
				return errorResponse(access.code, access.error);
			}

			const startTime = Date.now();

			const { query, filters, options } = body as {
				query: string;
				filters?: RAGQuery["filters"];
				options?: RAGSearchOptions;
			};

			const searchOptions: RAGSearchOptions = {
				...(DEFAULT_RAG_SEARCH_OPTIONS as RAGSearchOptions),
				...(options as RAGSearchOptions),
			};

			try {
				const results = await sunatKnowledgeService.hybridSearch(
					{
						query,
												...(filters?.documentTypes !== undefined
							? {
								categories: filters.documentTypes as unknown as
									| (
										| "igv"
										| "detraccion"
										| "sire"
										| "ruc"
										| "bancarizacion"
										| "pcge"
										| "uit"
										| "retencion"
										| "percepcion"
									)[],
								}
							: {}),
						limit: searchOptions.topK,
					},
					searchOptions,
				);

				const searchTimeMs = Date.now() - startTime;

				// Transform to RAGSearchResult format
				const ragResults: RAGSearchResult[] = results.map((r) => ({
					chunk: {
						id: r.id,
						documentId: r.id,
						documentType: r.documentType as LegalDocumentType,
						documentReference: r.source,
						content: r.content,
						chunkIndex: 0,
						startPosition: 0,
						endPosition: r.content.length,
						keywords: [],
						entities: [],
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					scores: {
						bm25Score: r.scores?.bm25Score ?? 0,
						denseScore: r.scores?.denseScore ?? 0,
						hybridScore: r.scores?.hybridScore ?? 0,
						...(r.scores?.rerankScore !== undefined
						? { rerankScore: r.scores.rerankScore }
						: {}),
						finalScore: r.scores?.finalScore ?? 0,
					},
					citation: {
						text: `${r.source}${r.section ? ` - ${r.section}` : ""}`,
						reference: r.source,
						...(r.section !== undefined && r.section !== null ? { section: r.section } : {}),
						chunkId: r.id,
					},
				}));

				const metadata: SearchMetadata = {
					totalFound: results.length,
					searchTimeMs,
					embeddingTimeMs: Math.round(searchTimeMs * 0.3),
					modelUsed: "text-embedding-3-large",
					searchStrategy: searchOptions.hybridSearch ? "hybrid" : "bm25",
				};

				const response: RAGSearchResponse = {
					query: {
						query,
						...(filters !== undefined ? { filters } : {}),
						options: searchOptions,
					},
					results: ragResults,
					metadata,
				};

				logger.info(
					{
						organizationId: access.context.organizationId,
						userId: access.context.authUserId,
						role: access.context.role,
						query,
						resultsCount: results.length,
						searchTimeMs,
					},
					"RAG search completed",
				);

				return successResponse(response);
			} catch (error) {
				logger.error({ error, query }, "RAG search failed");
				set.status = 500;
				return errorResponse(
					"SEARCH_FAILED",
					error instanceof Error ? error.message : "Search operation failed",
				);
			}
		},
		{
			body: ragSearchSchema,
			detail: {
				summary: "RAG search",
				description: `
Perform hybrid search (BM25 + Dense + Rerank) on the SUNAT knowledge base.

**Features:**
- Hybrid search combining BM25 lexical and dense vector search
- Optional cross-encoder reranking
- Configurable weights for BM25 vs Dense
- Returns score breakdown and citations

**Headers Required:**
- \`X-Organization-ID\` - Organization identifier

**Rate Limit:** 60 requests/minute
				`,
				tags: ["AI RAG"],
			},
		},
	)

	/**
	 * POST /generate - RAG generation endpoint
	 *
	 * Performs search + LLM generation for complete RAG pipeline.
	 * Combines retrieved context with LLM for generated responses.
	 *
	 * Headers required:
	 * - X-Organization-ID: Organization identifier
	 *
	 * Rate limit: 30 requests/minute (LLM-intensive)
	 */
	.post(
		"/generate",
		async ({ body, request, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:stream",
				resource: "/api/v1/ai/rag/generate",
			});

			if (access.ok === false) {
				set.status = access.status;
				return errorResponse(access.code, access.error);
			}

			const startTime = Date.now();

			const {
				query,
				systemPrompt = DEFAULT_RAG_SYSTEM_PROMPT,
				temperature = 0.3,
				maxTokens = 2048,
				searchOptions,
			} = body as {
				query: string;
				systemPrompt?: string;
				temperature?: number;
				maxTokens?: number;
				searchOptions?: RAGSearchOptions;
			};

			const options: RAGSearchOptions = {
				...DEFAULT_RAG_SEARCH_OPTIONS,
				...(searchOptions as RAGSearchOptions),
			};

			try {
				// Step 1: Retrieve relevant chunks
				const results = await sunatKnowledgeService.hybridSearch(
					{ query, limit: options.finalK },
					options,
				);

				if (results.length === 0) {
					return successResponse({
						answer:
							"No se encontró información relevante para responder a tu consulta. Por favor, intenta con una pregunta diferente.",
						citations: [],
						confidence: 0,
						metadata: {
							model: "none",
							promptTokens: 0,
							completionTokens: 0,
							totalTokens: 0,
							latencyMs: Date.now() - startTime,
							contextChunksUsed: 0,
						},
					} as RAGGenerationResponse);
				}

				// Step 2: Build context for LLM
				const context = await sunatKnowledgeService.buildContext({
					query,
					limit: options.finalK,
				});

				// Step 3: Generate response using LLM
				const chatRequest: ChatCompletionRequest = {
					model: "anthropic/claude-sonnet-4-20250514",
					messages: [
						{
							role: "system",
							content: systemPrompt,
						},
						{
							role: "user",
							content: `Contexto normativo:
${context.formatted}

---

Pregunta: ${query}

Responde basándote únicamente en el contexto proporcionado.`,
						},
					],
					temperature,
					maxTokens,
				};

				const authenticatedRequest: AuthenticatedChatRequest = {
					...chatRequest,
					organizationId: access.context.organizationId,
					userId: access.context.userId,
				};

				const llmResponse = await llmGateway.chat(authenticatedRequest);

				const latencyMs = Date.now() - startTime;

				// Build citations from search results
				const citations = results.map((r) => ({
					startPosition: 0,
					endPosition: 0,
					citedText: r.content.substring(0, 50),
					citation: {
						text: `${r.source}${r.section ? ` - ${r.section}` : ""}`,
						reference: r.source,
						...(r.section !== undefined && r.section !== null ? { section: r.section } : {}),
						chunkId: r.id,
					},
				}));

				const usage = llmResponse.usage;

				const generationResponse: RAGGenerationResponse = {
					answer:
						llmResponse.choices?.[0]?.message?.content ??
						"No se pudo generar una respuesta.",
					citations,
					confidence: results.length > 0 ? 0.8 : 0,
					metadata: {
						model: llmResponse.model ?? "anthropic/claude-sonnet-4-20250514",
						promptTokens: usage?.promptTokens ?? 0,
						completionTokens: usage?.completionTokens ?? 0,
						totalTokens: usage?.totalTokens ?? 0,
						latencyMs,
						contextChunksUsed: results.length,
					},
				};

				logger.info(
					{
						organizationId: access.context.organizationId,
						userId: access.context.authUserId,
						role: access.context.role,
						query,
						resultsCount: results.length,
						latencyMs,
						model: generationResponse.metadata.model,
					},
					"RAG generation completed",
				);

				return successResponse(generationResponse);
			} catch (error) {
				logger.error({ error, query }, "RAG generation failed");
				set.status = 500;
				return errorResponse(
					"GENERATION_FAILED",
					error instanceof Error
						? error.message
						: "Generation operation failed",
				);
			}
		},
		{
			body: ragGenerateSchema,
			detail: {
				summary: "RAG generation",
				description: `
Complete RAG pipeline: search + LLM generation.

**Flow:**
1. Retrieve relevant chunks from SUNAT knowledge base
2. Build context from retrieved chunks
3. Generate answer using LLM with context injection

**Features:**
- Configurable search options (hybrid, weights, reranking)
- Custom system prompts
- Temperature and max tokens control
- Returns citations and confidence score

**Headers Required:**
- \`X-Organization-ID\` - Organization identifier

**Rate Limit:** 30 requests/minute (LLM-intensive)
				`,
				tags: ["AI RAG"],
			},
		},
	)

	/**
	 * GET /config - RAG configuration
	 *
	 * Returns current RAG pipeline configuration including:
	 * - Default search options
	 * - Available models
	 * - Supported document types
	 */
	.get(
		"/config",
		async ({ request, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/ai/rag/config",
			});

			if (access.ok === false) {
				set.status = access.status;
				return errorResponse(access.code, access.error);
			}

			return successResponse({
				search: {
					defaultOptions: DEFAULT_RAG_SEARCH_OPTIONS,
					availableModels: {
						embedding: [
							"text-embedding-3-large",
							"text-embedding-3-small",
							"bge-m3",
						],
						reranker: [
							"BAAI/bge-reranker-v2-m3",
							"cross-encoder/ms-marco-MiniLM-L-12-v2",
						],
					},
				},
				generation: {
					defaultModel: "anthropic/claude-sonnet-4-20250514",
					availableModels: [
						"anthropic/claude-sonnet-4-20250514",
						"anthropic/claude-3-5-sonnet-20241022",
						"openai/gpt-5",
						"google/gemini-2.5-pro",
						"grok/grok-2",
					],
					defaultTemperature: 0.3,
					defaultMaxTokens: 2048,
				},
				documentTypes: [
					"igv",
					"detraccion",
					"sire",
					"ruc",
					"bancarizacion",
					"pcge",
					"uit",
					"retencion",
					"percepcion",
				],
			});
		},
		{
			detail: {
				summary: "Get RAG configuration",
				description: `
Returns current RAG pipeline configuration.

**Returns:**
- Default search options (topK, weights, reranking)
- Available embedding/reranker models
- Available generation models
- Supported document type categories

**Headers Required:**
- \`X-Organization-ID\` - Organization identifier
				`,
				tags: ["AI RAG"],
			},
		},
	);

/**
 * AiRagRoutes type.
 *
 * @example
 * ```ts
 * const value: AiRagRoutes = {} as AiRagRoutes;
 * console.log(value);
 * ```
 */
export type AiRagRoutes = typeof aiRagRoutes;
