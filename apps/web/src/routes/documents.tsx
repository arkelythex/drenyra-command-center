import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/documents')({
  loader: () => { throw redirect({ to: '/operaciones/documents' }) },
})
