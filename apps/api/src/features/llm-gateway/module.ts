/**
 * LLM Gateway Module
 *
 * ElysiaJS plugin that mounts the multi-provider LLM gateway routes.
 * Provides unified API for AI model inference across multiple providers.
 *
 * @module llm-gateway
 */

import { Elysia } from "elysia";
import { apiRateLimit } from "../../middleware/rate-limit";
import { llmGatewayRoutes } from "./routes";

/**
 * LLM Gateway module - mounts all gateway routes under /api/v1
 *
 * Routes:
 * - POST   /api/v1/chat/completions      - Chat completion (streaming supported)
 * - GET    /api/v1/providers             - List available providers
 * - GET    /api/v1/providers/:provider/health - Provider health status
 * - GET    /api/v1/rate-limit           - Get rate limit status
 * - GET    /api/v1/metrics              - Request metrics (success rate, latency)
 * - GET    /api/v1/costs                - Cost aggregation (by provider/model/period)
 * - POST   /api/v1/credentials          - Add provider credentials (admin)
 * - GET    /api/v1/credentials          - List credentials (admin)
 * - PUT    /api/v1/credentials/:id     - Update credentials (admin)
 * - DELETE /api/v1/credentials/:id      - Delete credentials (admin)
 */
export const llmGatewayModule = new Elysia({
	name: "llm-gateway",
	prefix: "/api/v1",
})
	.onBeforeHandle(apiRateLimit)
	.use(llmGatewayRoutes);

export type LlmgatewayModule = typeof llmGatewayModule;
