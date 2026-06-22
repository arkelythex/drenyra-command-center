import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/cumplimiento/expedientes")({
	component: lazyRouteComponent(
		() => import("../../features/expedientes/ExpedientesPage"),
		"ExpedientesPage",
	),
});
