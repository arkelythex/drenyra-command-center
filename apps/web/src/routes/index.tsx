import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

/** Drenyra Chat — centro de comando tipo Codex */
export const Route = createFileRoute("/")({
	component: lazyRouteComponent(
		() => import("../features/chat-agent/ChatAgent"),
		"ChatAgent",
	),
});
