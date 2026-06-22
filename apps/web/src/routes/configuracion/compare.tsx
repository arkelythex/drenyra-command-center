import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

const CompareLoansView = lazyRouteComponent(() => import('../../features/compare/components/CompareLoansView'), 'CompareLoansView')

export const Route = createFileRoute('/configuracion/compare')({
  component: () => (
    <div className="flex-1 overflow-y-auto h-full">
      <CompareLoansView />
    </div>
  ),
})
