/**
 * useHitlDecision — Human-in-the-loop decision mutation (S2).
 *
 * Responsibilities:
 * - Register an approve/reject/escalate decision for a roadmap recommendation.
 * - Invalidate the snapshot query on success so the panel reflects the decision.
 *
 * Single-responsibility: only handles the HITL decision flow.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type {
	RoadmapDecisionType,
	RoadmapMvpAction,
	RoadmapMvpDecisionResult,
} from "../components/shared/types";

const snapshotQueryKeyFactory = {
	all: ["roadmap-mvp"] as const,
	detail: (companyId: string, year: number, month: number) =>
		[snapshotQueryKeyFactory.all, "detail", companyId, year, month] as const,
};

function usePeriod() {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export interface HitlDecisionInput {
	action: RoadmapMvpAction;
	decision: RoadmapDecisionType;
	reason: string;
}

export function useHitlDecision() {
	const queryClient = useQueryClient();
	const { companyContext } = useActiveCompanyContext();
	const { year, month } = usePeriod();

	const mutation = useMutation({
		mutationFn: async (
			input: HitlDecisionInput,
		): Promise<RoadmapMvpDecisionResult> => {
			const body = await unwrap(
				api.compliance["roadmap-mvp"].decisions.post({
					companyId: companyContext.companyId,
					year,
					month,
					actionId: input.action.id,
					traceId: input.action.traceId,
					decision: input.decision,
					reason: input.reason,
				} as never),
			);
			return extractOkData(
				body,
				"No se pudo registrar la decisión HITL",
			) as RoadmapMvpDecisionResult;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: snapshotQueryKeyFactory.detail(
					companyContext.companyId,
					year,
					month,
				),
			});
		},
	});

	return {
		decide: mutation.mutateAsync,
		lastResult: mutation.data ?? null,
		isDeciding: mutation.isPending,
		error: mutation.error,
		decidingActionId: mutation.variables?.action.id ?? null,
	};
}
