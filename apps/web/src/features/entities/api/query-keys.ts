export const entityKeys = {
  all: ['entities'] as const,
  list: (companyId: string) => [...entityKeys.all, companyId] as const,
} as const;
