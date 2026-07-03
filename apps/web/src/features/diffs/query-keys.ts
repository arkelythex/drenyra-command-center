export const diffKeys = {
	all: ["diffs"] as const,
	lists: () => [...diffKeys.all, "lists"] as const,
	list: (filters?: unknown) => [...diffKeys.lists(), filters ?? {}] as const,
	details: () => [...diffKeys.all, "details"] as const,
	detail: (id: string) => [...diffKeys.details(), id] as const,
};
