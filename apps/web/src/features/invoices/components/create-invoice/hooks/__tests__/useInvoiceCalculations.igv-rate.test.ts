// ============================================================================
// IGV rate resolution regression test for useInvoiceCalculations (T4)
// ============================================================================
//
// The 18% IGV multiplier must come from `getActiveTaxRate("pe", "IGV")`
// (T2's `latam-country-packs.ts` adapter over `@drenyra/domain`'s
// `CountryRuntime`/`PERU_TAX_RULES`), not a hardcoded `0.18` literal — so a
// future rate change (e.g. 18% → 19%) is picked up by this hook without a
// code change here.
//
// Kept in its own file (rather than added to `useInvoiceCalculations.test.ts`)
// because `vi.mock` calls are hoisted to the top of their module by Vitest —
// mocking `@/lib/latam-country-packs` here would otherwise silently apply to
// every test in that file, including the real-rate (18%) regression cases.

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/latam-country-packs", () => ({
	getActiveTaxRate: vi.fn(() => 19),
}));

describe("useInvoiceCalculations — IGV rate resolution", () => {
	it('uses the rate returned by getActiveTaxRate("pe", "IGV") instead of a hardcoded 18%', async () => {
		const { getActiveTaxRate } = await import("@/lib/latam-country-packs");
		const { useInvoiceCalculations } = await import(
			"../useInvoiceCalculations"
		);

		const items = [
			{
				id: "1",
				description: "Servicio gravado",
				quantity: 1,
				unitPrice: 100,
				taxType: "GRAVADO" as const,
			},
		];

		const { result } = renderHook(() => useInvoiceCalculations(items));

		// Mocked rate is 19%, not the real 18% — proves the hook reads from
		// getActiveTaxRate() at calculation time rather than a literal.
		expect(result.current.igvAmount).toBe(19);
		expect(result.current.totalAmount).toBe(119);
		expect(getActiveTaxRate).toHaveBeenCalledWith("pe", "IGV");
	});
});
