import { describe, expect, it } from "vitest";
import { AGENTIC_SECTIONS } from "@/components/agentic-shell/AgenticSidebar/AgenticSidebar.data";
import { routeTree } from "@/routeTree.gen";
import { AVAILABLE_NAV_PATHS } from "../available-nav-paths";

/** Full paths of every registered route, from the generated route tree. */
function registeredPaths(): Set<string> {
	const children = (routeTree as unknown as { children?: unknown }).children;
	const routes = Array.isArray(children)
		? children
		: Object.values((children ?? {}) as Record<string, unknown>);
	return new Set(
		routes.map(
			(route) => (route as { options: { path: string } }).options.path,
		),
	);
}

describe("navigation only offers screens that exist", () => {
	it("every available path has a route", () => {
		const paths = registeredPaths();
		for (const path of AVAILABLE_NAV_PATHS) {
			expect(paths, path).toContain(path);
		}
	});

	it("the sidebar shows only available entries and no empty section", () => {
		const items = AGENTIC_SECTIONS.flatMap((section) => section.items);
		expect(items.length).toBeGreaterThan(0);
		for (const item of items) expect(AVAILABLE_NAV_PATHS).toContain(item.to);
		for (const section of AGENTIC_SECTIONS) {
			expect(section.items.length).toBeGreaterThan(0);
		}
	});

	it("keeps the monthly close in the menu", () => {
		const items = AGENTIC_SECTIONS.flatMap((section) => section.items);
		expect(items.map((item) => item.to)).toContain("/cierre-mensual");
	});
});
