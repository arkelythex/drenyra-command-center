import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/security')({
  loader: () => { throw redirect({ to: '/configuracion/security' }) },
})
