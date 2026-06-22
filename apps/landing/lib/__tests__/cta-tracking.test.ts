/**
 * CTA Tracking Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { analytics } from "@/lib/analytics";

describe("CTA Click Analytics", () => {
	beforeEach(() => {
		analytics.clearEvents();
	});

	describe("trackCtaClick", () => {
		it("should track CTA click with id and location", () => {
			analytics.trackCtaClick("solicitar_demo", "footer_banner");

			const events = analytics.getEvents();
			expect(events).toHaveLength(1);
			expect(events[0]?.name).toBe("cta_click");
			expect(events[0]?.properties?.ctaId).toBe("solicitar_demo");
			expect(events[0]?.properties?.location).toBe("footer_banner");
		});

		it("should track all CTA locations", () => {
			const ctas = [
				{ id: "solicitar_demo", location: "footer_banner" },
				{ id: "ver_planes", location: "footer_banner" },
				{ id: "empezar_gratis", location: "floating_cta" },
				{ id: "ver_planes", location: "sticky_cta" },
				{ id: "acceso", location: "navbar" },
				{ id: "ver_demo", location: "navbar" },
			];

			ctas.forEach(({ id, location }) => {
				analytics.trackCtaClick(id, location);
			});

			const events = analytics.getEvents();
			expect(events).toHaveLength(6);
		});

		it("should track unique CTA IDs", () => {
			const ctaIds = [
				"solicitar_demo",
				"ver_planes",
				"empezar_gratis",
				"acceso",
				"ver_demo",
				"contacto",
				"faq_expert",
			];

			ctaIds.forEach((id) => {
				analytics.trackCtaClick(id, "test");
			});

			const events = analytics.getEvents();
			const trackedIds = events.map((e) => e.properties?.ctaId);

			expect(trackedIds).toEqual(ctaIds);
		});
	});

	describe("trackDemoRequest", () => {
		it("should track demo request with plan", () => {
			analytics.trackDemoRequest("business");

			const events = analytics.getEvents();
			expect(events[0]?.name).toBe("demo_request");
			expect(events[0]?.properties?.plan).toBe("business");
		});

		it("should track demo requests for different plans", () => {
			const plans = ["starter", "business", "enterprise"];

			plans.forEach((plan) => {
				analytics.trackDemoRequest(plan);
			});

			const events = analytics.getEvents();
			expect(events).toHaveLength(3);

			const trackedPlans = events.map((e) => e.properties?.plan);
			expect(trackedPlans).toEqual(plans);
		});
	});
});
