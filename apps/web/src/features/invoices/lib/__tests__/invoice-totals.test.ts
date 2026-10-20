import { describe, expect, it } from "vitest";
import {
	centsToDecimal,
	decimalToCents,
	invoiceTotalsCents,
	lineTotalsCents,
} from "../invoice-totals";

const IGV = 0.18;

describe("decimalToCents", () => {
	it("reads API decimals without float drift", () => {
		expect(decimalToCents("1180.00")).toBe(118000);
		expect(decimalToCents("0.1")).toBe(10);
		expect(decimalToCents("19.99")).toBe(1999);
		expect(decimalToCents(1180)).toBe(118000);
	});

	it("treats empty or invalid values as zero", () => {
		expect(decimalToCents("")).toBe(0);
		expect(decimalToCents(undefined)).toBe(0);
		expect(decimalToCents("abc")).toBe(0);
	});
});

describe("centsToDecimal", () => {
	it("writes the two decimals the API expects", () => {
		expect(centsToDecimal(118000)).toBe("1180.00");
		expect(centsToDecimal(5)).toBe("0.05");
		expect(centsToDecimal(-1525)).toBe("-15.25");
	});
});

describe("lineTotalsCents (same rule as the API: price includes IGV)", () => {
	it("splits IGV out of a taxed line instead of adding it on top", () => {
		// API: subtotal = 100.00 / 1.18 = 84.75, IGV = 15.25, total = 100.00
		expect(
			lineTotalsCents({ quantity: 1, unitPrice: 100, taxType: "GRAVADO" }, IGV),
		).toEqual({ subtotalCents: 8475, igvCents: 1525, totalCents: 10000 });
	});

	it("multiplies quantity before splitting, rounding to the cent once", () => {
		// 3 × 19.99 = 59.97 → base 50.82, IGV 9.15
		expect(
			lineTotalsCents(
				{ quantity: 3, unitPrice: 19.99, taxType: "GRAVADO" },
				IGV,
			),
		).toEqual({ subtotalCents: 5082, igvCents: 915, totalCents: 5997 });
	});

	it("keeps exempt and non-taxed lines without IGV", () => {
		for (const taxType of ["EXONERADO", "INAFECTO"] as const) {
			expect(
				lineTotalsCents({ quantity: 2, unitPrice: 50, taxType }, IGV),
			).toEqual({ subtotalCents: 10000, igvCents: 0, totalCents: 10000 });
		}
	});

	it("accepts the form's string inputs", () => {
		expect(
			lineTotalsCents(
				{ quantity: "2", unitPrice: "118.00", taxType: "GRAVADO" },
				IGV,
			),
		).toEqual({ subtotalCents: 20000, igvCents: 3600, totalCents: 23600 });
	});
});

describe("invoiceTotalsCents", () => {
	it("adds the already-rounded lines, so the parts always sum to the total", () => {
		const totals = invoiceTotalsCents(
			[
				{ quantity: 2, unitPrice: 100, taxType: "GRAVADO" },
				{ quantity: 1, unitPrice: 50, taxType: "EXONERADO" },
				{ quantity: 3, unitPrice: 20, taxType: "INAFECTO" },
			],
			IGV,
		);

		expect(totals).toEqual({
			subtotalCents: 16949 + 5000 + 6000,
			igvCents: 3051,
			totalCents: 31000,
		});
		expect(totals.subtotalCents + totals.igvCents).toBe(totals.totalCents);
	});
});
