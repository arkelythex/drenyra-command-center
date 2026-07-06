import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

const ThreadCreatePage = lazyRouteComponent(
	() => import("@/features/threads/components/ThreadCreatePage"),
	"ThreadCreatePage",
);

export const Route = createFileRoute("/drenyra/")({
	component: ThreadCreatePage,
});
