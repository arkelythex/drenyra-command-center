import { describe, expect, it } from "vitest";
import { toPeruTaxDateKey } from "./tax-date";

describe("toPeruTaxDateKey", () => {
	it("normalizes civil tax date in Lima timezone for UTC boundary values", () => {
		const boundaryDate = new Date("2026-01-01T04:30:00.000Z");
		expect(toPeruTaxDateKey(boundaryDate)).toBe("2025-12-31");
	});

	it("keeps same day when instant is inside Lima local day", () => {
		const sameDay = new Date("2026-01-01T17:00:00.000Z");
		expect(toPeruTaxDateKey(sameDay)).toBe("2026-01-01");
	});
});
