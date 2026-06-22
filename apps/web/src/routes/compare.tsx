import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/compare')({
  loader: () => { throw redirect({ to: '/configuracion/compare' }) },
})
