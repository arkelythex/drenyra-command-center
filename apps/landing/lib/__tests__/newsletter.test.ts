/**
 * Newsletter Form Unit Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { analytics } from "@/lib/analytics";

describe("NewsletterForm Analytics", () => {
	beforeEach(() => {
		analytics.clearEvents();
	});

	describe("trackNewsletterSignup", () => {
		it("should track successful newsletter signup", () => {
			analytics.trackNewsletterSignup("test@example.com", "footer");

			const events = analytics.getEvents();
			expect(events).toHaveLength(1);
			expect(events[0]?.name).toBe("newsletter_signup");
			expect(events[0]?.properties?.source).toBe("footer");
		});

		it("should mask email for privacy", () => {
			analytics.trackNewsletterSignup("verylongemail@company.com", "footer");

			const events = analytics.getEvents();
			expect(events[0]?.properties?.email).toBe("ver***");
		});

		it("should track failed signup attempts", () => {
			analytics.trackNewsletterSignup("test@example.com", "footer_failed");

			const events = analytics.getEvents();
			expect(events[0]?.properties?.source).toBe("footer_failed");
		});

		it("should track from different sources", () => {
			const sources = ["footer", "navbar", "popup", "pricing"];

			sources.forEach((source) => {
				analytics.trackNewsletterSignup("test@test.com", source);
			});

			const events = analytics.getEvents();
			expect(events).toHaveLength(4);

			const trackedSources = events.map((e) => e.properties?.source);
			expect(trackedSources).toEqual(sources);
		});
	});
});
