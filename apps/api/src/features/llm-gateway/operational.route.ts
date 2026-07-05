/**
 * LLM Gateway — Operational routes.
 * Handles GET /rate-limit, /metrics, /costs
 */
import { type LLMProvider, llmGateway } from "@drenyra/ai/gateway";
import { Elysia, t } from "elysia";
import { authorizeAiSurface } from "../security/ai-surface-access";
import { toHeaderRecord } from "./helpers";

export const operationalRoutes = new Elysia({ name: "llm-gateway-operational" })
	.get(
		"/rate-limit",
		async ({ request, query, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/rate-limit",
			});

			if (access.ok === false) {
				set.status = access.status;
				return {
					success: false,
					error: { code: access.code, message: access.error },
				};
			}

			const provider = (query.provider as LLMProvider) || "openrouter";
			const status = llmGateway.getRateLimitStatus(
				access.context.organizationId,
				provider,
			);

			return {
				success: true,
				data: {
					remainingRpm: status.remainingRpm,
					remainingRpd: status.remainingRpd,
				},
			};
		},
		{
			query: t.Object({
				provider: t.Optional(
					t.Union([
						t.Literal("anthropic"),
						t.Literal("openai"),
						t.Literal("google"),
						t.Literal("grok"),
						t.Literal("openrouter"),
						t.Literal("ollama"),
					]),
				),
			}),
			detail: { summary: "Get rate limit status", tags: ["LLM Gateway"] },
		},
	)
	.get(
		"/metrics",
		async ({ request, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/metrics",
			});

			if (access.ok === false) {
				set.status = access.status;
				return {
					success: false,
					error: { code: access.code, message: access.error },
				};
			}

			const metrics = llmGateway.getMetrics();
			const orgMetrics = metrics.filter(
				(m) => m.organizationId === access.context.organizationId,
			);

			const totalRequests = orgMetrics.length;
			const successfulRequests = orgMetrics.filter((m) => m.success).length;
			const avgLatencyMs =
				totalRequests > 0
					? orgMetrics.reduce((sum, m) => sum + m.latencyMs, 0) / totalRequests
					: 0;
			const totalTokens = orgMetrics.reduce((sum, m) => sum + m.totalTokens, 0);

			return {
				success: true,
				data: {
					totalRequests,
					successfulRequests,
					failedRequests: totalRequests - successfulRequests,
					avgLatencyMs: Math.round(avgLatencyMs),
					totalTokens,
					recentRequests: orgMetrics.slice(-10),
				},
			};
		},
		{
			detail: { summary: "Get gateway metrics", tags: ["LLM Gateway"] },
		},
	)
	.get(
		"/costs",
		async ({ request, query, set }) => {
			const access = await authorizeAiSurface({
				headers: toHeaderRecord(request.headers),
				operation: "cognitive:state:read",
				resource: "/api/v1/costs",
			});

			if (access.ok === false) {
				set.status = access.status;
				return {
					success: false,
					error: { code: access.code, message: access.error },
				};
			}

			const period =
				(query.period as "hourly" | "daily" | "monthly") || "daily";
			const costs = llmGateway.getCostAggregation(
				access.context.organizationId,
				period,
			);

			return { success: true, data: costs };
		},
		{
			query: t.Object({
				period: t.Optional(
					t.Union([
						t.Literal("hourly"),
						t.Literal("daily"),
						t.Literal("monthly"),
					]),
				),
			}),
			detail: { summary: "Get cost aggregation", tags: ["LLM Gateway"] },
		},
	);
