import { queryOptions } from "@tanstack/react-query";
import { agentKeys } from "./query-keys";
import * as agentsApi from "./agents.api";
import type { AgentFilters } from "./agents.types";

export function agentsListQueryOptions(filters?: AgentFilters) {
	return queryOptions({
		queryKey: agentKeys.list(filters as Record<string, unknown> | undefined),
		queryFn: () => agentsApi.listSessions(filters),
		refetchInterval: 5_000,
		retry: (failureCount) => {
			if (failureCount >= 3) return false;
			return true;
		},
		retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 10_000),
		staleTime: 0,
	});
}

export function agentDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: agentKeys.detail(id),
		queryFn: () => agentsApi.getSession(id),
	});
}
