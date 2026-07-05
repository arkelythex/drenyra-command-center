import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/hub")({
	component: lazyRouteComponent(
		() => import("@/features/cognitive-hub/components/HubContent"),
		"HubContent",
	),
});
