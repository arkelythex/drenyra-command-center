import { db } from "@drenyra/persistence/client";
import { aiCostEvents } from "@drenyra/persistence/schema";
import { and, desc, gte, sql } from "drizzle-orm";

const DAILY_LIMIT_USD = 50;
const MONTHLY_LIMIT_USD = 500;
function ulid() {
	return `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}
function daysAgo(n) {
	const d = new Date();
	d.setDate(d.getDate() - n);
	d.setHours(0, 0, 0, 0);
	return d;
}
function startOfMonth() {
	const d = new Date();
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
}
export const aiCostRepository = {
	async record(input) {
		const row = {
			id: ulid(),
			agentType: input.agentType,
			modelUsed: input.modelUsed,
			promptTokens: input.promptTokens,
			completionTokens: input.completionTokens,
			totalTokens: input.promptTokens + input.completionTokens,
			costUsd: input.costUsd.toFixed(8),
			taskId: input.taskId ?? null,
			organizationId: input.organizationId ?? null,
			wasBlocked: input.wasBlocked ?? false,
			blockReason: input.blockReason ?? null,
		};
		try {
			await db.insert(aiCostEvents).values(row);
		} catch (err) {
			console.warn("[ai-cost-repository] Failed to persist cost event:", err);
		}
	},
	async getSummary(organizationId) {
		const baseWhere = organizationId
			? sql`organization_id = ${organizationId}`
			: sql`1=1`;
		const dayStart = daysAgo(1);
		const monthStart = startOfMonth();
		const [totals] = await db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN created_at >= ${dayStart} THEN cost_usd::float ELSE 0 END), 0) AS daily_spent,
        COALESCE(SUM(CASE WHEN created_at >= ${monthStart} THEN cost_usd::float ELSE 0 END), 0) AS monthly_spent,
        COUNT(*) AS total_events
      FROM ai_cost_events
      WHERE ${baseWhere}
    `);
		const dailySpent = parseFloat(totals.daily_spent ?? "0");
		const monthlySpent = parseFloat(totals.monthly_spent ?? "0");
		const totalEvents = parseInt(totals.total_events ?? "0", 10);
		const agentRows = await db.execute(sql`
      SELECT
        agent_type,
        COUNT(*) AS calls,
        COALESCE(SUM(cost_usd::float), 0) AS total_cost
      FROM ai_cost_events
      WHERE created_at >= ${daysAgo(30)} AND ${baseWhere}
      GROUP BY agent_type
      ORDER BY total_cost DESC
    `);
		const byAgent = {};
		for (const row of agentRows) {
			const calls = parseInt(row.calls, 10);
			const totalCost = parseFloat(row.total_cost);
			byAgent[row.agent_type] = {
				calls,
				totalCost,
				avgCostPerCall: calls > 0 ? totalCost / calls : 0,
			};
		}
		const trendRows = await db.execute(sql`
      SELECT
        DATE(created_at) AS day,
        COALESCE(SUM(cost_usd::float), 0) AS spent,
        COUNT(*) AS calls
      FROM ai_cost_events
      WHERE created_at >= ${daysAgo(7)} AND ${baseWhere}
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);
		const trend = trendRows.map((r) => ({
			date: r.day,
			spent: parseFloat(r.spent),
			calls: parseInt(r.calls, 10),
		}));
		const modelRows = await db.execute(sql`
      SELECT
        model_used,
        COUNT(*) AS calls,
        COALESCE(SUM(cost_usd::float), 0) AS total_cost
      FROM ai_cost_events
      WHERE created_at >= ${daysAgo(30)} AND ${baseWhere}
      GROUP BY model_used
      ORDER BY total_cost DESC
      LIMIT 5
    `);
		const topModels = modelRows.map((r) => ({
			model: r.model_used,
			calls: parseInt(r.calls, 10),
			totalCost: parseFloat(r.total_cost),
		}));
		return {
			daily: {
				spent: dailySpent,
				limit: DAILY_LIMIT_USD,
				remaining: Math.max(0, DAILY_LIMIT_USD - dailySpent),
				percentage: Math.min(100, (dailySpent / DAILY_LIMIT_USD) * 100),
			},
			monthly: {
				spent: monthlySpent,
				limit: MONTHLY_LIMIT_USD,
				remaining: Math.max(0, MONTHLY_LIMIT_USD - monthlySpent),
				percentage: Math.min(100, (monthlySpent / MONTHLY_LIMIT_USD) * 100),
			},
			byAgent,
			trend,
			topModels,
			totalEvents,
		};
	},
	async getRecent(limit = 20, organizationId) {
		return db
			.select()
			.from(aiCostEvents)
			.where(
				organizationId
					? and(
							gte(aiCostEvents.organizationId, organizationId),
							sql`organization_id = ${organizationId}`,
						)
					: undefined,
			)
			.orderBy(desc(aiCostEvents.createdAt))
			.limit(limit);
	},
};

