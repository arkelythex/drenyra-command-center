export const agentKeys = {
	all: ["agents"] as const,
	lists: () => [...agentKeys.all, "lists"] as const,
	list: (filters?: Record<string, unknown>) =>
		[...agentKeys.lists(), filters ?? {}] as const,
	details: () => [...agentKeys.all, "details"] as const,
	detail: (id: string) => [...agentKeys.details(), id] as const,
};
