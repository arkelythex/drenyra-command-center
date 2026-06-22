import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import {
	DefaultPendingRoute,
	DefaultRouteError,
} from './lib/router/router-fallbacks'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

export function createRouter(context: RouterContext) {
  const router = createTanStackRouter({
    routeTree,
    context,
    defaultPreload: 'intent',
    // Keep route module preloads eager for smoother section switches.
    defaultPreloadDelay: 20,
    defaultViewTransition: false,
    defaultPendingComponent: DefaultPendingRoute,
    defaultNotFoundComponent: () => <div>Global Not Found</div>,
    defaultErrorComponent: ({ error }) => <DefaultRouteError error={error} />,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
