import { describe, expect, it } from "vitest";
import { contrastRatio, passesWcagContrast } from "../contrast";

describe("Fiscal Editorial contrast", () => {
	it("dark canvas + primary ink meets WCAG AA", () => {
		expect(passesWcagContrast("#161614", "#e8e6e0", "AA", false)).toBe(true);
		expect(contrastRatio("#161614", "#e8e6e0")).toBeGreaterThan(4.5);
	});

	it("light canvas + espresso ink meets WCAG AA", () => {
		expect(passesWcagContrast("#f7f7f4", "#26251e", "AA", false)).toBe(true);
	});

	it("voltage accent on dark meets AA for large text usage", () => {
		expect(passesWcagContrast("#161614", "#f54e00", "AA", true)).toBe(true);
	});
});
