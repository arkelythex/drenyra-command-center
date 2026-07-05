import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/organization")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/OrganizationSettings"),
		"OrganizationSettings",
	),
});
