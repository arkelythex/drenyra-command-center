/**
 * SUNAT Knowledge Base Module
 *
 * ElysiaJS plugin that mounts knowledge base routes.
 * Provides endpoints for hybrid search, context building, and statistics.
 * Nestable under a parent feature module (e.g., ai-rag).
 *
 * @module features/ai-rag/knowledge-base
 */

import { Elysia } from "elysia";
import { knowledgeBaseRoutes } from "./api/routes";

export const knowledgeBaseModule = new Elysia({
	name: "ai-rag-knowledge-base",
	prefix: "/knowledge",
}).use(knowledgeBaseRoutes);

export type KnowledgeBaseModule = typeof knowledgeBaseModule;
