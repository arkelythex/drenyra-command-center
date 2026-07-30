import { describe, expect, it } from "vitest";

import {
	entranceVariants,
	formatAnimatedNumberValue,
	resolveMotionDivAnimation,
} from "../motion-primitives";

describe("motion primitives", () => {
	it("does not attach entrance variants to MotionDiv by default", () => {
		expect(
			resolveMotionDivAnimation({
				animate: undefined,
				initial: false,
				shouldReduceMotion: false,
				variants: undefined,
			}),
		).toEqual({
			animate: undefined,
			initial: false,
			variants: undefined,
		});
	});

	it("keeps explicit MotionDiv variants opt-in", () => {
		expect(
			resolveMotionDivAnimation({
				animate: "visible",
				initial: "hidden",
				shouldReduceMotion: false,
				variants: entranceVariants,
			}),
		).toEqual({
			animate: "visible",
			initial: "hidden",
			variants: entranceVariants,
		});
	});

	it("removes transform animation props for reduced-motion users", () => {
		expect(
			resolveMotionDivAnimation({
				animate: "visible",
				initial: "hidden",
				shouldReduceMotion: true,
				variants: entranceVariants,
			}),
		).toEqual({
			animate: undefined,
			initial: false,
			variants: undefined,
		});
	});

	it("formats animated numbers deterministically for static fallbacks", () => {
		expect(
			formatAnimatedNumberValue(42.125, 1, (value) => `${value.toFixed(1)}%`),
		).toBe("42.1%");
	});
});
