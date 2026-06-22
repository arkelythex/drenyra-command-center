import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/playground')({
  component: lazyRouteComponent(() => import('../features/playground'), 'PlaygroundView'),
})
