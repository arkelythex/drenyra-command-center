/**
 * AI RAG Module
 *
 * ElysiaJS plugin that mounts the RAG pipeline and knowledge base routes.
 * Provides endpoints for RAG search, generation, configuration, and SUNAT knowledge queries.
 *
 * @module features/ai-rag
 */

import { Elysia } from "elysia";
import { apiRateLimit } from "../../middleware/rate-limit";
import { aiRagRoutes } from "./api/routes";
import { knowledgeBaseModule } from "./knowledge-base";

/**
 * AI RAG module - mounts all routes under /api/v1/ai/rag
 *
 * RAG routes:
 * - POST /api/v1/ai/rag/search     - RAG hybrid search
 * - POST /api/v1/ai/rag/generate  - RAG search + LLM generation
 * - GET  /api/v1/ai/rag/config    - RAG configuration exposure
 *
 * Knowledge base routes:
 * - POST /api/v1/ai/rag/knowledge/search     - Knowledge base hybrid search
 * - POST /api/v1/ai/rag/knowledge/context    - Build LLM context
 * - GET  /api/v1/ai/rag/knowledge/stats      - Knowledge base statistics
 * - GET  /api/v1/ai/rag/knowledge/categories - Available categories
 */
export const aiRagModule = new Elysia({
	name: "ai-rag",
	prefix: "/api/v1/ai/rag",
})
	.onBeforeHandle(apiRateLimit)
	.use(aiRagRoutes)
	.use(knowledgeBaseModule);

export type AiRagModule = typeof aiRagModule;
