import { describe, it, expect, vi, afterEach } from "vitest";
import { Elysia } from "elysia";
import { pseComplianceRoutes } from "../../index";
import { PseProactiveValidatorService } from "../../pse-proactive-validator.service";

vi.mock("../../pse-proactive-validator.service", () => ({
	PseProactiveValidatorService: vi.fn().mockImplementation(() => ({
		validate: vi.fn(),
	})),
}));

describe("PSE compliance route integration", () => {
	const app = new Elysia().use(pseComplianceRoutes);

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns validation result for consistent PLE/PDT/SIRE data", async () => {
		const mockValidate = vi.fn().mockResolvedValue({
			companyId: "cmp-1",
			period: "2026-03",
			status: "ready",
			confidence: 0.95,
			checks: [
				{
					subagent: "igv-subagent",
					status: "pass",
					confidence: 0.96,
					message: "IGV declarado consistente con PLE ventas.",
					evidence: {
						expectedIgvPen: 180,
						declaredIgvPen: 180,
						gapPen: 0,
						tolerancePen: 2,
					},
				},
				{
					subagent: "rce-subagent",
					status: "pass",
					confidence: 0.95,
					message: "RVIE/RCE consistente con PLE.",
					evidence: { rvieGap: 0, rceGap: 0, sireAccepted: true },
				},
				{
					subagent: "pdt-subagent",
					status: "pass",
					confidence: 0.94,
					message: "PDT listo para envio por PSE.",
					evidence: {
						isValidRuc: true,
						isFuturePeriod: false,
						salesGapPen: 0,
						form: "621",
					},
				},
			],
			proactiveAlerts: [],
			recommendedActions: ["Continuar con envio PSE de forma automatizada."],
			execution: {
				targetMs: 5000,
				durationMs: 12,
				withinTarget: true,
				mode: "parallel-subagents",
			},
		});

		vi.mocked(PseProactiveValidatorService).mockImplementation(() => ({
			validate: mockValidate,
		}));

		const response = await app.handle(
			new Request("http://localhost/api/pse-compliance/validate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "20601234567",
					ple: {
						salesRecords: 10,
						purchaseRecords: 8,
						salesTotalPen: 1000,
						purchaseTotalPen: 500,
					},
					pdt: {
						form: "621",
						declaredIgvPen: 180,
						declaredNetSalesPen: 1000,
					},
					sire: {
						rvieRecords: 10,
						rceRecords: 8,
						accepted: true,
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.status).toBe("ready");
		expect(payload.data.checks).toHaveLength(3);
		expect(payload.data.execution.mode).toBe("parallel-subagents");
	});

	it("returns blocked status when IGV breach is detected", async () => {
		const mockValidate = vi.fn().mockResolvedValue({
			companyId: "cmp-2",
			period: "2026-03",
			status: "blocked",
			confidence: 0.78,
			checks: [
				{
					subagent: "igv-subagent",
					status: "fail",
					confidence: 0.78,
					message: "Brecha IGV detectada: S/ 100.00.",
					evidence: {
						expectedIgvPen: 180,
						declaredIgvPen: 80,
						gapPen: 100,
						tolerancePen: 2,
					},
				},
				{
					subagent: "rce-subagent",
					status: "pass",
					confidence: 0.95,
					message: "RVIE/RCE consistente con PLE.",
					evidence: { rvieGap: 0, rceGap: 0, sireAccepted: true },
				},
				{
					subagent: "pdt-subagent",
					status: "pass",
					confidence: 0.94,
					message: "PDT listo para envio por PSE.",
					evidence: {
						isValidRuc: true,
						isFuturePeriod: false,
						salesGapPen: 0,
						form: "621",
					},
				},
			],
			proactiveAlerts: [],
			recommendedActions: ["Recalcular IGV y alinear PDT 621 antes del envio."],
			execution: {
				targetMs: 5000,
				durationMs: 10,
				withinTarget: true,
				mode: "parallel-subagents",
			},
		});

		vi.mocked(PseProactiveValidatorService).mockImplementation(() => ({
			validate: mockValidate,
		}));

		const response = await app.handle(
			new Request("http://localhost/api/pse-compliance/validate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-2",
					period: "2026-03",
					ruc: "20601234567",
					ple: {
						salesRecords: 10,
						purchaseRecords: 8,
						salesTotalPen: 1000,
						purchaseTotalPen: 500,
					},
					pdt: {
						form: "621",
						declaredIgvPen: 80,
						declaredNetSalesPen: 1000,
					},
					sire: {
						rvieRecords: 10,
						rceRecords: 8,
						accepted: true,
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.data.status).toBe("blocked");
		const igvCheck = payload.data.checks.find(
			(c: { subagent: string }) => c.subagent === "igv-subagent",
		);
		expect(igvCheck.status).toBe("fail");
	});

	it("rejects request with invalid period format", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/pse-compliance/validate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "invalid",
					ruc: "20601234567",
					ple: {
						salesRecords: 0,
						purchaseRecords: 0,
						salesTotalPen: 0,
						purchaseTotalPen: 0,
					},
					pdt: {
						form: "621",
						declaredIgvPen: 0,
						declaredNetSalesPen: 0,
					},
				}),
			}),
		);

		expect(response.status).toBe(422);
	});

	it("rejects request with invalid RUC length", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/pse-compliance/validate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "123",
					ple: {
						salesRecords: 0,
						purchaseRecords: 0,
						salesTotalPen: 0,
						purchaseTotalPen: 0,
					},
					pdt: {
						form: "621",
						declaredIgvPen: 0,
						declaredNetSalesPen: 0,
					},
				}),
			}),
		);

		expect(response.status).toBe(422);
	});

	it("accepts optional SIRE data for comprehensive validation", async () => {
		const mockValidate = vi.fn().mockResolvedValue({
			companyId: "cmp-1",
			period: "2026-03",
			status: "ready",
			confidence: 0.95,
			checks: [
				{
					subagent: "igv-subagent",
					status: "pass",
					confidence: 0.96,
					message: "IGV declarado consistente con PLE ventas.",
					evidence: {
						expectedIgvPen: 180,
						declaredIgvPen: 180,
						gapPen: 0,
						tolerancePen: 2,
					},
				},
				{
					subagent: "rce-subagent",
					status: "pass",
					confidence: 0.95,
					message: "RVIE/RCE consistente con PLE.",
					evidence: { rvieGap: 0, rceGap: 0, sireAccepted: true },
				},
				{
					subagent: "pdt-subagent",
					status: "pass",
					confidence: 0.94,
					message: "PDT listo para envio por PSE.",
					evidence: {
						isValidRuc: true,
						isFuturePeriod: false,
						salesGapPen: 0,
						form: "621",
					},
				},
			],
			proactiveAlerts: [],
			recommendedActions: ["Continuar con envio PSE de forma automatizada."],
			execution: {
				targetMs: 5000,
				durationMs: 8,
				withinTarget: true,
				mode: "parallel-subagents",
			},
		});

		vi.mocked(PseProactiveValidatorService).mockImplementation(() => ({
			validate: mockValidate,
		}));

		const response = await app.handle(
			new Request("http://localhost/api/pse-compliance/validate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "20601234567",
					ple: {
						salesRecords: 10,
						purchaseRecords: 8,
						salesTotalPen: 1000,
						purchaseTotalPen: 500,
					},
					pdt: {
						form: "621",
						declaredIgvPen: 180,
						declaredNetSalesPen: 1000,
					},
					sire: {
						rvieRecords: 10,
						rceRecords: 8,
						accepted: true,
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.data.status).toBe("ready");
	});
});
