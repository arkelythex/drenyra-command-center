import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/cumplimiento/sire-diff")({
	component: lazyRouteComponent(
		() => import("../../features/sire/SireDiffPage"),
		"SireDiffPage",
	),
});
