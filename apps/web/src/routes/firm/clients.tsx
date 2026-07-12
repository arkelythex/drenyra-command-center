import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/firm/clients")({
	component: lazyRouteComponent(
		() => import("../../features/firm/ClientList"),
		"ClientList",
	),
});
