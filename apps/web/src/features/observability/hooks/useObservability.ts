/**
 * TanStack Query hooks for AI observability data.
 *
 * Uses auto-refetch intervals so the dashboard stays live.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	batchApi,
	fetchRunEvents,
	fetchRunSummary,
	fetchRuns,
	latencyApi,
	memoryApi,
} from "../api/observability.api";

const SUMMARY_KEY = ["observability", "summary"] as const;
const RUNS_KEY = ["observability", "runs"] as const;
const EVENTS_KEY = ["observability", "runs", "events"] as const;

/**
 * Summary stats — refreshes every 30s, stale after 15s.
 */
export function useRunSummary() {
	return useQuery({
		queryKey: SUMMARY_KEY,
		queryFn: fetchRunSummary,
		refetchInterval: 30_000,
		staleTime: 15_000,
	});
}

/**
 * Paginated/status-filtered runs list — refreshes every 15s.
 */
export function useRuns(limit = 25, status?: string) {
	return useQuery({
		queryKey: [...RUNS_KEY, { limit, status }],
		queryFn: () => fetchRuns({ limit, status }),
		refetchInterval: 15_000,
		staleTime: 10_000,
	});
}

/**
 * Events for a specific run. Disabled when runId is null.
 */
export function useRunEvents(runId: string | null, limit = 50) {
	return useQuery({
		queryKey: [...EVENTS_KEY, runId, { limit }],
		queryFn: () => fetchRunEvents(runId!, limit),
		enabled: !!runId,
		staleTime: 30_000,
	});
}

import type { CreateBatchPayload } from "../types";

export const useBatches = (companyId?: string) =>
	useQuery({
		queryKey: ["batches", companyId],
		queryFn: () => batchApi.list(companyId),
		refetchInterval: 30_000,
		staleTime: 15_000,
	});

export const useBatchDetail = (batchId: string | null) =>
	useQuery({
		queryKey: ["batch-detail", batchId],
		queryFn: () => batchApi.getDetail(batchId!),
		enabled: !!batchId,
		refetchInterval: 15_000,
		staleTime: 5_000,
	});

export const useSubmitBatch = () =>
	useMutation({
		mutationFn: ({ payload }: { payload: CreateBatchPayload }) =>
			batchApi.submit(payload),
	});

export const useCancelBatch = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ batchId }: { batchId: string }) => batchApi.cancel(batchId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["batches"] });
			queryClient.invalidateQueries({ queryKey: ["batch-detail"] });
		},
	});
};

// ─── Latency Hooks ──────────────────────────────────────────────────────

const LATENCY_SUMMARY_KEY = ["latency-summary"] as const;
const LATENCY_TREND_KEY = ["latency-trend"] as const;
const LATENCY_RECENT_KEY = ["latency-recent"] as const;

export function useLatencySummary() {
	return useQuery({
		queryKey: LATENCY_SUMMARY_KEY,
		queryFn: () => latencyApi.summary(),
		refetchInterval: 30_000,
		staleTime: 15_000,
	});
}

export function useLatencyTrend() {
	return useQuery({
		queryKey: LATENCY_TREND_KEY,
		queryFn: () => latencyApi.trend(),
		refetchInterval: 30_000,
		staleTime: 15_000,
	});
}

export function useLatencyRecent() {
	return useQuery({
		queryKey: LATENCY_RECENT_KEY,
		queryFn: () => latencyApi.recent(),
		refetchInterval: 30_000,
		staleTime: 15_000,
	});
}

// ─── Memory Hooks ──────────────────────────────────────────────────────────

const MEMORY_PROFILE_KEY = ["memory-profile"] as const;
const MEMORY_HISTORY_KEY = ["memory-history"] as const;

export function useMemoryProfile(companyId: string) {
	return useQuery({
		queryKey: [...MEMORY_PROFILE_KEY, { companyId }],
		queryFn: () => memoryApi.profile(companyId),
		refetchInterval: 30_000,
		staleTime: 15_000,
		enabled: !!companyId,
	});
}

export function useMemoryHistory(companyId: string) {
	return useQuery({
		queryKey: [...MEMORY_HISTORY_KEY, { companyId }],
		queryFn: () => memoryApi.history(companyId),
		refetchInterval: 30_000,
		staleTime: 15_000,
		enabled: !!companyId,
	});
}
