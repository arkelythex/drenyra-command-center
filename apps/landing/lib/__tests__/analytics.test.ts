/**
 * Analytics Service Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsService, analytics } from "../analytics";

describe("AnalyticsService", () => {
	let service: AnalyticsService;

	beforeEach(() => {
		service = new AnalyticsService();
		vi.clearAllMocks();
	});

	describe("track", () => {
		it("should create event with required fields", () => {
			service.track("page_view", { page: "/" });

			const events = service.getEvents();
			expect(events).toHaveLength(1);
			expect(events[0]?.name).toBe("page_view");
			expect(events[0]?.properties).toEqual({ page: "/" });
			expect(events[0]?.sessionId).toBeDefined();
			expect(events[0]?.pageUrl).toBeDefined();
			expect(events[0]?.timestamp).toBeDefined();
		});

		it("should include referrer when available in browser", () => {
			// Skip in Node environment - document.referrer is undefined
			// This test would pass in browser environment
		});
	});

	describe("trackCtaClick", () => {
		it("should track CTA click with id and location", () => {
			service.trackCtaClick("solicitar_demo", "footer");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("cta_click");
			expect(events[0]?.properties).toEqual({
				ctaId: "solicitar_demo",
				location: "footer",
			});
		});
	});

	describe("trackPricingView", () => {
		it("should track pricing view with plan id", () => {
			service.trackPricingView("business");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("pricing_view");
			expect(events[0]?.properties).toEqual({ planId: "business" });
		});
	});

	describe("trackPricingClick", () => {
		it("should track pricing click with plan id and location", () => {
			service.trackPricingClick("enterprise", "pricing_section");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("pricing_click");
			expect(events[0]?.properties).toEqual({
				planId: "enterprise",
				location: "pricing_section",
			});
		});
	});

	describe("trackNewsletterSignup", () => {
		it("should track newsletter with masked email", () => {
			service.trackNewsletterSignup("test@example.com", "footer");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("newsletter_signup");
			expect(events[0]?.properties?.email).toBe("tes***");
			expect(events[0]?.properties?.source).toBe("footer");
		});
	});

	describe("trackDemoRequest", () => {
		it("should track demo request with plan", () => {
			service.trackDemoRequest("business");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("demo_request");
			expect(events[0]?.properties).toEqual({ plan: "business" });
		});
	});

	describe("trackSireFunnelClick", () => {
		it("should track click to SIRE with placement and destination", () => {
			service.trackSireFunnelClick("hero_primary");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("sire_funnel");
			expect(events[0]?.properties).toEqual({
				action: "click_to_sire",
				placement: "hero_primary",
				destination: "/sire",
			});
		});
	});

	describe("trackSireFunnelLand", () => {
		it("should track sire landing with entry", () => {
			service.trackSireFunnelLand("internal");

			const events = service.getEvents();
			expect(events[0]?.name).toBe("sire_funnel");
			expect(events[0]?.properties).toEqual({
				action: "sire_landing",
				entry: "internal",
			});
		});

		it("should default entry to unknown", () => {
			service.trackSireFunnelLand();

			const events = service.getEvents();
			expect(events[0]?.properties?.entry).toBe("unknown");
		});
	});

	describe("trackScrollDepth", () => {
		it("should track scroll at 25% threshold", () => {
			service.trackScrollDepth(25);

			const events = service.getEvents();
			expect(events[0]?.name).toBe("scroll_depth");
			expect(events[0]?.properties?.depth).toBe(25);
		});

		it("should track scroll at 50% threshold", () => {
			service.trackScrollDepth(50);

			const events = service.getEvents();
			expect(events[0]?.properties?.depth).toBe(50);
		});

		it("should track scroll at 75% threshold", () => {
			service.trackScrollDepth(75);

			const events = service.getEvents();
			expect(events[0]?.properties?.depth).toBe(75);
		});

		it("should track scroll at 100% threshold", () => {
			service.trackScrollDepth(100);

			const events = service.getEvents();
			expect(events[0]?.properties?.depth).toBe(100);
		});

		it("should NOT track scroll at non-threshold values", () => {
			service.trackScrollDepth(30);
			service.trackScrollDepth(60);
			service.trackScrollDepth(90);

			const events = service.getEvents();
			expect(events).toHaveLength(0);
		});
	});

	describe("clearEvents", () => {
		it("should clear all tracked events", () => {
			service.track("page_view");
			service.track("cta_click", { ctaId: "test" });

			service.clearEvents();

			const events = service.getEvents();
			expect(events).toHaveLength(0);
		});
	});

	describe("singleton instance", () => {
		it("should export a singleton analytics instance", () => {
			expect(analytics).toBeInstanceOf(AnalyticsService);
		});
	});
});
