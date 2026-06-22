import { queryOptions } from '@tanstack/react-query'
import { complianceApi } from './compliance.api'
import { complianceKeys } from './query-keys'

export function roadmapMvpSnapshotQueryOptions(
  companyId: string,
  year: number,
  month: number,
) {
  return queryOptions({
    queryKey: complianceKeys.roadmap(companyId, year, month),
    queryFn: () => complianceApi.getRoadmapMvpSnapshot(companyId, year, month),
    staleTime: 30_000,
  })
}

export function roadmapTimelineQueryOptions(actionId: string, traceId: string) {
  return queryOptions({
    queryKey: complianceKeys.roadmapTimeline(actionId, traceId),
    queryFn: () => complianceApi.getRoadmapTimeline(actionId, traceId),
  })
}

export function sireDemoSummaryQueryOptions(companyId: string, period: string) {
  return queryOptions({
    queryKey: complianceKeys.sireDemoSummary(companyId, period),
    queryFn: () => complianceApi.getSireDemoSummary(companyId, period),
    staleTime: 60_000,
  })
}

export function accountingJobsCatalogQueryOptions(countryCode?: string | null) {
  return queryOptions({
    queryKey: complianceKeys.accountingJobsCatalog(countryCode),
    queryFn: () => complianceApi.getAccountingJobsCatalog(countryCode),
    staleTime: 5 * 60_000,
  })
}

export function countryPackCatalogQueryOptions() {
  return queryOptions({
    queryKey: complianceKeys.countryPackCatalog(),
    queryFn: () => complianceApi.getCountryPackCatalog(),
    staleTime: 5 * 60_000,
  })
}

export function accountingJobRunsQueryOptions(query: {
  companyId: string
  countryCode?: string
  status?: string
  limit?: number
}) {
  return queryOptions({
    queryKey: complianceKeys.accountingJobRuns(query.companyId),
    queryFn: () => complianceApi.listAccountingJobRuns(query),
    staleTime: 15_000,
  })
}
