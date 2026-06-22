import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/inventory')({
  loader: () => { throw redirect({ to: '/operaciones/inventory' }) },
})
