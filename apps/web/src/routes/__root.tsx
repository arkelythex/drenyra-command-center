import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router";
import { FiscalInspectorProvider } from "@/context/FiscalInspectorContext";
import { isPublicRoute } from "@/lib/router/public-routes";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const pathname = useLocation({
		select: (location) => location.pathname,
	});

	if (isPublicRoute(pathname)) {
		return <Outlet />;
	}

	return (
		<FiscalInspectorProvider>
			<Outlet />
		</FiscalInspectorProvider>
	);
}
