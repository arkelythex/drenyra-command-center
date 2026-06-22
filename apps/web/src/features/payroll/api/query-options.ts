import { queryOptions } from '@tanstack/react-query'
import { safeApiCall } from '@/lib/api-factory'
import { unwrap } from '@/lib/api-helpers'
import { payrollTreatyClient } from './payroll-treaty-client'
import { payrollKeys } from './query-keys'

export function employeesQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: payrollKeys.employees(companyId),
    queryFn: async () => {
      const result = await safeApiCall(async () => {
        return unwrap(payrollTreatyClient.employees.get({ query: { companyId } }))
      })
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
  })
}

export function calculatePayrollQueryOptions(employeeId: string, period: string) {
  return queryOptions({
    queryKey: payrollKeys.calculate(employeeId, period),
    queryFn: async () => {
      const result = await safeApiCall(async () => {
        return unwrap(payrollTreatyClient.calculate({ employeeId }).get({ query: { period } }))
      })
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
  })
}
