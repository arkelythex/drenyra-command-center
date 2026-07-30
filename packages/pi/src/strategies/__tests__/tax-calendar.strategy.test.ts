import { describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import type { TaxCalendarInput, TaxObligation } from "../tax-calendar.strategy";
import {
	ALERT_DAYS,
	createTaxCalendarStrategy,
} from "../tax-calendar.strategy";

const mockContext: AgentContext = {
	tenantId: "test",
	userId: "test",
	organizationId: "test",
	companyId: "test",
	ruc: "20123456789",
	traceId: "test",
};

function futureDate(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() + days);
	return d.toISOString().split("T")[0];
}

function pastDate(days: number): string {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d.toISOString().split("T")[0];
}

function makeObligation(overrides: Partial<TaxObligation> = {}): TaxObligation {
	return {
		id: "obl-001",
		code: "0621",
		name: "IGV — Declaración Mensual",
		description: "Formulario 621",
		dueDate: futureDate(10),
		status: "pending",
		filingDate: null,
		amount: 5000,
		period: "2026-03",
		legalReference: "Art. 65 TUO IGV",
		...overrides,
	};
}

function makeInput(
	overrides: Partial<TaxCalendarInput> = {},
): TaxCalendarInput {
	return {
		tenantRuc: "20123456789",
		rucType: "persona_juridica",
		taxRegime: "ruta",
		obligations: [makeObligation()],
		...overrides,
	};
}

describe("createTaxCalendarStrategy", () => {
	const strategy = createTaxCalendarStrategy();

	it("should return correct metadata", () => {
		expect(strategy.id).toBe("tax-calendar");
		expect(strategy.name).toContain("Tax Obligation");
		expect(strategy.minSeverity).toBe("low");
	});

	it("should return empty for null/object input", () => {
		expect(strategy.execute(null, mockContext)).toEqual([]);
		expect(strategy.execute("bad", mockContext)).toEqual([]);
	});

	it("should return empty for empty obligations", () => {
		const input = makeInput({ obligations: [] });
		expect(strategy.execute(input, mockContext)).toEqual([]);
	});

	it("should not alert when deadline is > 15 days away", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(30) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies).toHaveLength(0);
	});

	it("should alert as low when deadline is within 15 days", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(10) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("low");
		expect(anomalies[0]?.metric).toBe("tax_deadline_approaching");
	});

	it("should alert as medium within 7 days", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(5) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("medium");
	});

	it("should alert as high within 3 days", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(2) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("high");
	});

	it("should alert as critical on the deadline day", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(0) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("critical");
	});

	it("should alert as critical when deadline has passed", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: pastDate(5) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("critical");
		expect(anomalies[0]?.reasoning).toContain("VENCIDA");
	});

	it("should skip filed obligations", () => {
		const input = makeInput({
			obligations: [
				makeObligation({
					code: "0621",
					dueDate: pastDate(5),
					status: "filed",
					filingDate: pastDate(3),
				}),
				makeObligation({
					code: "0601",
					status: "filed",
					filingDate: pastDate(3),
				}),
				makeObligation({
					code: "0616",
					status: "filed",
					filingDate: pastDate(3),
				}),
				makeObligation({
					code: "0710",
					status: "filed",
					filingDate: pastDate(3),
				}),
			],
		});
		expect(strategy.execute(input, mockContext)).toHaveLength(0);
	});

	it("should skip exempt obligations", () => {
		const input = makeInput({
			obligations: [
				makeObligation({
					code: "0621",
					dueDate: pastDate(5),
					status: "exempt",
				}),
				makeObligation({ code: "0601", status: "exempt" }),
				makeObligation({ code: "0616", status: "exempt" }),
				makeObligation({ code: "0710", status: "exempt" }),
			],
		});
		expect(strategy.execute(input, mockContext)).toHaveLength(0);
	});

	it("should detect missing standard obligations for general regime", () => {
		// General regime expects: 0601, 0621, 0616, 0710
		// Only provide 0621 → should flag 3 missing
		const input = makeInput({
			taxRegime: "general",
			obligations: [makeObligation({ code: "0621" })],
		});
		const anomalies = strategy.execute(input, mockContext);
		const missing = anomalies.filter(
			(a) => a.metric === "tax_obligation_missing",
		);
		expect(missing.length).toBeGreaterThanOrEqual(3);
	});

	it("should detect missing obligations for mype regime", () => {
		const input = makeInput({
			taxRegime: "mype",
			obligations: [makeObligation({ code: "0621" })],
		});
		const anomalies = strategy.execute(input, mockContext);
		const missing = anomalies.filter(
			(a) => a.metric === "tax_obligation_missing",
		);
		// mype expects 0621, 0601, 0710 → 2 missing
		expect(missing.length).toBe(2);
	});

	it("should not flag missing for unknown regime (falls back to empty)", () => {
		const input = makeInput({
			taxRegime: "unknown",
			obligations: [makeObligation({ code: "0621", dueDate: futureDate(10) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		const pending = anomalies.filter(
			(a) => a.metric === "tax_deadline_approaching",
		);
		// Should still alert for deadline, but no missing obligations
		expect(pending.length).toBe(1);
	});

	it("should include legal reference in context", () => {
		const input = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(5) })],
		});
		const anomalies = strategy.execute(input, mockContext);
		const ctx = anomalies[0]?.context as Record<string, unknown>;
		expect(ctx?.legalReference).toContain("Art. 65 TUO IGV");
	});

	it("should include amount and period in reasoning", () => {
		const input = makeInput({
			obligations: [
				makeObligation({
					dueDate: futureDate(0),
					amount: 12500,
					period: "2026-04",
				}),
			],
		});
		const anomalies = strategy.execute(input, mockContext);
		expect(anomalies[0]?.reasoning).toContain("12500.00");
		expect(anomalies[0]?.reasoning).toContain("2026-04");
	});

	it("should handle multiple obligations with mixed states", () => {
		const input = makeInput({
			taxRegime: "general",
			obligations: [
				makeObligation({ id: "obl-001", code: "0621", dueDate: futureDate(2) }), // high
				makeObligation({
					id: "obl-002",
					code: "0601",
					dueDate: pastDate(1),
					status: "filed",
					filingDate: pastDate(2),
				}), // filed → skip
				makeObligation({
					id: "obl-003",
					code: "0616",
					dueDate: futureDate(10),
				}), // low
				// Missing: 0710
			],
		});
		const anomalies = strategy.execute(input, mockContext);
		const deadlineAlerts = anomalies.filter(
			(a) => a.metric === "tax_deadline_approaching",
		);
		const missingAlerts = anomalies.filter(
			(a) => a.metric === "tax_obligation_missing",
		);
		expect(deadlineAlerts).toHaveLength(2); // obl-001 (high) + obl-003 (low)
		expect(missingAlerts).toHaveLength(1); // 0710
	});

	it("should export ALERT_DAYS constant", () => {
		expect(ALERT_DAYS.critical).toBeDefined();
		expect(ALERT_DAYS.high).toBe(3);
		expect(ALERT_DAYS.medium).toBe(7);
		expect(ALERT_DAYS.low).toBe(15);
	});

	it("should increase confidence as deadline approaches", () => {
		const far = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(14) })],
		});
		const near = makeInput({
			obligations: [makeObligation({ dueDate: futureDate(0) })],
		});

		const farResult = strategy.execute(far, mockContext);
		const nearResult = strategy.execute(near, mockContext);

		expect(farResult[0]?.confidence).toBeLessThan(
			nearResult[0]?.confidence as number,
		);
	});
});
