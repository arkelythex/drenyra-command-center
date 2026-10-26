import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/appearance")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/AppearanceSettings"),
		"AppearanceSettings",
	),
});
