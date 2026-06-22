import { queryOptions } from '@tanstack/react-query'
import { productsApi } from './products.api'
import { productKeys } from './query-keys'

export function productsListQueryOptions(companyId?: string) {
  return queryOptions({
    queryKey: productKeys.list(companyId),
    queryFn: () => productsApi.list({ companyId }),
  })
}

export function productDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => productsApi.getById(id),
  })
}
