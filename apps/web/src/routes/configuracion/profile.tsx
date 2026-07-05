import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/profile")({
	component: lazyRouteComponent(
		() => import("../../features/profile/components/ProfileView"),
		"ProfileView",
	),
});
