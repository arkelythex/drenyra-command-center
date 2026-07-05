import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/contabilidad/assets")({
	component: lazyRouteComponent(
		() => import("../../features/assets/components/AssetsView"),
		"AssetsView",
	),
});
