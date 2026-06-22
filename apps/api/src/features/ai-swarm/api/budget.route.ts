/**
 * Budget API Route
 *
 * GET /budget, /budget/detailed, /cache/stats endpoints
 *
 * @module ai-swarm/api/budget
 */

import { Elysia } from "elysia";
import { OrchestratorService } from "../orchestrator/orchestrator.service";
import { budgetTracker } from "../tools/budget-tracker";
import { agentCache } from "../tools/cache";

/**
 * AI Swarm routes
 * @example
 * ```ts
 * console.log(aiSwarmRoutes);
 * ```
 */

export const budgetRoute = new Elysia({ prefix: "/api/ai-swarm" })
	/**
	 * GET /api/ai-swarm/budget
	 *
	 * Get current budget usage
	 */
	.get(
		"/budget",
		async () => {
			const orchestrator = new OrchestratorService();
			const budget = await orchestrator.getBudgetUsage();

			return {
				success: true,
				data: budget,
			};
		},
		{
			detail: {
				summary: "Get budget usage",
				description:
					"Returns current daily and monthly budget usage for AI operations",
				tags: ["AI Swarm"],
			},
		},
	)

	/**
	 * GET /api/ai-swarm/cache/stats
	 *
	 * Get cache statistics
	 */
	.get(
		"/cache/stats",
		async () => {
			const stats = agentCache.getStats();

			return {
				success: true,
				data: stats,
			};
		},
		{
			detail: {
				summary: "Get cache statistics",
				description: `
Returns cache performance metrics:
- Size: Current number of cached entries
- Hits/Misses: Cache hit rate
- Total Savings: Estimated cost savings from cache hits
        `,
				tags: ["AI Swarm"],
			},
		},
	)

	/**
	 * GET /api/ai-swarm/budget/detailed
	 *
	 * Get detailed budget usage
	 */
	.get(
		"/budget/detailed",
		async () => {
			const usage = budgetTracker.getUsage();
			const trend = budgetTracker.getTrend(7);

			return {
				success: true,
				data: {
					usage,
					trend,
				},
			};
		},
		{
			detail: {
				summary: "Get detailed budget usage",
				description: `
Returns comprehensive budget analytics:
- Daily/Monthly usage and limits
- Usage by agent type
- Recent operations
- 7-day spending trend
        `,
				tags: ["AI Swarm"],
			},
		},
	);
