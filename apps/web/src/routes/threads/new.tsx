import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/threads/new")({
	component: lazyRouteComponent(() => import("./new.component")),
});
