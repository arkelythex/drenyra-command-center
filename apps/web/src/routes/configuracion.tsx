import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion")({
	component: lazyRouteComponent(() => import("./configuracion.component")),
});
