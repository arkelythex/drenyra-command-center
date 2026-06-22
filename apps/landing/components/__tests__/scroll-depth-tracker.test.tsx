/**
 * ScrollDepthTracker Component Unit Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test the logic without React rendering
// The scroll tracking logic is in the component, we test the service instead

import { analytics } from "@/lib/analytics";

describe("ScrollDepthTracker - Analytics Service", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		analytics.clearEvents();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("trackScrollDepth", () => {
		it("should track scroll depth at 25%", () => {
			analytics.trackScrollDepth(25);

			const events = analytics.getEvents();
			expect(events).toHaveLength(1);
			expect(events[0]?.name).toBe("scroll_depth");
			expect(events[0]?.properties?.depth).toBe(25);
		});

		it("should track scroll depth at 50%", () => {
			analytics.trackScrollDepth(50);

			const events = analytics.getEvents();
			expect(events[0]?.properties?.depth).toBe(50);
		});

		it("should track scroll depth at 75%", () => {
			analytics.trackScrollDepth(75);

			const events = analytics.getEvents();
			expect(events[0]?.properties?.depth).toBe(75);
		});

		it("should track scroll depth at 100%", () => {
			analytics.trackScrollDepth(100);

			const events = analytics.getEvents();
			expect(events[0]?.properties?.depth).toBe(100);
		});

		it("should NOT track scroll depth at 10%", () => {
			analytics.trackScrollDepth(10);

			const events = analytics.getEvents();
			expect(events).toHaveLength(0);
		});

		it("should NOT track scroll depth at 30%", () => {
			analytics.trackScrollDepth(30);

			const events = analytics.getEvents();
			expect(events).toHaveLength(0);
		});

		it("should NOT track scroll depth at 60%", () => {
			analytics.trackScrollDepth(60);

			const events = analytics.getEvents();
			expect(events).toHaveLength(0);
		});

		it("should NOT track scroll depth at 90%", () => {
			analytics.trackScrollDepth(90);

			const events = analytics.getEvents();
			expect(events).toHaveLength(0);
		});
	});

	describe("scroll depth thresholds", () => {
		it("should track only at defined thresholds (25, 50, 75, 100)", () => {
			// Test all possible values
			for (let i = 0; i <= 100; i++) {
				analytics.trackScrollDepth(i);
			}

			const events = analytics.getEvents();
			// Only 25, 50, 75, 100 should be tracked
			expect(events).toHaveLength(4);

			const depths = events
				.map((e) => e.properties?.depth)
				.sort((a, b) => (a as number) - (b as number));
			expect(depths).toEqual([25, 50, 75, 100]);
		});
	});
});
