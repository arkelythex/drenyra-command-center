import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/configuracion/notifications')({
  component: lazyRouteComponent(() => import('../../features/settings/components/NotificationsSettings'), 'NotificationsSettings'),
})
