import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/control-tower")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/drenyra/control-tower"!</div>;
}
