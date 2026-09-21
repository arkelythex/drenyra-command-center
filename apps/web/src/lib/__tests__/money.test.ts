// ============================================================================
// Tests for canonical money formatting (n(), nPEN, nUSD, nCompact, ...)
// ============================================================================

import { describe, expect, it } from "vitest";
import { createFormatter, n, nCompact, nPEN, nUSD } from "../money";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise non-breaking spaces for assertion readability.
 * Intl.NumberFormat('es-PE') uses \u00a0 as the separator between symbol and amount.
 */
const normalize = (s: string) => s.replace(/\u00a0/g, " ");

// ─── n() — basic formatting ─────────────────────────────────────────────────

describe("n()", () => {
	it("formats a positive amount in PEN by default", () => {
		expect(normalize(n(1234.56))).toBe("S/ 1,234.56");
	});

	it("formats zero", () => {
		expect(normalize(n(0))).toBe("S/ 0.00");
	});

	it("formats a negative amount with leading minus", () => {
		expect(normalize(n(-500))).toBe("-S/ 500.00");
	});

	it("formats large numbers with thousand separators", () => {
		expect(normalize(n(1_000_000))).toBe("S/ 1,000,000.00");
	});

	it("formats very small amounts", () => {
		expect(normalize(n(0.01))).toBe("S/ 0.01");
	});

	it("formats in USD when specified", () => {
		expect(normalize(n(1000, "USD"))).toBe("USD 1,000.00");
	});

	it("formats in EUR when specified", () => {
		expect(normalize(n(99.9, "EUR"))).toBe("EUR 99.90");
	});

	it("handles integer amounts", () => {
		expect(normalize(n(100))).toBe("S/ 100.00");
	});

	it("rounds fractional cents correctly (floor)", () => {
		expect(normalize(n(1.234))).toBe("S/ 1.23");
	});

	it("rounds fractional cents correctly (ceil)", () => {
		expect(normalize(n(1.235))).toBe("S/ 1.24");
	});

	it("is idempotent — same input returns same string", () => {
		expect(n(1234.56)).toBe(n(1234.56));
	});

	it("formats max safe integer without scientific notation", () => {
		const result = n(999_999_999.99);
		expect(result).toContain("999,999,999.99");
	});
});

// ─── nPEN ───────────────────────────────────────────────────────────────────

describe("nPEN", () => {
	it("formats as PEN", () => {
		expect(normalize(nPEN(500))).toBe("S/ 500.00");
	});

	it("matches n() with explicit PEN", () => {
		expect(nPEN(1234.56)).toBe(n(1234.56, "PEN"));
	});
});

// ─── nUSD ───────────────────────────────────────────────────────────────────

describe("nUSD", () => {
	it("formats as USD", () => {
		expect(normalize(nUSD(500))).toBe("USD 500.00");
	});

	it("matches n() with explicit USD", () => {
		expect(nUSD(1234.56)).toBe(n(1234.56, "USD"));
	});
});

// ─── nCompact ───────────────────────────────────────────────────────────────

describe("nCompact", () => {
	it("formats thousands as K", () => {
		// Compact returns e.g. "S/ 1.2 K" with double non-breaking space
		const result = normalize(nCompact(1_200));
		expect(result).toContain("1.2");
		expect(result).toContain("K");
	});

	it("formats millions as M", () => {
		const result = normalize(nCompact(5_300_000));
		expect(result).toContain("5.3");
		expect(result).toContain("M");
	});

	it("keeps small numbers without compact notation (drops trailing zeros)", () => {
		const result = normalize(nCompact(500));
		expect(result).toBe("S/ 500");
	});
});

// ─── createFormatter ────────────────────────────────────────────────────────

describe("createFormatter", () => {
	it("creates a formatter bound to USD", () => {
		const nFmt = createFormatter("USD");
		expect(normalize(nFmt(99.99))).toBe("USD 99.99");
	});

	it("returned function is usable as a prop", () => {
		const nFmt = createFormatter("EUR");
		const render = (fmt: (v: number) => string) => fmt(42.5);
		expect(normalize(render(nFmt))).toBe("EUR 42.50");
	});
});

// ─── Country-code resolution (T3) ───────────────────────────────────────────
//
// `n()`/`nCompact()` resolve the display *locale* from the active country
// pack (`latam-country-packs.ts`'s adapter over `@drenyra/domain`'s
// `CountryRuntime`) instead of a hardcoded `"es-PE"` constant. Peru stays the
// default when `countryCode` is omitted (regression-covered above); this
// block covers the new explicit-country-code path.
//
// Expected strings below were verified against real `Intl.NumberFormat`
// output (`new Intl.NumberFormat("es-CO", { style: "currency", currency:
// "PEN", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(...)`),
// not assumed.

describe("n() with explicit countryCode", () => {
	it("defaults to Peru's locale when countryCode is omitted (regression)", () => {
		expect(normalize(n(1234.56))).toBe("S/ 1,234.56");
	});

	it("formats with Colombia's locale when countryCode='co' is passed", () => {
		// es-CO uses "." as the thousands separator and "," as the decimal
		// separator — the opposite of es-PE — and has no special symbol
		// mapping for PEN, so it prints the ISO code instead of "S/".
		expect(normalize(n(1234.56, "PEN", "co"))).toBe("PEN 1.234,56");
	});

	it("Colombia-locale output differs from the Peru-locale output for the same amount", () => {
		expect(n(1234.56, "PEN", "co")).not.toBe(n(1234.56, "PEN", "pe"));
	});

	it("falls back to the default country when countryCode is unrecognized", () => {
		expect(normalize(n(1234.56, "PEN", "zz"))).toBe(
			normalize(n(1234.56, "PEN", "pe")),
		);
	});
});

describe("nCompact() with explicit countryCode", () => {
	it("formats with Colombia's locale", () => {
		const result = normalize(nCompact(1_200, "PEN", "co"));
		expect(result).toContain("1,2");
		expect(result).toContain("K");
	});
});

describe("nPEN() with explicit countryCode", () => {
	it("still formats PEN, but with the passed country's locale", () => {
		expect(normalize(nPEN(1234.56, "co"))).toBe("PEN 1.234,56");
	});
});

// ─── Type contract ──────────────────────────────────────────────────────────

describe("MoneyFormatter type contract", () => {
	it("works as (value: number) => string per design system spec", () => {
		// The design system mandates this contract for props
		type WithMoneyFormat = { n: (value: number) => string };

		const component: WithMoneyFormat = { n: nPEN };
		expect(normalize(component.n(99.99))).toBe("S/ 99.99");
	});

	it("works with optional currency overload", () => {
		type Props = {
			n: (value: number, currency?: "PEN" | "USD" | "EUR") => string;
		};

		const props: Props = { n };
		const result = `${normalize(props.n(100))} | ${normalize(props.n(200, "USD"))}`;
		expect(result).toBe("S/ 100.00 | USD 200.00");
	});
});
