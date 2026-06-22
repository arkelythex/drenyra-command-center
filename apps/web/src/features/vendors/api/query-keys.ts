export const vendorKeys = {
  all: ['vendors'] as const,
  list: (companyId: string) => [...vendorKeys.all, companyId] as const,
  details: () => [...vendorKeys.all, 'details'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
} as const;
