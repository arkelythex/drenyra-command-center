import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/security")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/SecuritySettings"),
		"SecuritySettings",
	),
});
