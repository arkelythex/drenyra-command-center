import { describe, expect, it } from "vitest";
import {
	detectRucBreachAnomalies,
	RUC_BREACH_THRESHOLD_PEN,
	type RucBreachTransaction,
} from "../../strategies/ruc-breach.strategy";

function makeTxn(
	overrides: Partial<RucBreachTransaction> = {},
): RucBreachTransaction {
	return {
		id: "TXN-001",
		amount: 10_000,
		declaredRuc: "20123456789",
		paymentRuc: "20987654321",
		serie: "F001",
		numero: "1",
		emisionDate: "2026-01-15",
		...overrides,
	};
}

describe("detectRucBreachAnomalies", () => {
	it("should detect a RUC mismatch above threshold", () => {
		const anomalies = detectRucBreachAnomalies([makeTxn()]);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("high");
		expect(anomalies[0].metric).toBe("ruc_mismatch");
		expect(anomalies[0].confidence).toBeGreaterThan(0.95);
	});

	it("should not flag transactions where RUCs match", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ declaredRuc: "20123456789", paymentRuc: "20123456789" }),
		]);
		expect(anomalies).toHaveLength(0);
	});

	it("should flag critical severity for amounts > 2x threshold", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ amount: RUC_BREACH_THRESHOLD_PEN * 2 + 1 }),
		]);
		expect(anomalies[0].severity).toBe("critical");
	});

	it("should flag medium severity for amounts below threshold", () => {
		const anomalies = detectRucBreachAnomalies([makeTxn({ amount: 1_000 })]);
		expect(anomalies[0].severity).toBe("medium");
	});

	it("should calibrate lower confidence for near-threshold amounts", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ amount: RUC_BREACH_THRESHOLD_PEN - 1 }),
		]);
		// Below threshold → confidence is 0.72 (hardcoded for non-exceeds)
		expect(anomalies[0].confidence).toBe(0.72);
	});

	it("should handle multiple transactions", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ id: "T1", amount: 10_000, declaredRuc: "A", paymentRuc: "B" }),
			makeTxn({ id: "T2", amount: 1_000, declaredRuc: "A", paymentRuc: "A" }), // match → skip
			makeTxn({ id: "T3", amount: 50_000, declaredRuc: "C", paymentRuc: "D" }),
		]);
		expect(anomalies).toHaveLength(2);
	});

	it("should include legal reference in context", () => {
		const anomalies = detectRucBreachAnomalies([makeTxn()]);
		expect(anomalies[0].context.legalReference).toContain("Art. 12 TUO IGV");
	});

	it("should include formatted amount in reasoning", () => {
		const anomalies = detectRucBreachAnomalies([makeTxn()]);
		expect(anomalies[0].reasoning).toContain("SUPERA");
		expect(anomalies[0].reasoning).toContain("RUC declarado");
	});

	it("should set requiresOseValidation for critical amounts", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ amount: RUC_BREACH_THRESHOLD_PEN * 2 + 1 }),
		]);
		expect(anomalies[0].context.requiresOseValidation).toBe(true);
	});

	it("should not set requiresOseValidation for non-critical", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ amount: RUC_BREACH_THRESHOLD_PEN }),
		]);
		expect(anomalies[0].context.requiresOseValidation).toBe(false);
	});

	it("should handle custom threshold", () => {
		const anomalies = detectRucBreachAnomalies(
			[makeTxn({ amount: 1_000 })],
			500,
		);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0].severity).toBe("high"); // 1000 > 500
	});

	it("should return empty array for empty input", () => {
		const anomalies = detectRucBreachAnomalies([]);
		expect(anomalies).toEqual([]);
	});

	it("should include detection method identifier", () => {
		const anomalies = detectRucBreachAnomalies([makeTxn()]);
		expect(anomalies[0].detectionMethod).toBe("ruc_breach_sunat_art12");
	});

	it("should include deviation as ratio of amount to threshold", () => {
		const anomalies = detectRucBreachAnomalies([makeTxn({ amount: 10_000 })]);
		expect(anomalies[0].deviation).toBe(10_000 / RUC_BREACH_THRESHOLD_PEN);
	});

	it("should have unique IDs per transaction", () => {
		const anomalies = detectRucBreachAnomalies([
			makeTxn({ id: "T1" }),
			makeTxn({ id: "T2" }),
		]);
		expect(anomalies[0].id).toBe("ruc-breach-T1");
		expect(anomalies[1].id).toBe("ruc-breach-T2");
	});
});
