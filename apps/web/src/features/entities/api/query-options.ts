import { queryOptions } from '@tanstack/react-query'
import { customersApi } from '@/features/customers/api/customers.api'
import { vendorsApi } from '@/features/vendors/api/vendors.api'
import { entityKeys } from './query-keys'

export function entitiesListQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: entityKeys.list(companyId),
    queryFn: async () => {
      const [customersRes, vendorsRes] = await Promise.all([
        customersApi.list({ companyId }),
        vendorsApi.list({ companyId }),
      ])
      return { customers: customersRes, vendors: vendorsRes }
    },
  })
}
