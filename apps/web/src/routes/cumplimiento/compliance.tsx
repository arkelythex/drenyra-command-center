import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { getTenantContext } from '../../lib/api';

export const Route = createFileRoute('/cumplimiento/compliance')({
  loader: async ({ context }) => {
    const { companyId } = getTenantContext();
    if (!companyId) return;

    const { complianceOverviewQueryOptions } = await import('../../features/compliance/compliance.query');

    await context.queryClient.ensureQueryData(complianceOverviewQueryOptions(companyId));
  },
  component: lazyRouteComponent(() => import('../../features/compliance'), 'ComplianceView'),
});
