import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

const CashflowBoard = lazyRouteComponent(() => import('../../features/cashflow'), 'CashflowBoard');

export const Route = createFileRoute('/tesoreria/cashflow')({
  component: () => (
    <div className="flex-1 h-full overflow-hidden">
      <CashflowBoard />
    </div>
  ),
});
