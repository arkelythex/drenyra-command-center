import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/cumplimiento/review')({
  component: lazyRouteComponent(() => import('../../features/review'), 'ReviewCockpitPage'),
});
