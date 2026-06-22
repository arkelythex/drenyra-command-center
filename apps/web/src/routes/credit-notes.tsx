import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/credit-notes')({
  loader: () => { throw redirect({ to: '/facturacion/credit-notes' }) },
})
