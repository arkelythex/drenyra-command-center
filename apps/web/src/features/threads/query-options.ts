import { queryOptions } from "@tanstack/react-query";
import { threadKeys } from "./query-keys";
import * as threadsApi from "./threads.api";
import type { ThreadFilters } from "./threads.types";

export function threadsListQueryOptions(filters?: ThreadFilters) {
	return queryOptions({
		queryKey: threadKeys.list(filters),
		queryFn: () => threadsApi.listThreads(filters),
	});
}

export function threadDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: threadKeys.detail(id),
		queryFn: () => threadsApi.getThread(id),
	});
}

export function quickActionsQueryOptions(companyId: string, period?: string) {
	return queryOptions({
		queryKey: threadKeys.quickActions(companyId, period),
		queryFn: () => threadsApi.getQuickActions(companyId, period),
	});
}
