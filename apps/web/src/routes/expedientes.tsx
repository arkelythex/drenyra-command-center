import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/expedientes')({
  loader: () => { throw redirect({ to: '/cumplimiento/expedientes' }) },
})
