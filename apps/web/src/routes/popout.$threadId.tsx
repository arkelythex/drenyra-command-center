import { createFileRoute, useParams } from "@tanstack/react-router";
import { PopOutThread } from "../components/agentic/PopOutThread";

export const Route = createFileRoute("/popout/$threadId")({
	component: PopOutRoute,
});

function PopOutRoute() {
	const { threadId } = useParams({ from: "/popout/$threadId" });
	return <PopOutThread threadId={threadId} />;
}
