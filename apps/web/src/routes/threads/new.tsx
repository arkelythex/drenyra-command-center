import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/threads/new")({
	component: lazyRouteComponent(
		() => import("../../features/drenyra-command-center"),
		"DrenyraCommandCenter",
	),
});
