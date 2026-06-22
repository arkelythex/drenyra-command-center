export const cashflowKeys = {
  all: ['cashflow'] as const,
  projection: (companyId: string, days: number, currency: string) =>
    [...cashflowKeys.all, 'projection', companyId, String(days), currency] as const,
  actual: (companyId: string, startDate: string, endDate: string, currency: string) =>
    [...cashflowKeys.all, 'actual', companyId, startDate, endDate, currency] as const,
  forecast: (companyId: string, months: number, currency: string) =>
    [...cashflowKeys.all, 'forecast', companyId, String(months), currency] as const,
  variance: (companyId: string, startDate: string, endDate: string, currency: string) =>
    [...cashflowKeys.all, 'variance', companyId, startDate, endDate, currency] as const,
} as const;
