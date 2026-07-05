import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/connections")({
	component: lazyRouteComponent(
		() => import("../../features/connections/components/ConnectionsView"),
		"ConnectionsView",
	),
});
