import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/operaciones/customers")({
	component: lazyRouteComponent(
		() => import("../../features/customers"),
		"CustomersView",
	),
});
