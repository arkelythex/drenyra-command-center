import { queryOptions } from "@tanstack/react-query";
import { billsApi } from "./bills.api";
import { billKeys } from "./query-keys";

export function billsListQueryOptions(params: {
	companyId: string;
	status?: string;
	vendorId?: string;
	limit?: number;
	offset?: number;
}) {
	return queryOptions({
		queryKey: billKeys.list(params.companyId),
		queryFn: () => billsApi.list(params),
	});
}

export function billDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: billKeys.detail(id),
		queryFn: () => billsApi.getById(id),
	});
}

export function billVendorsQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: billKeys.vendors(companyId),
		queryFn: () => billsApi.listVendors(companyId),
	});
}
