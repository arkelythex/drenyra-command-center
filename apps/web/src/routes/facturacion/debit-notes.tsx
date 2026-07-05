import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import type { DebitNoteListFilters } from "../../features/debit-notes";

export const Route = createFileRoute("/facturacion/debit-notes")({
	validateSearch: (
		search: Record<string, unknown>,
	): Partial<DebitNoteListFilters> => {
		const filters: Partial<DebitNoteListFilters> = {};

		if (typeof search.search === "string") filters.search = search.search;
		if (typeof search.status === "string") filters.status = search.status;
		if (typeof search.referenceInvoiceId === "string")
			filters.referenceInvoiceId = search.referenceInvoiceId;
		if (typeof search.startDate === "string")
			filters.startDate = search.startDate;
		if (typeof search.endDate === "string") filters.endDate = search.endDate;

		return filters;
	},
	component: lazyRouteComponent(
		() => import("../../features/debit-notes"),
		"DebitNotesList",
	),
});
