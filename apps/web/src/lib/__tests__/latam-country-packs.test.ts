// ============================================================================
// Tests for latam-country-packs.ts — thin apps/web adapter over
// @drenyra/domain's CountryRuntime (FEOS-014).
// ============================================================================

import { describe, expect, it } from "vitest";
import {
	DEFAULT_COUNTRY_CODE,
	getActiveTaxRate,
	getCountryPack,
	getFixedTaxIdLength,
	LATAM_COUNTRY_PACKS,
	resolveCountryCode,
} from "../latam-country-packs";

// ─── getActiveTaxRate() ──────────────────────────────────────────────────────

describe("getActiveTaxRate()", () => {
	it("returns Peru's IGV rate as a whole-number percentage (18, not 0.18)", () => {
		expect(getActiveTaxRate("PE", "IGV")).toBe(18);
	});

	it("is case-insensitive on the country code", () => {
		expect(getActiveTaxRate("pe", "IGV")).toBe(18);
	});

	it("returns Colombia's IVA rate", () => {
		expect(getActiveTaxRate("CO", "IVA")).toBe(19);
	});

	it("returns undefined for a country with no domain tax rules (e.g. Chile) without throwing", () => {
		expect(() => getActiveTaxRate("CL", "IVA")).not.toThrow();
		expect(getActiveTaxRate("CL", "IVA")).toBeUndefined();
	});

	it("returns undefined for an unsupported/unknown country code without throwing", () => {
		expect(() => getActiveTaxRate("XX", "IGV")).not.toThrow();
		expect(getActiveTaxRate("XX", "IGV")).toBeUndefined();
	});

	it("returns undefined for a valid country but unknown tax name", () => {
		expect(getActiveTaxRate("PE", "NOT_A_REAL_TAX")).toBeUndefined();
	});
});

// ─── resolveCountryCode() / getCountryPack() ────────────────────────────────

describe("resolveCountryCode()", () => {
	it("returns the default code for non-string input", () => {
		expect(resolveCountryCode(undefined)).toBe(DEFAULT_COUNTRY_CODE);
		expect(resolveCountryCode(null)).toBe(DEFAULT_COUNTRY_CODE);
		expect(resolveCountryCode(42)).toBe(DEFAULT_COUNTRY_CODE);
	});

	it("returns the default code for an unsupported string", () => {
		expect(resolveCountryCode("ar")).toBe(DEFAULT_COUNTRY_CODE);
	});

	it("normalizes case/whitespace for a supported code", () => {
		expect(resolveCountryCode(" CO ")).toBe("co");
	});
});

describe("getCountryPack()", () => {
	it("falls back to the default pack for an unsupported code", () => {
		expect(getCountryPack("zz")).toBe(
			LATAM_COUNTRY_PACKS[DEFAULT_COUNTRY_CODE],
		);
	});

	it("resolves currency/locale/tax-ID regex from the domain runtime for Peru", () => {
		const pe = getCountryPack("pe");
		expect(pe.defaultCurrency).toBe("PEN");
		expect(pe.locale).toBe("es-PE");
		expect(pe.taxIdRegex).toBe("\\d{11}");
		expect(pe.taxIdLabel).toBe("RUC");
	});

	it("resolves currency/locale/tax-ID regex from the domain runtime for Colombia", () => {
		const co = getCountryPack("co");
		expect(co.defaultCurrency).toBe("COP");
		expect(co.locale).toBe("es-CO");
		expect(co.taxIdRegex).toBe("\\d{9,10}");
		expect(co.taxIdLabel).toBe("NIT");
	});

	it("keeps apps/web-specific assistant copy for every supported country", () => {
		for (const code of ["pe", "mx", "cl", "co"] as const) {
			const pack = getCountryPack(code);
			expect(pack.assistantPlaceholder.length).toBeGreaterThan(0);
			expect(pack.commandHint.length).toBeGreaterThan(0);
			expect(pack.assistantQuickActions.length).toBeGreaterThan(0);
		}
	});

	it("resolves Peru's fixed RUC length (11) instead of a hardcoded literal", () => {
		expect(getCountryPack("pe").taxIdLength).toBe(11);
	});

	it("leaves taxIdLength undefined for a variable-length tax-ID format (Colombia's NIT)", () => {
		expect(getCountryPack("co").taxIdLength).toBeUndefined();
	});
});

// ─── getFixedTaxIdLength() ───────────────────────────────────────────────────

describe("getFixedTaxIdLength()", () => {
	it("extracts the digit count from a single fixed-length regex", () => {
		expect(getFixedTaxIdLength("\\d{11}")).toBe(11);
	});

	it("returns undefined for a range (variable-length) regex", () => {
		expect(getFixedTaxIdLength("\\d{9,10}")).toBeUndefined();
	});

	it("returns undefined for a non-purely-numeric format", () => {
		expect(getFixedTaxIdLength("[A-ZÑ&]{3,4}\\d{6}")).toBeUndefined();
	});

	it("returns undefined for an always-matching fallback pattern", () => {
		expect(getFixedTaxIdLength(".*")).toBeUndefined();
	});
});
