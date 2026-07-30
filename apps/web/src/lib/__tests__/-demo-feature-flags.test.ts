import { describe, expect, it } from "vitest";
import {
	isDemoFeatureEnabled,
	isMobileNavigationRouteEnabledForDemo,
	isNavigationItemEnabledForDemo,
} from "../demo-feature-flags";

describe("demo-feature-flags", () => {
	it("disables unfinished demo features", () => {
		expect(isDemoFeatureEnabled("payroll")).toBe(false);
		expect(isDemoFeatureEnabled("scanner")).toBe(false);
		expect(isDemoFeatureEnabled("economic-groups")).toBe(false);
	});

	it("filters unfinished routes from navigation surfaces", () => {
		expect(isNavigationItemEnabledForDemo("payroll")).toBe(false);
		expect(isNavigationItemEnabledForDemo("scanner")).toBe(false);
		expect(isNavigationItemEnabledForDemo("dashboard")).toBe(true);
		expect(isMobileNavigationRouteEnabledForDemo("/scanner")).toBe(false);
		expect(isMobileNavigationRouteEnabledForDemo("/")).toBe(true);
	});
});
