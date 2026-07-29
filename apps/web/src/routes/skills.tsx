import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/skills")({
	component: lazyRouteComponent(() => import("./-skills-page"), "SkillsPage"),
	pendingMinMs: 300,
});
