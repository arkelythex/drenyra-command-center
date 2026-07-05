import { queryOptions } from "@tanstack/react-query";
import { type CustomerListFilters, customersApi } from "./customers.api";
import { customerKeys } from "./query-keys";

export function customersListQueryOptions(filters: CustomerListFilters) {
	return queryOptions({
		queryKey: customerKeys.list(filters.companyId),
		queryFn: () => customersApi.list(filters),
	});
}

export function customerDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: customerKeys.detail(id),
		queryFn: () => customersApi.getById(id),
	});
}
