import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/billing")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/BillingSettings"),
		"BillingSettings",
	),
});
