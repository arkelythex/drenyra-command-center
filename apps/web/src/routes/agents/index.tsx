import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const AgentsWindowPage = lazyRouteComponent(
	() => import("@/features/agents-window/components/AgentsWindowPage"),
	"AgentsWindowPage",
);

export const Route = createFileRoute("/agents/")({
	component: AgentsWindowPage,
});
