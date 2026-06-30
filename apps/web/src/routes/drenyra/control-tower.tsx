import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/control-tower")({
	component: lazyRouteComponent(
		() => import("../../features/control-tower/ControlTowerPage"),
		"ControlTowerPage",
	),
});
