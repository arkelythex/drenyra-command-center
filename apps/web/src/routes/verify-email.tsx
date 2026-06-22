import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/verify-email')({
  component: lazyRouteComponent(
    () => import('@/features/auth/components/VerifyEmailPage'),
    'VerifyEmailPage',
  ),
});
