import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { getTenantContext } from '../../lib/api'

export const Route = createFileRoute('/tesoreria/banking')({
  loader: async ({ context }) => {
    const { companyId } = getTenantContext()
    if (!companyId) return

    const { bankingAccountsQueryOptions, bankingTransactionsQueryOptions } =
      await import('../../features/banking/api/query-options')

    const accounts = await context.queryClient.ensureQueryData(
      bankingAccountsQueryOptions(companyId),
    )
    const defaultAccountId = accounts.find((account) => account.isDefault)?.id ?? accounts[0]?.id

    if (defaultAccountId) {
      await context.queryClient.ensureQueryData(
        bankingTransactionsQueryOptions(defaultAccountId),
      )
    }
  },
  component: lazyRouteComponent(() => import('../../features/banking/components/BankingView'), 'BankingView'),
})
