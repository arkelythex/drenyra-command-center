import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/organization')({
  loader: () => { throw redirect({ to: '/configuracion/organization' }) },
})
