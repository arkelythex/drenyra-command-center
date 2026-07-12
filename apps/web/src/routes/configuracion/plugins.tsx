import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracion/plugins")({
	component: lazyRouteComponent(
		() => import("../../features/plugins/components/PluginsView"),
		"PluginsView",
	),
});
