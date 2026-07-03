import { queryOptions } from "@tanstack/react-query";
import { diffKeys } from "./query-keys";
import { listDiffs, getDiff } from "./diffs.api";
import type { DiffFilters } from "./diffs.types";

export function diffsListQueryOptions(filters?: DiffFilters) {
	return queryOptions({
		queryKey: diffKeys.list(filters),
		queryFn: () => listDiffs(filters),
	});
}

export function diffDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: diffKeys.detail(id),
		queryFn: () => getDiff(id),
	});
}
