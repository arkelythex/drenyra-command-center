import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/connections')({
  loader: () => { throw redirect({ to: '/configuracion/connections' }) },
})
