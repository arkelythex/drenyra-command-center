import { queryOptions } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { safeApiCall } from '@/lib/api-factory'
import { extractOkDataOrPassthrough, unwrap } from '@/lib/api-helpers'
import { ledgerKeys } from './query-keys'

function tenantHeaders(companyId: string): Record<string, string> {
  return { 'X-Company-Id': companyId }
}

export function chartOfAccountsQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: ledgerKeys.accounts(companyId),
    enabled: companyId.length > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
    queryFn: async () => {
      const result = await safeApiCall(async () => {
        const body = await unwrap(
          api.ledger.accounts.get({ headers: tenantHeaders(companyId) }),
        )
        return extractOkDataOrPassthrough(body, 'No se pudo cargar el plan de cuentas')
      })
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
  })
}

export function generalLedgerQueryOptions(
  companyId: string,
  startDate: Date,
  endDate: Date,
  startKey: string,
  endKey: string,
) {
  return queryOptions({
    queryKey: ledgerKeys.general(companyId, startKey, endKey),
    enabled: companyId.length > 0,
    staleTime: 45_000,
    gcTime: 5 * 60_000,
    retry: 2,
    queryFn: async () => {
      const result = await safeApiCall(async () => {
        const body = await unwrap(
          api.ledger.general.get({
            query: {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
            headers: tenantHeaders(companyId),
          }),
        )
        return extractOkDataOrPassthrough(body, 'No se pudo cargar el mayor general')
      })
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
  })
}

export function trialBalanceQueryOptions(companyId: string, asOfDate: Date, asOfKey: string) {
  return queryOptions({
    queryKey: ledgerKeys.trialBalance(companyId, asOfKey),
    enabled: companyId.length > 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
    queryFn: async () => {
      const result = await safeApiCall(async () => {
        const body = await unwrap(
          api.ledger['trial-balance'].get({
            query: { asOfDate: asOfDate.toISOString() },
            headers: tenantHeaders(companyId),
          }),
        )
        return extractOkDataOrPassthrough(body, 'No se pudo cargar la balanza de comprobación')
      })
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
  })
}
