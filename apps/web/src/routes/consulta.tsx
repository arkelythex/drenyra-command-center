import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/consulta")({
	component: lazyRouteComponent(
		() => import("../features/consulta/ConsultaPage"),
		"ConsultaPage",
	),
});
