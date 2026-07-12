import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/firm")({
	component: lazyRouteComponent(() => import("./firm.component")),
});
