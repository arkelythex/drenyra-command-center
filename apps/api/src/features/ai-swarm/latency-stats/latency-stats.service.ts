/**
 * Latency Stats Service
 *
 * Static service layer for AI latency statistics.
 * Delegates to AiLatencyRepository for persistence.
 *
 * @module ai-swarm/latency-stats
 */

import {
	aiLatencyRepository,
	type LatencyByAgent,
	type LatencySummary,
	type LatencyTrend,
} from "@drenyra/ai/services/ai-latency";
import { aiLatencyEvents, type AiLatencyEvent } from "@drenyra/persistence/schema";

/**
 * LatencyStatsService class.
 *
 * @example
 * ```ts
 * const summary = await LatencyStatsService.getSummary({ since: "2026-01-01T00:00:00Z" });
 * console.log(summary);
 * ```
 */
export class LatencyStatsService {
	/**
	 * Returns aggregated latency summary with percentiles and by-agent breakdown.
	 */
	static async getSummary(query: {
		since?: string;
		companyId?: string;
	}): Promise<{ summary: LatencySummary; byAgent: LatencyByAgent[] }> {
		const since = query.since ? new Date(query.since) : undefined;
		const companyId = query.companyId;

		const [summary, byAgent] = await Promise.all([
			aiLatencyRepository.getSummary(companyId, since),
			aiLatencyRepository.getByAgent(companyId, since),
		]);

		return { summary, byAgent };
	}

	/**
	 * Returns daily latency trend.
	 */
	static async getTrend(query: {
		since?: string;
		companyId?: string;
	}): Promise<LatencyTrend[]> {
		const since = query.since ? new Date(query.since) : undefined;
		return aiLatencyRepository.getTrend(query.companyId, since);
	}

	/**
	 * Returns the last N latency events.
	 */
	static async getRecent(query: {
		limit?: number;
		companyId?: string;
	}): Promise<{ events: AiLatencyEvent[]; total: number }> {
		const limit = Math.min(query.limit ?? 20, 100);
		const events = await aiLatencyRepository.getRecent(limit, query.companyId);
		return { events, total: events.length };
	}
}
