import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const AgenticShell = lazyRouteComponent(
	() => import("../components/agentic-shell/AgenticLayout/AgenticLayout"),
	"AgenticLayout",
);

export const Route = createFileRoute("/drenyra")({
	component: AgenticShell,
});
