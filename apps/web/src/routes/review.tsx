import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/review')({
  loader: () => { throw redirect({ to: '/cumplimiento/review' }) },
})
