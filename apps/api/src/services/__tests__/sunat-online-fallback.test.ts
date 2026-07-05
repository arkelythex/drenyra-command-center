import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validateRucWithAPIMock = vi.fn();
const getExchangeRateFromAPIMock = vi.fn();

vi.mock("../sunat/external-apis", () => ({
	validateRucWithAPI: validateRucWithAPIMock,
	getExchangeRateFromAPI: getExchangeRateFromAPIMock,
}));

describe("sunat online fallbacks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetModules();
	});

	it("falls back to local success when online RUC validation throws", async () => {
		validateRucWithAPIMock.mockRejectedValue(new Error("network down"));

		const { validateRucOnline } = await import("../sunat/ruc-validation");
		const result = await validateRucOnline("20100070970");

		expect(result).toEqual({
			valid: true,
			ruc: "20100070970",
			message: "RUC válido (validación local - API no disponible)",
		});
	});

	it("falls back to mock exchange rate when external exchange service throws", async () => {
		getExchangeRateFromAPIMock.mockRejectedValue(new Error("timeout"));

		const { getExchangeRate } = await import("../sunat/invoice-utils");
		const result = await getExchangeRate("2026-03-21");

		expect(result).toEqual({
			date: "2026-03-21",
			purchase: 3.75,
			sale: 3.76,
			source: "Fallback - API Error",
		});
	});
});
