import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/customers')({
  loader: () => { throw redirect({ to: '/operaciones/customers' }) },
})
