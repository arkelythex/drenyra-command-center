import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/herramientas")({
	component: lazyRouteComponent(
		() => import("../../features/plugins/components/PluginsView"),
		"PluginsView",
	),
});
