import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/case/$threadId")({
	component: lazyRouteComponent(() => import("./case.$threadId.component")),
});
