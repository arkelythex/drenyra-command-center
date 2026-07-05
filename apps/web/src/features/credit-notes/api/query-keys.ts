export const creditNoteKeys = {
	all: ["credit-notes"] as const,
	lists: () => [...creditNoteKeys.all, "lists"] as const,
	list: (companyId: string) => [...creditNoteKeys.lists(), companyId] as const,
	details: () => [...creditNoteKeys.all, "details"] as const,
	detail: (id: string) => [...creditNoteKeys.details(), id] as const,
	summary: (companyId: string) =>
		[...creditNoteKeys.all, "summary", companyId] as const,
};
