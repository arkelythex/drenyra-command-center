import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/automations')({
  loader: () => { throw redirect({ to: '/configuracion/automations' }) },
})
