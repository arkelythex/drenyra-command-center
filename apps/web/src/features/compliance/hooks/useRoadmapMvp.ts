/**
 * useRoadmapMvp — Snapshot query + one-click run mutation.
 *
 * Responsibilities:
 * - Fetch the current roadmap MVP snapshot for the active company/period.
 * - Execute one-click automation actions.
 *
 * Does NOT handle HITL decisions (see useHitlDecision) or timeline (see useTimeline).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { safeApiCall } from "@/lib/api-factory";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type {
	RoadmapMvpAction,
	RoadmapMvpActionRunResult,
	RoadmapMvpSnapshot,
} from "../components/shared/types";

const queryKeyFactory = {
	all: ["roadmap-mvp"] as const,
	detail: (companyId: string, year: number, month: number) =>
		[queryKeyFactory.all, "detail", companyId, year, month] as const,
};

/** Derives the current year/month from the system clock. */
function usePeriod() {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function useRoadmapMvp() {
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const { year, month } = usePeriod();

	// ── Snapshot query ──────────────────────────────────────────────────────
	const snapshotQuery = useQuery({
		queryKey: queryKeyFactory.detail(companyContext.companyId, year, month),
		queryFn: async (): Promise<RoadmapMvpSnapshot> => {
			const result = await safeApiCall(async () => {
				const body = await unwrap(
					api.compliance["roadmap-mvp"].get({
						query: {
							companyId: companyContext.companyId,
							year,
							month,
						},
					} as never),
				);
				return extractOkData(
					body,
					"No se pudo cargar el estado roadmap MVP",
				) as RoadmapMvpSnapshot;
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		staleTime: 60_000,
	});

	// ── One-click run mutation ────────────────────────────────────────────────
	const runMutation = useMutation({
		mutationFn: async (
			action: RoadmapMvpAction,
		): Promise<RoadmapMvpActionRunResult> => {
			const result = await safeApiCall(async () => {
				const body = await unwrap(
					api.compliance["roadmap-mvp"]
						.actions({ actionId: action.id })
						.run.post({
							companyId: companyContext.companyId,
							year,
							month,
							traceId: action.traceId,
						} as never),
				);
				return extractOkData(
					body,
					"No se pudo ejecutar la acción del copilot",
				) as RoadmapMvpActionRunResult;
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: queryKeyFactory.detail(companyContext.companyId, year, month),
			});
		},
	});

	return {
		snapshot: snapshotQuery.data,
		isLoading: snapshotQuery.isLoading,
		isError: snapshotQuery.isError,
		period: `${year}-${String(month).padStart(2, "0")}`,
		runAction: runMutation.mutateAsync,
		lastRunResult: runMutation.data ?? null,
		runningActionId: runMutation.variables?.id ?? null,
		isRunning: runMutation.isPending,
	};
}
