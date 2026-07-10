import {
	createFileRoute,
	lazyRouteComponent,
	useParams,
} from "@tanstack/react-router";

function PopOutRoute() {
	const { threadId } = useParams({ from: "/popout/$threadId" });
	const PopOutThread = lazyRouteComponent(
		() => import("../components/agentic/PopOutThread"),
		"PopOutThread",
	);
	return <PopOutThread threadId={threadId} />;
}

export const Route = createFileRoute("/popout/$threadId")({
	component: PopOutRoute,
});
