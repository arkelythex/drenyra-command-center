import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/assets')({
  loader: () => { throw redirect({ to: '/contabilidad/assets' }) },
})
