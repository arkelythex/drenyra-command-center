import type { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { RouteError } from "./components/route-states/RouteError";
import { RouteNotFound } from "./components/route-states/RouteNotFound";
import { routeTree } from "./routeTree.gen";

export interface RouterContext {
	queryClient: QueryClient;
}

export function createRouter(context: RouterContext) {
	return createTanStackRouter({
		routeTree,
		context,
		defaultPreload: "intent",
		defaultPreloadDelay: 20,
		defaultViewTransition: false,
		defaultErrorComponent: RouteError,
		defaultNotFoundComponent: RouteNotFound,
	});
}
