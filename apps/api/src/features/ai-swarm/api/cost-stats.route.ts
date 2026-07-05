/**
 * AI Cost Stats Route
 *
 * Expone métricas de gasto de IA para el CostDashboard del frontend.
 * Soporta polling cada 30s desde TanStack Query.
 *
 * Endpoints:
 *   GET /api/ai-swarm/cost-stats              — Resumen global
 *   GET /api/ai-swarm/cost-stats?orgId=N      — Resumen por organización
 *   GET /api/ai-swarm/cost-stats/recent       — Últimos 20 eventos
 *
 * @since Feb 2026
 */

import { aiCostRepository } from "@drenyra/ai/services/ai-cost";
import { Elysia, t } from "elysia";
import { budgetTracker } from "../tools/budget-tracker";

/**
 * costStatsRoute const.
 *
 * @example
 * ```ts
 * console.log(costStatsRoute);
 * ```
 */
/** Mounted by `routes.ts` under the `/api/ai-swarm` group; avoid a second `/api/ai-swarm` prefix here. */
export const costStatsRoute = new Elysia()
	/**
	 * GET /api/ai-swarm/cost-stats
	 * Resumen consolidado: DB (histórico) + memoria (sesión actual).
	 */
	.get(
		"/cost-stats",
		async ({ query, set }) => {
			const orgId = query.orgId ? parseInt(query.orgId, 10) : undefined;

			if (orgId && isNaN(orgId)) {
				set.status = 400;
				return { success: false, message: "orgId debe ser un número entero." };
			}

			const [dbSummary, memoryUsage] = await Promise.all([
				aiCostRepository.getSummary(orgId),
				Promise.resolve(budgetTracker.getUsage()),
			]);

			return {
				success: true,
				data: {
					// DB-backed historical data
					historical: dbSummary,
					// In-memory session data (complementa el histórico)
					session: {
						daily: memoryUsage.daily,
						monthly: memoryUsage.monthly,
						byAgent: memoryUsage.byAgent,
					},
					// Merged budget status (DB takes precedence when available)
					budget: {
						daily:
							dbSummary.totalEvents > 0 ? dbSummary.daily : memoryUsage.daily,
						monthly:
							dbSummary.totalEvents > 0
								? dbSummary.monthly
								: memoryUsage.monthly,
					},
					meta: {
						source: dbSummary.totalEvents > 0 ? "database" : "memory",
						totalDbEvents: dbSummary.totalEvents,
						updatedAt: new Date().toISOString(),
					},
				},
			};
		},
		{
			query: t.Object({
				orgId: t.Optional(t.String()),
			}),
			detail: {
				tags: ["AI Swarm"],
				summary: "Resumen de costos de IA",
				description:
					"Retorna métricas de gasto consolidadas (DB histórico + memoria sesión).",
			},
		},
	)

	/**
	 * GET /api/ai-swarm/cost-stats/recent
	 * Feed de últimos eventos — para activity feed en el dashboard.
	 */
	.get(
		"/cost-stats/recent",
		async ({ query }) => {
			const limit = Math.min(parseInt(query.limit ?? "20", 10), 100);
			const orgId = query.orgId ? parseInt(query.orgId, 10) : undefined;

			const events = await aiCostRepository.getRecent(limit, orgId);

			return {
				success: true,
				data: events.map((e) => ({
					id: e.id,
					agentType: e.agentType,
					modelUsed: e.modelUsed,
					totalTokens: e.totalTokens,
					costUsd: parseFloat(e.costUsd as string),
					wasBlocked: e.wasBlocked,
					createdAt: e.createdAt,
				})),
				total: events.length,
			};
		},
		{
			query: t.Object({
				limit: t.Optional(t.String()),
				orgId: t.Optional(t.String()),
			}),
			detail: {
				tags: ["AI Swarm"],
				summary: "Últimos eventos de costo de IA",
				description: "Feed de actividad reciente para el dashboard de costos.",
			},
		},
	);
