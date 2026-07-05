import { LayoutGrid } from "lucide-react";
import { describe, expect, it } from "vitest";
import type { NavigationItem } from "../navigation";
import { isNavigationItemActive } from "../navigation";

const baseItem: NavigationItem = {
	id: "dashboard",
	section: "home",
	label: "Dashboard",
	description: "Resumen general",
	to: "/dashboard",
	icon: LayoutGrid,
	keywords: ["dashboard"],
};

describe("navigation helpers", () => {
	it("matches prefix routes by default", () => {
		expect(isNavigationItemActive("/dashboard/analytics", baseItem)).toBe(true);
		expect(isNavigationItemActive("/banking", baseItem)).toBe(false);
	});

	it("respects exact-match routes", () => {
		const exactItem: NavigationItem = {
			...baseItem,
			id: "settings",
			to: "/settings",
			activeMatch: "exact",
		};

		expect(isNavigationItemActive("/settings", exactItem)).toBe(true);
		expect(isNavigationItemActive("/settings/profile", exactItem)).toBe(false);
	});
});
