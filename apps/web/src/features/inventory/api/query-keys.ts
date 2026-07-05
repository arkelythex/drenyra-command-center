export const inventoryKeys = {
	all: ["inventory"] as const,
	summary: (companyId: string) =>
		[...inventoryKeys.all, "summary", companyId] as const,
	alerts: (companyId: string) =>
		[...inventoryKeys.all, "alerts", companyId] as const,
	list: (companyId: string) =>
		[...inventoryKeys.all, "list", companyId] as const,
} as const;
