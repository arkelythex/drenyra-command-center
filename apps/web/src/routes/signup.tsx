import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/signup')({
  component: lazyRouteComponent(
    () => import('../features/auth/components/SignupForm'),
    'SignupForm',
  ),
});
