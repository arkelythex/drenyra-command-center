export const billKeys = {
  all: ['bills'] as const,
  lists: () => [...billKeys.all, 'lists'] as const,
  list: (companyId: string) => [...billKeys.lists(), companyId] as const,
  details: () => [...billKeys.all, 'details'] as const,
  detail: (id: string) => [...billKeys.details(), id] as const,
  vendors: (companyId: string) => [...billKeys.all, 'vendors', companyId] as const,
} as const;
