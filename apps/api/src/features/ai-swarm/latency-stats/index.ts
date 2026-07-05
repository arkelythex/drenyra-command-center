/**
 * Latency Stats Routes
 *
 * AI latency monitoring endpoints.
 * Provides p50/p95/p99 latency dashboards for AI agent calls.
 *
 * Endpoints:
 *   GET /latency-stats        — Summary + by-agent breakdown
 *   GET /latency-stats/trend   — Daily latency trend
 *   GET /latency-stats/recent  — Recent latency events
 *
 * @module ai-swarm/latency-stats
 */

import { Elysia } from "elysia";
import type { z } from "zod";
import { authorizeOperation } from "../../security/rbac-guard";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import {
	LatencyRecentQuerySchema,
	LatencySummaryQuerySchema,
	LatencyTrendQuerySchema,
} from "./latency-stats.schema";
import {
	LatencyRecentQuerySchema as ZodLatencyRecentQuerySchema,
	LatencySummaryQuerySchema as ZodLatencySummaryQuerySchema,
	LatencyTrendQuerySchema as ZodLatencyTrendQuerySchema,
} from "./latency-stats.schemas";
import { LatencyStatsService } from "./latency-stats.service";

function validationErrorResponse(error: z.ZodError<unknown>) {
	return fail("Invalid latency-stats request parameters", "VALIDATION_ERROR", {
		details: {
			issues: error.issues.map((issue) => ({
				path: issue.path,
				message: issue.message,
			})),
		},
	});
}

/**
 * latencyStatsModule const.
 *
 * @example
 * ```ts
 * app.use(latencyStatsModule);
 * ```
 */
export const latencyStatsModule = new Elysia({
	prefix: "/latency-stats",
})
	/**
	 * GET /latency-stats — Combined summary + by-agent breakdown
	 */
	.get(
		"/",
		async ({ query, set, headers }) => {
			const parsed = ZodLatencySummaryQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "observability:runs:read",
				resource: "/api/ai-swarm/latency-stats",
				requestedCompanyId: parsed.data.companyId,
			});
			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			try {
				const data = await LatencyStatsService.getSummary(parsed.data);
				return ok(data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: LatencySummaryQuerySchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Obtener resumen de latencia de agentes",
				description:
					"Retorna métricas de latencia consolidadas: promedio, p50, p95, p99, tasa de error y desglose por agente.",
			},
		},
	)

	/**
	 * GET /latency-stats/trend — Daily latency trend
	 */
	.get(
		"/trend",
		async ({ query, set, headers }) => {
			const parsed = ZodLatencyTrendQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "observability:runs:read",
				resource: "/api/ai-swarm/latency-stats/trend",
				requestedCompanyId: parsed.data.companyId,
			});
			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			try {
				const data = await LatencyStatsService.getTrend(parsed.data);
				return ok(data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: LatencyTrendQuerySchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Obtener tendencia de latencia",
				description: "Retorna la evolución diaria de latencia promedio y p95.",
			},
		},
	)

	/**
	 * GET /latency-stats/recent — Recent latency events
	 */
	.get(
		"/recent",
		async ({ query, set, headers }) => {
			const parsed = ZodLatencyRecentQuerySchema.safeParse(query);
			if (!parsed.success) {
				set.status = 422;
				return validationErrorResponse(parsed.error);
			}

			const authz = await authorizeOperation({
				headers: headers as Record<string, unknown>,
				operation: "observability:runs:read",
				resource: "/api/ai-swarm/latency-stats/recent",
				requestedCompanyId: parsed.data.companyId,
			});
			if (!authz.ok) {
				set.status = authz.status;
				return fail(authz.error, authz.code);
			}

			try {
				const data = await LatencyStatsService.getRecent(parsed.data);
				return ok(data);
			} catch (error: unknown) {
				set.status = 500;
				return fail(getErrorMessage(error), "INTERNAL_ERROR");
			}
		},
		{
			query: LatencyRecentQuerySchema,
			detail: {
				tags: ["AI Swarm"],
				summary: "Obtener eventos de latencia recientes",
				description:
					"Feed de actividad de latencia para el dashboard de monitoreo.",
			},
		},
	);
