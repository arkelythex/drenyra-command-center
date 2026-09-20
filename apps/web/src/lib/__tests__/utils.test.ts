// ============================================================================
// Tests for lib/utils.ts's legacy currency formatters (T3b)
// ============================================================================
//
// `formatPEN`/`formatPENCompact`/`formatCurrency` used to independently
// re-implement `Intl.NumberFormat` with a hardcoded `"es-PE"` locale,
// completely separate from `money.ts`'s country-aware `n()`/`nCompact()`.
// They now delegate to `money.ts` — these tests pin their observable output
// (regression) and confirm the delegation actually happens (not just that
// the output looks the same by coincidence).

import { describe, expect, it, vi } from "vitest";
import {
	formatCurrency,
	formatDate,
	formatPEN,
	formatPENCompact,
	formatPercent,
} from "../utils";

const normalize = (s: string) => s.replace(/ /g, " ");

describe("formatPEN()", () => {
	it("formats with 2 fraction digits by default (regression)", () => {
		expect(normalize(formatPEN(1234.56))).toBe("S/ 1,234.56");
	});

	it("supports a custom fractionDigits override", () => {
		expect(normalize(formatPEN(1234.5, 0))).toBe("S/ 1,235");
		expect(normalize(formatPEN(1234.567, 3))).toBe("S/ 1,234.567");
	});

	it("delegates the default case to money.ts's n()", async () => {
		const money = await import("../money");
		const spy = vi.spyOn(money, "n");
		formatPEN(500);
		expect(spy).toHaveBeenCalledWith(500, "PEN");
		spy.mockRestore();
	});
});

describe("formatPENCompact()", () => {
	it("formats thousands as K (regression)", () => {
		const result = normalize(formatPENCompact(1_200));
		expect(result).toContain("1.2");
		expect(result).toContain("K");
	});

	it("delegates to money.ts's nCompact()", async () => {
		const money = await import("../money");
		const spy = vi.spyOn(money, "nCompact");
		formatPENCompact(1_200);
		expect(spy).toHaveBeenCalledWith(1_200, "PEN", undefined);
		spy.mockRestore();
	});

	it("forwards an explicit currency and country code", async () => {
		const money = await import("../money");
		const spy = vi.spyOn(money, "nCompact");
		formatPENCompact(1_200, "USD", "co");
		expect(spy).toHaveBeenCalledWith(1_200, "USD", "co");
		spy.mockRestore();
	});
});

describe("formatCurrency()", () => {
	it("formats as PEN (regression)", () => {
		expect(normalize(formatCurrency(1234.56))).toBe("S/ 1,234.56");
	});

	it("delegates to money.ts's n()", async () => {
		const money = await import("../money");
		const spy = vi.spyOn(money, "n");
		formatCurrency(750);
		expect(spy).toHaveBeenCalledWith(750, "PEN");
		spy.mockRestore();
	});
});

// ─── Untouched by T3b — kept as regression coverage ─────────────────────────

describe("formatPercent()", () => {
	it("formats a percentage with 1 decimal by default", () => {
		expect(normalize(formatPercent(18))).toBe("18.0%");
	});
});

describe("formatDate()", () => {
	it("formats a date in short Spanish-Peru style", () => {
		const result = formatDate(new Date(2026, 4, 10));
		expect(result).toContain("2026");
		expect(result).toContain("10");
	});
});
