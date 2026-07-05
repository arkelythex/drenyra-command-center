export const debitNoteKeys = {
	all: ["debit-notes"] as const,
	lists: () => [...debitNoteKeys.all, "lists"] as const,
	list: (companyId: string) => [...debitNoteKeys.lists(), companyId] as const,
	details: () => [...debitNoteKeys.all, "details"] as const,
	detail: (id: string) => [...debitNoteKeys.details(), id] as const,
	summary: (companyId: string) =>
		[...debitNoteKeys.all, "summary", companyId] as const,
};
