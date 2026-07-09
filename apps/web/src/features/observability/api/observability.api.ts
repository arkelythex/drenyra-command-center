/**
 * API Client for AI Observability endpoints
 *
 * Consumes the 3 read-only endpoints exposed by apps/api:
 *   GET /api/ai-swarm/observability/summary
 *   GET /api/ai-swarm/observability/runs
 *   GET /api/ai-swarm/observability/runs/:runId/events
 */

import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import type { AgentRunEvent, AgentRunState, RunSummary } from "../types";

/**
 * Fetch aggregated run summary counts.
 */
export async function fetchRunSummary(): Promise<RunSummary> {
	const body = await unwrap(api.api.aiSwarm.observability.summary.get());
	return extractOkData<RunSummary>(body, "Failed to fetch run summary");
}

/**
 * Fetch a paginated list of agent runs.
 */
export async function fetchRuns(params?: {
	limit?: number;
	status?: string;
}): Promise<AgentRunState[]> {
	const query: Record<string, string> = {};
	if (params?.limit != null) query.limit = String(params.limit);
	if (params?.status) query.status = params.status;

	const body = await unwrap(api.api.aiSwarm.observability.runs.get({ query }));
	return extractOkData<AgentRunState[]>(body, "Failed to fetch runs");
}

/**
 * Fetch events for a specific run.
 */
export async function fetchRunEvents(
	runId: string,
	limit = 50,
): Promise<AgentRunEvent[]> {
	const body = await unwrap(
		api.api.aiSwarm.observability.runs({ runId }).events.get({
			query: { limit: String(limit) },
		}),
	);
	return extractOkData<AgentRunEvent[]>(body, "Failed to fetch run events");
}

import type {
	BatchDetail,
	BatchRun,
	CreateBatchPayload,
	LatencyRecentEvent,
	LatencySummary,
	LatencyTrendItem,
	MemoryEntry,
	MemoryProfile,
} from "../types";

// ─── Memory API ──────────────────────────────────────────────────────────────

export const memoryApi = {
	async profile(companyId: string): Promise<MemoryProfile> {
		const body = await unwrap(
			api.api.aiSwarm.observability.memory({ companyId }).get(),
		);
		return extractOkData<MemoryProfile>(
			body,
			"No se pudo cargar el perfil de memoria del agente",
		);
	},

	async history(companyId: string): Promise<MemoryEntry[]> {
		const body = await unwrap(
			api.api.aiSwarm.observability.memory({ companyId }).history.get(),
		);
		return extractOkData<MemoryEntry[]>(
			body,
			"No se pudo cargar el historial de memoria del agente",
		);
	},
};

export const batchApi = {
	async list(_companyId?: string): Promise<BatchRun[]> {
		const body = await unwrap(
			api.api.ai.swarm.observability.batches.get({
				query: { ...getTenantContext(), limit: "50" },
			}),
		);
		return extractOkData<BatchRun[]>(body, "Failed to load batches");
	},

	async getDetail(batchId: string): Promise<BatchDetail> {
		const body = await unwrap(
			api.api.ai.swarm.observability.batches({ batchId }).get(),
		);
		return extractOkData<BatchDetail>(body, "Failed to load batch detail");
	},

	async submit(payload: CreateBatchPayload): Promise<{ batchId: string }> {
		const body = await unwrap(
			api.api.ai.swarm.observability.batch.post(payload),
		);
		return extractOkData<{ batchId: string }>(body, "Failed to submit batch");
	},

	async cancel(batchId: string): Promise<void> {
		await unwrap(
			api.api.ai.swarm.observability.batches({ batchId }).cancel.post(),
		);
	},
};

// ─── Latency API ─────────────────────────────────────────────────────────

export const latencyApi = {
	async summary(): Promise<LatencySummary> {
		const body = await unwrap(api.api.aiSwarm["latency-stats"].get());
		return extractOkData<LatencySummary>(
			body,
			"No se pudieron cargar las métricas de latencia",
		);
	},

	async trend(): Promise<LatencyTrendItem[]> {
		const body = await unwrap(api.api.aiSwarm["latency-stats"].trend.get());
		return extractOkData<LatencyTrendItem[]>(
			body,
			"No se pudo cargar la tendencia",
		);
	},

	async recent(): Promise<LatencyRecentEvent[]> {
		const body = await unwrap(api.api.aiSwarm["latency-stats"].recent.get());
		return extractOkData<LatencyRecentEvent[]>(
			body,
			"No se pudieron cargar los eventos recientes",
		);
	},
};
