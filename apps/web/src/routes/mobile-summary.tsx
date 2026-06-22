import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/mobile-summary')({
  component: lazyRouteComponent(() => import('../features/dashboard/components/MobileFinancialSummary'), 'MobileFinancialSummary'),
})
