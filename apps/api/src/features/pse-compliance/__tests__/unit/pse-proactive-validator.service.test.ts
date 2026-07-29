import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	PseProactiveValidatorService,
	type PseComplianceInput,
} from "../../pse-proactive-validator.service";

function makeInput(overrides: Partial<PseComplianceInput> = {}): PseComplianceInput {
	return {
		companyId: "cmp-1",
		period: "2024-02",
		ruc: "20100070970",
		ple: {
			salesRecords: 20,
			purchaseRecords: 12,
			salesTotalPen: 1000,
			purchaseTotalPen: 500,
		},
		pdt: {
			form: "621",
			declaredIgvPen: 180,
			declaredNetSalesPen: 1000,
		},
		sire: {
			rvieRecords: 20,
			rceRecords: 12,
			accepted: true,
		},
		...overrides,
	};
}

function checkFor(result: Awaited<ReturnType<PseProactiveValidatorService["validate"]>>, subagent: string) {
	return result.checks.find((check) => check.subagent === subagent);
}

describe("PseProactiveValidatorService", () => {
	beforeEach(() => {
		vi.stubEnv("OPENROUTER_API_KEY", "");
		vi.stubEnv("OPENROUTER_DEFAULT_MODEL", "");
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("returns ready when PLE/PDT/SIRE are consistent", async () => {
		const result = await new PseProactiveValidatorService().validate(makeInput());

		expect(result.status).toBe("ready");
		expect(result.execution.mode).toBe("parallel-subagents");
		expect(result.checks).toHaveLength(3);
		expect(result.proactiveAlerts.length).toBeGreaterThan(0);
	});

	it("returns blocked when IGV breach is detected", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "621", declaredIgvPen: 80, declaredNetSalesPen: 1000 } }),
		);

		expect(result.status).toBe("blocked");
		expect(checkFor(result, "igv-subagent")?.status).toBe("fail");
	});

	it("returns manual_review when SIRE proposal is missing", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ sire: undefined }),
		);

		expect(result.status).toBe("manual_review");
		expect(checkFor(result, "rce-subagent")?.status).toBe("warn");
		expect(result.proactiveAlerts.some((alert) => alert.level === "warning")).toBe(
			true,
		);
	});

	it("returns deterministic fallback alerts when OpenRouter is not configured", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "621", declaredIgvPen: 80, declaredNetSalesPen: 1000 } }),
		);

		expect(result.status).toBe("blocked");
		expect(result.proactiveAlerts.some((alert) => alert.level === "critical")).toBe(
			true,
		);
	});

	it("accepts an IGV difference exactly at the two-sol tolerance", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "621", declaredIgvPen: 182, declaredNetSalesPen: 1000 } }),
		);

		expect(checkFor(result, "igv-subagent")).toMatchObject({
			status: "pass",
			evidence: { gapPen: 2, tolerancePen: 2 },
		});
	});

	it("blocks an IGV difference just above the tolerance", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "621", declaredIgvPen: 182.01, declaredNetSalesPen: 1000 } }),
		);

		expect(checkFor(result, "igv-subagent")).toMatchObject({
			status: "fail",
			evidence: { gapPen: 2.01 },
		});
	});

	it("rounds expected IGV to two decimal places before comparing", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({
				ple: { salesRecords: 1, purchaseRecords: 0, salesTotalPen: 100.03, purchaseTotalPen: 0 },
				pdt: { form: "621", declaredIgvPen: 18.01, declaredNetSalesPen: 100.03 },
				sire: { rvieRecords: 1, rceRecords: 0 },
			}),
		);

		expect(checkFor(result, "igv-subagent")?.evidence).toMatchObject({
			expectedIgvPen: 18.01,
			gapPen: 0,
		});
	});

	it("warns when RVIE records differ while RCE records match", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ sire: { rvieRecords: 19, rceRecords: 12 } }),
		);

		expect(result.status).toBe("manual_review");
		expect(checkFor(result, "rce-subagent")).toMatchObject({
			status: "warn",
			evidence: { rvieGap: -1, rceGap: 0, sireAccepted: false },
		});
	});

	it("warns when RCE records differ while RVIE records match", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ sire: { rvieRecords: 20, rceRecords: 13, accepted: true } }),
		);

		expect(checkFor(result, "rce-subagent")).toMatchObject({
			status: "warn",
			evidence: { rvieGap: 0, rceGap: 1, sireAccepted: true },
		});
	});

	it("does not treat an unaccepted but balanced SIRE proposal as a discrepancy", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ sire: { rvieRecords: 20, rceRecords: 12, accepted: false } }),
		);

		expect(checkFor(result, "rce-subagent")?.status).toBe("pass");
		expect(result.status).toBe("ready");
	});

	it("accepts a net-sales difference exactly at the five-sol PDT threshold", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "621", declaredIgvPen: 180, declaredNetSalesPen: 995 } }),
		);

		expect(checkFor(result, "pdt-subagent")?.status).toBe("pass");
	});

	it("warns on a net-sales difference above the five-sol PDT threshold", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "621", declaredIgvPen: 180, declaredNetSalesPen: 994.99 } }),
		);

		expect(checkFor(result, "pdt-subagent")).toMatchObject({
			status: "warn",
			evidence: { salesGapPen: 5.01 },
		});
	});

	it("blocks an invalid RUC even when accounting values are consistent", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ ruc: "12345678901" }),
		);

		expect(checkFor(result, "pdt-subagent")).toMatchObject({
			status: "fail",
			evidence: { isValidRuc: false },
		});
		expect(result.status).toBe("blocked");
	});

	it("blocks a future reporting period", async () => {
		const nextMonth = new Date();
		const futureDate = new Date(
			Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 1),
		);
		const futurePeriod = `${futureDate.getUTCFullYear()}-${String(
			futureDate.getUTCMonth() + 1,
		).padStart(2, "0")}`;
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ period: futurePeriod }),
		);

		expect(checkFor(result, "pdt-subagent")).toMatchObject({
			status: "fail",
			evidence: { isFuturePeriod: true },
		});
	});

	it("includes each applicable recommended action only once", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({
				pdt: { form: "621", declaredIgvPen: 80, declaredNetSalesPen: 900 },
				sire: { rvieRecords: 19, rceRecords: 11 },
			}),
		);

		expect(result.recommendedActions).toHaveLength(3);
		expect(result.recommendedActions).toEqual(expect.arrayContaining([
			"Recalcular IGV y alinear PDT 621 antes del envio.",
			"Conciliar RVIE/RCE vs PLE y resolver diferencias de registros.",
			"Validar estado de RUC y consistencia de ventas declaradas.",
		]));
	});

	it("returns the automated-send action when every check passes", async () => {
		const result = await new PseProactiveValidatorService().validate(makeInput());

		expect(result.recommendedActions).toEqual([
			"Continuar con envio PSE de forma automatizada.",
		]);
	});

	it("prioritizes critical fallback alerts before warnings", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({
				pdt: { form: "621", declaredIgvPen: 80, declaredNetSalesPen: 1000 },
				sire: undefined,
			}),
		);

		expect(result.proactiveAlerts.slice(0, 2).map((alert) => alert.level)).toEqual([
			"critical",
			"warning",
		]);
	});

		it("adds the deterministic fallback reason after a clean validation", async () => {
			const result = await new PseProactiveValidatorService().validate(makeInput());

			expect(result.proactiveAlerts).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						level: "info",
						message:
							"OPENROUTER credentials missing; using deterministic fallback alerts.",
					}),
				]),
			);
		});

		it("averages subagent confidence and preserves request identity fields", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ companyId: "cmp-confidence", period: "2023-12" }),
		);

		expect(result).toMatchObject({
			companyId: "cmp-confidence",
			period: "2023-12",
			confidence: 0.95,
			execution: { targetMs: 5000, withinTarget: expect.any(Boolean) },
		});
	});

	it("retains the selected PDT form in the validation evidence", async () => {
		const result = await new PseProactiveValidatorService().validate(
			makeInput({ pdt: { form: "626", declaredIgvPen: 180, declaredNetSalesPen: 1000 } }),
		);

		expect(checkFor(result, "pdt-subagent")?.evidence).toMatchObject({ form: "626" });
	});
});
