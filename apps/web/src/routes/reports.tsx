import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/reports')({
  loader: () => { throw redirect({ to: '/contabilidad/reports' }) },
})
