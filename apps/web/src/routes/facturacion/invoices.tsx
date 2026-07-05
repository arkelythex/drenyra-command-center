import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import type { InvoiceFilters } from "../../features/invoices";

export const Route = createFileRoute("/facturacion/invoices")({
	validateSearch: (search: Record<string, unknown>): InvoiceFilters => {
		const filters: InvoiceFilters = {};

		if (typeof search.search === "string") filters.search = search.search;
		if (typeof search.customerId === "string")
			filters.customerId = search.customerId;
		if (typeof search.startDate === "string")
			filters.startDate = new Date(search.startDate);
		if (typeof search.endDate === "string")
			filters.endDate = new Date(search.endDate);
		if (typeof search.minAmount === "string")
			filters.minAmount = parseFloat(search.minAmount);
		if (typeof search.maxAmount === "string")
			filters.maxAmount = parseFloat(search.maxAmount);
		if (typeof search.currency === "string") filters.currency = search.currency;
		if (typeof search.status === "string")
			filters.status = search.status.split(",");

		return filters;
	},
	component: lazyRouteComponent(
		() => import("../../features/invoices"),
		"InvoicesBoard",
	),
});
