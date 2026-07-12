import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/centro-de-operaciones")({
	component: lazyRouteComponent(
		() => import("../../features/control-tower/ControlTowerPage"),
		"CentroDeOperacionesPage",
	),
});
