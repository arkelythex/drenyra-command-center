import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/drenyra/skills")({
	component: lazyRouteComponent(() => import("./-skills-page"), "SkillsPage"),
});
