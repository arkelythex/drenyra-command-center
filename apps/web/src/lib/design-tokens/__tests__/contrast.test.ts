import { describe, expect, it } from "vitest";
import {
	contrastRatio,
	passesWcagContrast,
	relativeLuminance,
} from "../contrast";

describe("contrast", () => {
	it("computes contrast ratio for parseable rgb/hex colors", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBe(21);
		expect(relativeLuminance("rgb(255, 255, 255)")).toBe(1);
	});

	it("returns null for unsupported formats", () => {
		expect(contrastRatio("oklch(0.8 0.1 200)", "#ffffff")).toBeNull();
	});

	it("evaluates WCAG thresholds", () => {
		expect(passesWcagContrast("#000", "#fff", "AA", false)).toBe(true);
		expect(passesWcagContrast("#777", "#fff", "AAA", false)).toBe(false);
	});
});
