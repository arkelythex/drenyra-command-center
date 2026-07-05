import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/product-surfaces")({
	component: lazyRouteComponent(
		() => import("../../features/product-surfaces"),
		"ProductSurfacesView",
	),
});
