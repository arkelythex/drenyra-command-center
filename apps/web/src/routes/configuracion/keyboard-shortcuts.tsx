import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/configuracion/keyboard-shortcuts')({
  component: lazyRouteComponent(() => import('../../features/settings/components/keyboard-page'), 'KeyboardPage'),
})
