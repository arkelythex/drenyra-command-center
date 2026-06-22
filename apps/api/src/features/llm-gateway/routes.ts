/**
 * LLM Gateway Routes
 *
 * API endpoints for multi-provider LLM gateway.
 * Provides unified interface for AI chat completions with failover,
 * rate limiting, and provider selection.
 *
 * @module llm-gateway/routes
 */
import { Elysia } from "elysia";
import { chatCompletionsRoute } from "./chat.route";
import { operationalRoutes } from "./operational.route";
import { providerRoutes } from "./provider.route";

/**
 * LLM Gateway routes
 *
 * Provides:
 * - POST /chat/completions - Chat completion (streaming supported)
 * - GET /providers - List available providers
 * - GET /providers/:provider/health - Provider health status
 * - GET /rate-limit - Get rate limit status
 * - GET /metrics - Gateway metrics
 * - GET /costs - Cost aggregation
 */
export const llmGatewayRoutes = new Elysia({ name: "llm-gateway-routes" })
	.use(chatCompletionsRoute)
	.use(providerRoutes)
	.use(operationalRoutes);
