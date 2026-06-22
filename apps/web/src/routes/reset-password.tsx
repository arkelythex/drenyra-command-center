import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/reset-password')({
  component: lazyRouteComponent(
    () => import('@/features/auth/components/ResetPasswordForm'),
    'ResetPasswordForm',
  ),
});
