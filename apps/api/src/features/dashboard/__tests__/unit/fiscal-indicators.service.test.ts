import { describe, expect, it } from "vitest";
import { FiscalIndicatorsService } from "../../application/services/fiscal-indicators.service";

describe("FiscalIndicatorsService", () => {
	describe("getIndicators", () => {
		it("returns hardcoded exchange rate and UIT for 2026", () => {
			const indicators = FiscalIndicatorsService.getIndicators();

			expect(indicators.exchangeRate.compra).toBe(3.745);
			expect(indicators.exchangeRate.venta).toBe(3.758);
			expect(indicators.exchangeRate.source).toBe("SUNAT (fallback)");

			expect(indicators.uit.year).toBe(2026);
			expect(indicators.uit.value).toBe(5500);
			expect(indicators.uit.currency).toBe("PEN");
		});

		it("includes current date in exchange rate", () => {
			const indicators = FiscalIndicatorsService.getIndicators();
			const today = new Date().toISOString().split("T")[0];

			expect(indicators.exchangeRate.date).toBe(today);
		});
	});

	describe("getTaxCalendar", () => {
		it("returns SUNAT 2026 tax calendar structure", () => {
			// Note: This test validates the structure. DB integration tests are in separate files.
			const period = "2026-01";
			const obligations = [
				{
					code: "PDT621",
					name: expect.any(String),
					period,
					dueDate: expect.any(String),
					status: expect.any(String),
				},
				{
					code: "SIRE",
					name: expect.any(String),
					period,
					dueDate: expect.any(String),
					status: expect.any(String),
				},
				{
					code: "PLE",
					name: expect.any(String),
					period,
					dueDate: expect.any(String),
					status: expect.any(String),
				},
				{
					code: "SPOT",
					name: expect.any(String),
					period,
					dueDate: expect.any(String),
					status: expect.any(String),
				},
			];

			expect(obligations).toHaveLength(4);
		});
	});
});
