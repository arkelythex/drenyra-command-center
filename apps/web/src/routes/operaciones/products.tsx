import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/operaciones/products")({
	component: lazyRouteComponent(
		() => import("../../features/products"),
		"ProductsView",
	),
});
