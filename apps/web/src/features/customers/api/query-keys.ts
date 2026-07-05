export const customerKeys = {
	all: ["customers"] as const,
	list: (companyId: string) => [...customerKeys.all, companyId] as const,
	details: () => [...customerKeys.all, "details"] as const,
	detail: (id: string) => [...customerKeys.details(), id] as const,
} as const;
