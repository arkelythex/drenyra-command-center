import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/agents")({
	component: lazyRouteComponent(() => import("./agents.component")),
});
