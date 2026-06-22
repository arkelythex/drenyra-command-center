export const complianceKeys = {
  all: ['compliance'] as const,
  roadmap: (companyId: string, year: number, month: number) =>
    [...complianceKeys.all, 'roadmap', companyId, String(year), String(month)] as const,
  roadmapAction: (actionId: string, traceId: string) =>
    [...complianceKeys.all, 'roadmap-action', actionId, traceId] as const,
  roadmapTimeline: (actionId: string, traceId: string) =>
    [...complianceKeys.all, 'roadmap-timeline', actionId, traceId] as const,
  sireDemoSummary: (companyId: string, period: string) =>
    [...complianceKeys.all, 'sire-demo', companyId, period] as const,
  accountingJobsCatalog: (countryCode?: string | null) =>
    [...complianceKeys.all, 'accounting-jobs', countryCode ?? 'all'] as const,
  countryPackCatalog: () =>
    [...complianceKeys.all, 'country-packs'] as const,
  accountingJobRuns: (companyId: string) =>
    [...complianceKeys.all, 'job-runs', companyId] as const,
} as const;
