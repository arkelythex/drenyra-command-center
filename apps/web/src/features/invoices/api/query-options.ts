import { queryOptions } from "@tanstack/react-query";
import { type InvoiceListFilters, invoicingApi } from "./invoicing.api";
import { invoiceKeys } from "./query-keys";

export function invoicesListQueryOptions(filters: InvoiceListFilters) {
	return queryOptions({
		queryKey: invoiceKeys.list(filters),
		queryFn: () => invoicingApi.list(filters),
	});
}

export function invoiceDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: invoiceKeys.detail(id),
		queryFn: () => invoicingApi.getById(id),
	});
}
