import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import type { CreditNoteListFilters } from "../../features/credit-notes";

export const Route = createFileRoute("/facturacion/credit-notes")({
	validateSearch: (
		search: Record<string, unknown>,
	): Partial<CreditNoteListFilters> => {
		const filters: Partial<CreditNoteListFilters> = {};

		if (typeof search.search === "string") filters.search = search.search;
		if (typeof search.creditNoteType === "string")
			filters.creditNoteType = search.creditNoteType;
		if (typeof search.status === "string") filters.status = search.status;
		if (typeof search.referenceInvoiceId === "string")
			filters.referenceInvoiceId = search.referenceInvoiceId;
		if (typeof search.startDate === "string")
			filters.startDate = search.startDate;
		if (typeof search.endDate === "string") filters.endDate = search.endDate;

		return filters;
	},
	component: lazyRouteComponent(
		() => import("../../features/credit-notes"),
		"CreditNotesList",
	),
});
