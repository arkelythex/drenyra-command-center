import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/automatizaciones")({
	component: lazyRouteComponent(
		() => import("../../features/automations/components/AutomationsView"),
		"AutomationsView",
	),
});
