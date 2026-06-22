export const dashboardKeys = {
  all: ['dashboard'] as const,
  overviews: () => [...dashboardKeys.all, 'overview'] as const,
  overview: (companyId: string) => [...dashboardKeys.overviews(), companyId] as const,
  summaries: () => [...dashboardKeys.all, 'summary'] as const,
  summary: (companyId: string) =>
    [...dashboardKeys.summaries(), companyId] as const,
  income: (companyId: string) => [...dashboardKeys.all, 'income', companyId] as const,
  expenses: (companyId: string) => [...dashboardKeys.all, 'expenses', companyId] as const,
  recentTransactions: (companyId: string, limit: number) =>
    [...dashboardKeys.all, 'transactions', 'recent', companyId, limit] as const,
  fiscalIndicators: () => [...dashboardKeys.all, 'fiscal-indicators'] as const,
};
