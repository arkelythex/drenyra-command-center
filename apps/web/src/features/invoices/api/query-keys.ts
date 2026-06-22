export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'lists'] as const,
  list: (filters?: unknown) => [...invoiceKeys.lists(), filters ?? {}] as const,
  details: () => [...invoiceKeys.all, 'details'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
} as const;
