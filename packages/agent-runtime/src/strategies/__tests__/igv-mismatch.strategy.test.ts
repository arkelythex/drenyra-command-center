import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { IgvMismatchInvoice } from "../igv-mismatch.strategy";
import {
	createIgvMismatchStrategy,
	EXONERATED_TIPOS,
} from "../igv-mismatch.strategy";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

function makeInv(
	overrides: Partial<IgvMismatchInvoice> = {},
): IgvMismatchInvoice {
	return {
		id: "INV-001",
		serie: "F001",
		numero: "1",
		tipoOperacion: "01",
		baseImponible: 1000,
		igvCalculado: 180,
		emisorRuc: "20123456789",
		emisionDate: "2026-01-15",
		...overrides,
	};
}

describe("createIgvMismatchStrategy", () => {
	const strategy = createIgvMismatchStrategy();

	it("should return correct strategy metadata", () => {
		expect(strategy.id).toBe("igv-mismatch");
		expect(strategy.name).toContain("IGV");
		expect(strategy.minSeverity).toBe("low");
	});

	it("should not flag correct IGV calculation", () => {
		const anomalies = strategy.execute([makeInv()], mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should not flag IGV within ±1 PEN tolerance", () => {
		// 179 or 181 instead of 180 → within ±1 tolerance
		const anomalies1 = strategy.execute(
			[makeInv({ igvCalculado: 179 })],
			mockContext,
		);
		expect(anomalies1).toHaveLength(0);

		const anomalies2 = strategy.execute(
			[makeInv({ igvCalculado: 181 })],
			mockContext,
		);
		expect(anomalies2).toHaveLength(0);
	});

	it("should flag low severity for deviation 1-2%", () => {
		// 1000 × 0.18 = 180. 178 → diff=2 → 2/180=0.0111=1.1% → low
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 178 })],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("low");
		expect(anomalies[0].metric).toBe("igv_mismatch");
	});

	it("should flag medium severity for deviation 2-5%", () => {
		// 1000 × 0.18 = 180. 175 → diff=5 → 5/180=0.0278=2.8% → medium
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 175 })],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("medium");
	});

	it("should flag high severity for deviation 5-10%", () => {
		// 1000 × 0.18 = 180. 170 → diff=10 → 10/180=0.0556=5.6% → high
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 170 })],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("high");
	});

	it("should flag critical severity for deviation >10%", () => {
		// 1000 × 0.18 = 180. 140 → diff=40 → 40/180=0.222=22.2% → critical
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 140 })],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("critical");
	});

	it("should skip exonerated operations", () => {
		for (const tipo of EXONERATED_TIPOS) {
			const anomalies = strategy.execute(
				[makeInv({ tipoOperacion: tipo, igvCalculado: 0 })],
				mockContext,
			);
			expect(anomalies).toHaveLength(0);
		}
	});

	it("should handle multiple invoices with mixed results", () => {
		const anomalies = strategy.execute(
			[
				makeInv({ id: "INV-1", igvCalculado: 180 }), // correct
				makeInv({ id: "INV-2", igvCalculado: 170 }), // high deviation (5.6%)
				makeInv({ id: "INV-3", igvCalculado: 0, tipoOperacion: "07" }), // exonerated
			],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].entityId).toBe("INV-2");
		expect(anomalies[0].severity).toBe("high");
	});

	it("should return empty array for empty input", () => {
		const anomalies = strategy.execute([], mockContext);
		expect(anomalies).toEqual([]);
	});

	it("should return empty array for non-array input", () => {
		const anomalies = strategy.execute(null, mockContext);
		expect(anomalies).toEqual([]);
	});

	it("should handle IGV greater than expected", () => {
		// 200 instead of 180 = 11% deviation → critical
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 200 })],
			mockContext,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("critical");
		expect(anomalies[0].expectedValue).toBeLessThan(anomalies[0].actualValue);
	});

	it("should include legal reference in context", () => {
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 160 })],
			mockContext,
		);
		expect(anomalies[0].context.legalReference).toContain("Art. 17 TUO IGV");
	});

	it("should include detection method identifier", () => {
		const anomalies = strategy.execute(
			[makeInv({ igvCalculado: 160 })],
			mockContext,
		);
		expect(anomalies[0].detectionMethod).toBe("igv_mismatch_art17");
	});

	it("should handle negative amounts gracefully", () => {
		const anomalies = strategy.execute(
			[makeInv({ baseImponible: -100, igvCalculado: 0 })],
			mockContext,
		);
		// Negative base should result in negative expected IGV
		// But with tolerance of 1 PEN, -18 vs 0 → diff 18 → anomaly
		expect(anomalies).toHaveLength(1);
	});

	it("should handle decimal base amounts", () => {
		// 333.33 × 0.18 = 59.9994 → rounded to 60.00
		const anomalies = strategy.execute(
			[makeInv({ baseImponible: 333.33, igvCalculado: 60 })],
			mockContext,
		);
		// 59.9994 rounded to 2 decimals = 60.00, diff = 0 → within tolerance
		expect(anomalies).toHaveLength(0);
	});
});
