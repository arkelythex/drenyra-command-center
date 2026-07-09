import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/fiscal-chat")({
	component: lazyRouteComponent(
		() => import("../features/fiscal-chat/FiscalChat"),
		"FiscalChat",
	),
});
