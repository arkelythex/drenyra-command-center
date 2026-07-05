import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/billing")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/BillingSettings"),
		"BillingSettings",
	),
});
