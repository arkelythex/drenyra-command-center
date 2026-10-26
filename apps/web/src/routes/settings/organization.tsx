import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/organization")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/OrganizationSettings"),
		"OrganizationSettings",
	),
});
