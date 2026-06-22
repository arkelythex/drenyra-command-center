import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/invoices')({
  loader: () => { throw redirect({ to: '/facturacion/invoices' }) },
})
