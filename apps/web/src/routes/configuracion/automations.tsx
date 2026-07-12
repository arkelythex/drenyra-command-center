import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/automations")({
	component: lazyRouteComponent(
		() => import("../../features/automations/components/AutomationsView"),
		"AutomationsView",
	),
});
