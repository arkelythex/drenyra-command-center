/**
 * AI RAG Feature Module
 *
 * RAG pipeline Phase 3 endpoints:
 * - /search - Hybrid RAG search
 * - /generate - Search + LLM generation
 * - /config - RAG configuration
 *
 * Knowledge base endpoints:
 * - /knowledge/search - Knowledge base hybrid search
 * - /knowledge/context - Build LLM context
 * - /knowledge/stats - Knowledge base statistics
 * - /knowledge/categories - Available categories
 *
 * @module features/ai-rag
 */

export { aiRagRoutes } from "./api/routes";
export { knowledgeBaseModule, knowledgeBaseRoutes } from "./knowledge-base";
export { aiRagModule } from "./module";
