/**
 * Pricing Analytics Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { analytics } from "@/lib/analytics";

describe("Pricing Analytics", () => {
	beforeEach(() => {
		analytics.clearEvents();
	});

	describe("trackPricingView", () => {
		it("should track pricing view with plan id", () => {
			analytics.trackPricingView("starter");

			const events = analytics.getEvents();
			expect(events).toHaveLength(1);
			expect(events[0]?.name).toBe("pricing_view");
			expect(events[0]?.properties?.planId).toBe("starter");
		});

		it("should track views for all pricing plans", () => {
			const plans = ["starter", "business", "enterprise", "custom"];

			plans.forEach((plan) => {
				analytics.trackPricingView(plan);
			});

			const events = analytics.getEvents();
			expect(events).toHaveLength(4);

			const trackedPlans = events.map((e) => e.properties?.planId);
			expect(trackedPlans).toEqual(plans);
		});
	});

	describe("trackPricingClick", () => {
		it("should track pricing click with plan id and location", () => {
			analytics.trackPricingClick("business", "pricing_section");

			const events = analytics.getEvents();
			expect(events[0]?.name).toBe("pricing_click");
			expect(events[0]?.properties?.planId).toBe("business");
			expect(events[0]?.properties?.location).toBe("pricing_section");
		});

		it("should track clicks from different locations", () => {
			const locations = [
				"pricing_section",
				"footer_banner",
				"navbar",
				"comparison_table",
				"faq_section",
			];

			locations.forEach((location) => {
				analytics.trackPricingClick("enterprise", location);
			});

			const events = analytics.getEvents();
			expect(events).toHaveLength(5);

			const trackedLocations = events.map((e) => e.properties?.location);
			expect(trackedLocations).toEqual(locations);
		});

		it("should track both view and click events", () => {
			analytics.trackPricingView("business");
			analytics.trackPricingClick("business", "pricing_section");

			const events = analytics.getEvents();
			expect(events).toHaveLength(2);

			const eventNames = events.map((e) => e.name);
			expect(eventNames).toEqual(["pricing_view", "pricing_click"]);
		});
	});

	describe("pricing funnel tracking", () => {
		it("should track complete pricing funnel", () => {
			// User views pricing section
			analytics.trackPricingView("business");

			// User clicks on business plan
			analytics.trackPricingClick("business", "pricing_section");

			// User requests demo for business
			analytics.trackDemoRequest("business");

			const events = analytics.getEvents();
			expect(events).toHaveLength(3);

			const types = events.map((e) => e.name);
			expect(types).toEqual(["pricing_view", "pricing_click", "demo_request"]);
		});
	});
});
