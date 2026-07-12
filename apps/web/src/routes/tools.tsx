import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/tools")({
	component: lazyRouteComponent(() => import("./tools.component")),
});
