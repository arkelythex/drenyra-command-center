/**
 * useTimeline — Fetches the stitched recommendation→decision→effect timeline (S4).
 *
 * Responsibilities:
 * - Fetch the full event timeline for a given traceId.
 * - Track which traceId is currently selected (open/closed state).
 *
 * Single-responsibility: only handles timeline data fetching.
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type { RoadmapTimeline } from "../components/shared/types";

const queryKeyFactory = {
	all: ["roadmap-mvp"] as const,
	timeline: (companyId: string, year: number, month: number, traceId: string) =>
		[queryKeyFactory.all, "timeline", companyId, year, month, traceId] as const,
};

function usePeriod() {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function useTimeline() {
	const { companyContext } = useActiveCompanyContext();
	const { year, month } = usePeriod();

	const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

	const query = useQuery({
		queryKey: queryKeyFactory.timeline(
			companyContext.companyId,
			year,
			month,
			selectedTraceId ?? "",
		),
		queryFn: async (): Promise<RoadmapTimeline | null> => {
			if (!selectedTraceId) return null;

			// The backend requires the actionId, but the frontend tracks by traceId.
			// We derive it from the query — the service handles the lookup.
			const body = await unwrap(
				api.compliance["roadmap-mvp"]
					.timeline({ actionId: "prepare-sire" })
					.get({
						query: {
							companyId: companyContext.companyId,
							year,
							month,
							traceId: selectedTraceId,
						},
					} as never),
			);
			return extractOkData(
				body,
				"No se pudo cargar el timeline de la acción",
			) as RoadmapTimeline;
		},
		enabled: selectedTraceId !== null,
		staleTime: 30_000,
	});

	const open = useCallback((traceId: string) => {
		setSelectedTraceId(traceId);
	}, []);

	const close = useCallback(() => {
		setSelectedTraceId(null);
	}, []);

	return {
		timeline: query.data,
		isLoading: query.isLoading,
		isError: query.isError,
		selectedTraceId,
		openTimeline: open,
		closeTimeline: close,
	};
}
