import { queryOptions } from "@tanstack/react-query";
import { getDiff, listDiffs } from "./diffs.api";
import type { DiffFilters } from "./diffs.types";
import { diffKeys } from "./query-keys";

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
