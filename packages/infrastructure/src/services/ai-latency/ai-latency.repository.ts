/**
 * AI Latency Repository
 *
 * Persistent storage for AI agent call latency events.
 * Enables p50/p95/p99 dashboards and SLA monitoring.
 *
 * @module infrastructure/services/ai-latency
 */

import { and, desc, eq, gte, sql } from "@arkelythex/persistence/query";
import { db } from "@arkelythex/persistence/client";
import {
	aiLatencyEvents,
	type AiLatencyEvent,
	type NewAiLatencyEvent,
} from "@arkelythex/persistence/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Input for recording a latency event.
 */
export interface LatencyEventInput {
	agentType: string;
	modelUsed: string;
	latencyMs: number;
	promptTokens?: number;
	completionTokens?: number;
	status: "success" | "failure";
	startedAt?: Date;
	completedAt?: Date;
	companyId?: string;
	batchId?: string;
}

/**
 * Aggregated latency summary.
 */
export interface LatencySummary {
	avgLatencyMs: number;
	p50LatencyMs: number;
	p95LatencyMs: number;
	p99LatencyMs: number;
	totalCalls: number;
	errorCount: number;
	errorRate: number;
}

/**
 * Latency breakdown by agent type.
 */
export interface LatencyByAgent {
	agentType: string;
	avgLatencyMs: number;
	p95LatencyMs: number;
	callCount: number;
}

/**
 * Latency trend data point.
 */
export interface LatencyTrend {
	date: string;
	avgLatencyMs: number;
	p95LatencyMs: number;
	callCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - n);
	d.setHours(0, 0, 0, 0);
	return d;
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * aiLatencyRepository const.
 *
 * Fire-and-forget safe — `record()` errors are swallowed
 * to avoid blocking the AI pipeline.
 */
export const aiLatencyRepository = {
	/**
	 * Persists a latency event. Non-blocking — errors are logged and swallowed.
	 */
	async record(input: LatencyEventInput): Promise<void> {
		const row: NewAiLatencyEvent = {
			agentType: input.agentType,
			modelUsed: input.modelUsed,
			latencyMs: input.latencyMs,
			promptTokens: input.promptTokens ?? null,
			completionTokens: input.completionTokens ?? null,
			status: input.status,
			startedAt: input.startedAt ?? null,
			completedAt: input.completedAt ?? null,
			companyId: input.companyId ?? null,
			batchId: input.batchId ?? null,
		};

		try {
			await db.insert(aiLatencyEvents).values(row);
		} catch (err) {
			// Non-blocking: latency tracking must never fail the AI pipeline
			console.warn("[ai-latency-repository] Failed to persist latency event:", err);
		}
	},

	/**
	 * Returns aggregated latency summary with percentiles.
	 */
	async getSummary(companyId?: string, since?: Date): Promise<LatencySummary> {
		const filters: ReturnType<typeof sql>[] = [];
		if (companyId) filters.push(sql`company_id = ${companyId}::uuid`);
		if (since) filters.push(sql`created_at >= ${since}`);
		const where =
			filters.length > 0
				? sql`${sql.join(filters, sql` AND `)}`
				: sql`1=1`;

		const [result] = await db.execute<{
			avg: string;
			p50: string;
			p95: string;
			p99: string;
			total: string;
			errors: string;
		}>(sql`
			SELECT
				COALESCE(AVG(latency_ms), 0) AS avg,
				COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms), 0) AS p50,
				COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) AS p95,
				COALESCE(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms), 0) AS p99,
				COUNT(*) AS total,
				COALESCE(SUM(CASE WHEN status = 'failure' THEN 1 ELSE 0 END), 0) AS errors
			FROM ai_latency_events
			WHERE ${where}
		`);

		const total = parseInt(result?.total ?? "0", 10);
		const errors = parseInt(result?.errors ?? "0", 10);

		return {
			avgLatencyMs: Number(result?.avg ?? 0),
			p50LatencyMs: Number(result?.p50 ?? 0),
			p95LatencyMs: Number(result?.p95 ?? 0),
			p99LatencyMs: Number(result?.p99 ?? 0),
			totalCalls: total,
			errorCount: errors,
			errorRate: total > 0 ? errors / total : 0,
		};
	},

	/**
	 * Returns latency breakdown by agent type.
	 */
	async getByAgent(companyId?: string, since?: Date): Promise<LatencyByAgent[]> {
		const filters: ReturnType<typeof sql>[] = [];
		if (companyId) filters.push(sql`company_id = ${companyId}::uuid`);
		if (since) filters.push(sql`created_at >= ${since}`);
		const where =
			filters.length > 0
				? sql`${sql.join(filters, sql` AND `)}`
				: sql`1=1`;

		const rows = await db.execute<{
			agent_type: string;
			avg: string;
			p95: string;
			count: string;
		}>(sql`
			SELECT
				agent_type,
				COALESCE(AVG(latency_ms), 0) AS avg,
				COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) AS p95,
				COUNT(*) AS count
			FROM ai_latency_events
			WHERE ${where}
			GROUP BY agent_type
			ORDER BY avg DESC
		`);

		return rows.map((r) => ({
			agentType: r.agent_type,
			avgLatencyMs: Number(r.avg),
			p95LatencyMs: Number(r.p95),
			callCount: parseInt(r.count, 10),
		}));
	},

	/**
	 * Returns daily latency trend.
	 */
	async getTrend(companyId?: string, since?: Date): Promise<LatencyTrend[]> {
		const filters: ReturnType<typeof sql>[] = [];
		if (companyId) filters.push(sql`company_id = ${companyId}::uuid`);
		if (since) filters.push(sql`created_at >= ${since}`);
		const where =
			filters.length > 0
				? sql`${sql.join(filters, sql` AND `)}`
				: sql`1=1`;

		const rows = await db.execute<{
			date: string;
			avg: string;
			p95: string;
			count: string;
		}>(sql`
			SELECT
				DATE(created_at) AS date,
				COALESCE(AVG(latency_ms), 0) AS avg,
				COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 0) AS p95,
				COUNT(*) AS count
			FROM ai_latency_events
			WHERE ${where}
			GROUP BY DATE(created_at)
			ORDER BY date ASC
		`);

		return rows.map((r) => ({
			date: r.date,
			avgLatencyMs: Number(r.avg),
			p95LatencyMs: Number(r.p95),
			callCount: parseInt(r.count, 10),
		}));
	},

	/**
	 * Returns the last N latency events (activity feed).
	 */
	async getRecent(limit = 20, companyId?: string): Promise<AiLatencyEvent[]> {
		const conditions: ReturnType<typeof and>[] = [];
		if (companyId) {
			conditions.push(eq(aiLatencyEvents.companyId, companyId));
		}

		return db
			.select()
			.from(aiLatencyEvents)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(aiLatencyEvents.createdAt))
			.limit(limit);
	},
};
