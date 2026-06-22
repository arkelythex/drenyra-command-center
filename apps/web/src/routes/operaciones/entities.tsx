import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/operaciones/entities')({
  component: lazyRouteComponent(() => import('../../features/entities/components/EntitiesView'), 'EntitiesView'),
})
