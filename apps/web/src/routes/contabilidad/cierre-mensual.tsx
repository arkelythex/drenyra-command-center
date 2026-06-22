import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contabilidad/cierre-mensual")({
	component: lazyRouteComponent(
		() => import("../../features/cierre-mensual/CierreMensualPage"),
		"CierreMensualPage",
	),
});
