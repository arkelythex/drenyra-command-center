import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/")({
	component: lazyRouteComponent(
		() => import("@/components/agentic/DrenyraFlexMain"),
		"DrenyraFlexMain",
	),
});
