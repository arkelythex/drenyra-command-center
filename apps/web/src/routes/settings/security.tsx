import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/security")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/SecuritySettings"),
		"SecuritySettings",
	),
});
