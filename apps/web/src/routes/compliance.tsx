import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/compliance')({
  loader: () => { throw redirect({ to: '/cumplimiento/compliance' }) },
})
