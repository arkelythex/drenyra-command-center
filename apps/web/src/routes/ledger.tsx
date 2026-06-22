import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/ledger')({
  loader: () => { throw redirect({ to: '/contabilidad/ledger' }) },
})
