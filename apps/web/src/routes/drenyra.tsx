import { Outlet, createFileRoute } from "@tanstack/react-router";

/**
 * Layout parent for /drenyra child routes.
 * AgenticLayout is now provided by __root.tsx for all non-public routes.
 */
export const Route = createFileRoute("/drenyra")({
	component: () => <Outlet />,
});
