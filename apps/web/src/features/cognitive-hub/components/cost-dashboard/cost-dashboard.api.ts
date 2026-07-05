import { api } from "@/lib/api";
import { extractOkDataOrPassthrough, unwrap } from "@/lib/api-helpers";
import type { CostSummaryResponse, RecentEvent } from "./cost-dashboard.types";

export async function fetchCostStats(
	organizationId?: number,
): Promise<CostSummaryResponse> {
	const response = await unwrap(
		api.api["ai-swarm"]["cost-stats"].get({
			query:
				organizationId !== undefined
					? { orgId: String(organizationId) }
					: undefined,
		}),
	);
	return extractOkDataOrPassthrough(
		response,
		"cost-stats",
	) as CostSummaryResponse;
}

export async function fetchRecentEvents(
	organizationId?: number,
): Promise<RecentEvent[]> {
	const response = await unwrap(
		api.api["ai-swarm"]["cost-stats"].recent.get({
			query: {
				limit: "15",
				...(organizationId !== undefined
					? { orgId: String(organizationId) }
					: {}),
			},
		}),
	);
	return extractOkDataOrPassthrough(
		response,
		"cost-stats/recent",
	) as RecentEvent[];
}
