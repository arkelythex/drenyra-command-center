import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/firm/clients/$id")({
	component: lazyRouteComponent(
		() => import("../../features/firm/ClientDetail"),
		"ClientDetail",
	),
});
