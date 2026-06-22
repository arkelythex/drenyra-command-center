import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/integrations')({
  loader: () => { throw redirect({ to: '/configuracion/integrations' }) },
})
