/**
 * AI Cost Repository
 *
 * Persistent storage for AI API cost events.
 * Replaces in-memory BudgetTracker with DB-backed audit trail.
 *
 * @module infrastructure/services/ai-cost
 */

import { db } from "@drenyra/persistence/client";
import {
	type AiCostEvent,
	aiCostEvents,
	type NewAiCostEvent,
} from "@drenyra/persistence/schema";
import { and, desc, gte, sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * CostEventInput interface.
 *
 * @example
 * ```ts
 * const value: CostEventInput = {} as CostEventInput;
 * console.log(value);
 * ```
 */
export interface CostEventInput {
	agentType: string;
	modelUsed: string;
	promptTokens: number;
	completionTokens: number;
	costUsd: number;
	taskId?: string;
	organizationId?: number;
	wasBlocked?: boolean;
	blockReason?: string;
}

/**
 * CostSummary interface.
 *
 * @example
 * ```ts
 * const value: CostSummary = {} as CostSummary;
 * console.log(value);
 * ```
 */
export interface CostSummary {
	daily: {
		spent: number;
		limit: number;
		remaining: number;
		percentage: number;
	};
	monthly: {
		spent: number;
		limit: number;
		remaining: number;
		percentage: number;
	};
	byAgent: Record<
		string,
		{ calls: number; totalCost: number; avgCostPerCall: number }
	>;
	trend: Array<{ date: string; spent: number; calls: number }>;
	topModels: Array<{ model: string; calls: number; totalCost: number }>;
	totalEvents: number;
}

// ─── Budget limits (mirrors openrouter.config.ts) ─────────────────────────────
const DAILY_LIMIT_USD = 50;
const MONTHLY_LIMIT_USD = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ulid(): string {
	return `${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

function daysAgo(n: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - n);
	d.setHours(0, 0, 0, 0);
	return d;
}

function startOfMonth(): Date {
	const d = new Date();
	d.setDate(1);
	d.setHours(0, 0, 0, 0);
	return d;
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * aiCostRepository const.
 *
 * @example
 * ```ts
 * console.log(aiCostRepository);
 * ```
 */
export const aiCostRepository = {
	/**
	 * Persists a cost event. Fire-and-forget safe — errors are swallowed
	 * to avoid blocking the AI pipeline.
	 */
	async record(input: CostEventInput): Promise<void> {
		const row: NewAiCostEvent = {
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
			// Non-blocking: cost tracking must never fail the AI pipeline
			console.warn("[ai-cost-repository] Failed to persist cost event:", err);
		}
	},

	/**
	 * Returns aggregated cost summary for dashboards.
	 */
	async getSummary(organizationId?: number): Promise<CostSummary> {
		const baseWhere = organizationId
			? sql`organization_id = ${organizationId}`
			: sql`1=1`;

		const dayStart = daysAgo(1);
		const monthStart = startOfMonth();

		// ── Daily and monthly totals ──────────────────────────────────────────────
		const [totals] = await db.execute<{
			daily_spent: string;
			monthly_spent: string;
			total_events: string;
		}>(sql`
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

		// ── By agent (last 30 days) ───────────────────────────────────────────────
		const agentRows = await db.execute<{
			agent_type: string;
			calls: string;
			total_cost: string;
		}>(sql`
      SELECT
        agent_type,
        COUNT(*) AS calls,
        COALESCE(SUM(cost_usd::float), 0) AS total_cost
      FROM ai_cost_events
      WHERE created_at >= ${daysAgo(30)} AND ${baseWhere}
      GROUP BY agent_type
      ORDER BY total_cost DESC
    `);

		const byAgent: CostSummary["byAgent"] = {};
		for (const row of agentRows) {
			const calls = parseInt(row.calls, 10);
			const totalCost = parseFloat(row.total_cost);
			byAgent[row.agent_type] = {
				calls,
				totalCost,
				avgCostPerCall: calls > 0 ? totalCost / calls : 0,
			};
		}

		// ── Daily trend (last 7 days) ─────────────────────────────────────────────
		const trendRows = await db.execute<{
			day: string;
			spent: string;
			calls: string;
		}>(sql`
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

		// ── Top models (last 30 days) ─────────────────────────────────────────────
		const modelRows = await db.execute<{
			model_used: string;
			calls: string;
			total_cost: string;
		}>(sql`
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

	/**
	 * Returns last N cost events for the activity feed.
	 */
	async getRecent(limit = 20, organizationId?: number): Promise<AiCostEvent[]> {
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
