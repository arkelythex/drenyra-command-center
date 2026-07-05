export const productKeys = {
	all: ["products"] as const,
	lists: () => [...productKeys.all, "lists"] as const,
	list: (companyId?: string) =>
		[...productKeys.lists(), companyId ?? "all"] as const,
	details: () => [...productKeys.all, "details"] as const,
	detail: (id: string) => [...productKeys.details(), id] as const,
} as const;
