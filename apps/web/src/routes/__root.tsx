import {
	createRootRoute,
	Outlet,
	useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AgenticLayout = lazy(() =>
	import("../components/agentic-shell/AgenticLayout/AgenticLayout").then(
		(m) => ({ default: m.AgenticLayout }),
	),
);

/**
 * Routes that bypass the command-center shell.
 * These are auth pages, onboarding, and password flows.
 */
const PUBLIC_ROUTE_PREFIXES = [
	"/login",
	"/signup",
	"/forgot-password",
	"/reset-password",
	"/verify-email",
	"/auth",
	"/onboarding",
];

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const matches = useRouterState({ select: (s) => s.matches });
	const currentRouteId = matches[matches.length - 1]?.routeId ?? "";

	const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) =>
		currentRouteId.startsWith(prefix),
	);

	if (isPublicRoute) {
		return <Outlet />;
	}

	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					Loading...
				</div>
			}
		>
			<AgenticLayout>
				<Outlet />
			</AgenticLayout>
		</Suspense>
	);
}
