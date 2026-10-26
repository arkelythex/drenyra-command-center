import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/tool-permissions")({
	component: lazyRouteComponent(
		() => import("../../features/settings/components/ToolPermissionsSettings"),
		"ToolPermissionsSettings",
	),
});
