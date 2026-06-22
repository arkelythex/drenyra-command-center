import { queryOptions } from '@tanstack/react-query'
import { customersApi, type CustomerListFilters } from './customers.api'
import { customerKeys } from './query-keys'

export function customersListQueryOptions(filters: CustomerListFilters) {
  return queryOptions({
    queryKey: customerKeys.list(filters.companyId),
    queryFn: () => customersApi.list(filters),
  })
}

export function customerDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getById(id),
  })
}
