import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/operaciones/inbox')({
  component: lazyRouteComponent(() => import('../../features/inbox/pages'), 'InboxPage'),
})
