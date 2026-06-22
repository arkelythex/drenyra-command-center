import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/inbox')({
  loader: () => { throw redirect({ to: '/operaciones/inbox' }) },
})
