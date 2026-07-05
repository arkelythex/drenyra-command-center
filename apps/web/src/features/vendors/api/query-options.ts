import { queryOptions } from "@tanstack/react-query";
import { vendorKeys } from "./query-keys";
import { type VendorListFilters, vendorsApi } from "./vendors.api";

export function vendorsListQueryOptions(filters: VendorListFilters) {
	return queryOptions({
		queryKey: vendorKeys.list(filters.companyId),
		queryFn: () => vendorsApi.list(filters),
	});
}

export function vendorDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: vendorKeys.detail(id),
		queryFn: () => vendorsApi.getById(id),
	});
}
