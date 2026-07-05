import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/operaciones/vendors")({
	component: lazyRouteComponent(
		() => import("../../features/vendors/components/VendorsView"),
		"VendorsView",
	),
});
