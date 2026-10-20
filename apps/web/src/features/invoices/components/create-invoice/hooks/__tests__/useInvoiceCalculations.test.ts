import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useInvoiceCalculations } from "../useInvoiceCalculations";

describe("useInvoiceCalculations", () => {
	it("splits IGV out of taxed prices like the API, for mixed tax types", () => {
		const items = [
			{
				id: "1",
				description: "Servicio gravado",
				quantity: 2,
				unitPrice: 100,
				taxType: "GRAVADO" as const,
			},
			{
				id: "2",
				description: "Servicio exonerado",
				quantity: 1,
				unitPrice: 50,
				taxType: "EXONERADO" as const,
			},
			{
				id: "3",
				description: "Servicio inafecto",
				quantity: 3,
				unitPrice: 20,
				taxType: "INAFECTO" as const,
			},
		];

		const { result } = renderHook(() => useInvoiceCalculations(items));

		// 2 × 100 taxed = 200 with IGV inside (169.49 + 30.51), plus 50 + 60 untaxed.
		expect(result.current.subtotal).toBe(279.49);
		expect(result.current.igvAmount).toBe(30.51);
		expect(result.current.totalAmount).toBe(310);
	});

	it("returns zeros when there are no items", () => {
		const { result } = renderHook(() => useInvoiceCalculations([]));

		expect(result.current).toEqual({
			subtotal: 0,
			igvAmount: 0,
			totalAmount: 0,
		});
	});
});
