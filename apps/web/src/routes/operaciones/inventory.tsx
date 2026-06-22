import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/operaciones/inventory')({
  component: lazyRouteComponent(() => import('../../features/inventory'), 'InventoryView'),
})
