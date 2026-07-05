import type { InboxQueryFilters } from "./inbox.types";

export const inboxKeys = {
	all: ["inbox"] as const,
	lists: () => [...inboxKeys.all, "lists"] as const,
	byCompany: (companyId: string) => [...inboxKeys.lists(), companyId] as const,
	list: (companyId: string, filters?: Omit<InboxQueryFilters, "companyId">) =>
		[...inboxKeys.byCompany(companyId), filters ?? {}] as const,
	transactions: (
		companyId: string,
		filters?: Omit<InboxQueryFilters, "companyId">,
	) => inboxKeys.list(companyId, filters),
};
