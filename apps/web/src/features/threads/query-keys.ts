export const threadKeys = {
	all: ["threads"] as const,
	lists: () => [...threadKeys.all, "lists"] as const,
	list: (filters?: unknown) => [...threadKeys.lists(), filters ?? {}] as const,
	details: () => [...threadKeys.all, "details"] as const,
	detail: (id: string) => [...threadKeys.details(), id] as const,
	quickActions: (companyId: string, period?: string) =>
		[
			...threadKeys.all,
			"quick-actions",
			companyId,
			period ?? "current",
		] as const,
} as const;
