import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/cumplimiento/audit')({
  component: lazyRouteComponent(() => import('../../features/audit/components/AuditView'), 'AuditView'),
})
