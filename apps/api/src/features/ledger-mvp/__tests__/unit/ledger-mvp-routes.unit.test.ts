import { createHmac } from "node:crypto";
import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ledgerMvpModule, ledgerMvpService } from "../../index";

describe("ledgerMvpModule routes", () => {
	const app = new Elysia().use(ledgerMvpModule);
	const originalAllowlist = process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS;
	const originalRequireAuth = process.env.LEDGER_MVP_REQUIRE_AUTH;
	const originalAllowedRoles = process.env.LEDGER_MVP_ALLOWED_ROLES;
	const originalMachineSecret = process.env.ARKELYTHEX_MACHINE_CALLER_SECRET;
	const originalMachineAllowlist =
		process.env.LEDGER_MVP_MACHINE_CALLER_ALLOWLIST;

	function buildSignedMachineHeaders(
		companyId: string,
		role = "admin",
		serviceId = "ledger-unit-tester",
	): Record<string, string> {
		const timestamp = Date.now().toString();
		const signature = createHmac("sha256", "unit-machine-secret")
			.update([serviceId, timestamp, companyId, role].join("."))
			.digest("hex");

		return {
			"content-type": "application/json",
			"x-company-id": companyId,
			"x-ark-service-id": serviceId,
			"x-ark-service-role": role,
			"x-ark-service-company-id": companyId,
			"x-ark-service-timestamp": timestamp,
			"x-ark-service-signature": `sha256=${signature}`,
		};
	}

	beforeEach(() => {
		process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = "";
		process.env.LEDGER_MVP_REQUIRE_AUTH = "false";
		delete process.env.LEDGER_MVP_ALLOWED_ROLES;
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = "unit-machine-secret";
		process.env.LEDGER_MVP_MACHINE_CALLER_ALLOWLIST = "ledger-unit-tester";
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = originalAllowlist;
		process.env.LEDGER_MVP_REQUIRE_AUTH = originalRequireAuth;
		process.env.LEDGER_MVP_ALLOWED_ROLES = originalAllowedRoles;
		process.env.ARKELYTHEX_MACHINE_CALLER_SECRET = originalMachineSecret;
		process.env.LEDGER_MVP_MACHINE_CALLER_ALLOWLIST = originalMachineAllowlist;
	});

	it("runs SIRE Autopilot and returns typed payload", async () => {
		vi.spyOn(ledgerMvpService, "runSireAutopilot").mockResolvedValue({
			traceId: "trace-1",
			flow: "sire_autopilot",
			generatedAt: "2026-03-31T12:00:00.000Z",
			period: "2026-03",
			status: "ready",
			evidence: {
				reproducibility: {
					period: "2026-03",
					companyId: "cmp-1",
					reproducible: true,
					coverage: "COMPLETE_DATA",
					sire: { recordCount: 1, totalAmount: 118, totalIGV: 18 },
					ledger: { recordCount: 1, totalAmount: 118, totalIGV: 18 },
					differences: { recordCount: 0, totalAmount: 0, totalIGV: 0 },
					tolerances: { recordCount: 0, totalAmount: 0.01, totalIGV: 0.01 },
				},
				sireSummary: {
					period: "2026-03",
					recordCount: 1,
					totalAmount: 118,
					totalIGV: 18,
					currency: "PEN",
					generatedAt: new Date("2026-03-31T12:00:00.000Z"),
				},
				sunatLiveSummary: {
					source: "sunat-api",
					status: "available",
					period: "2026-03",
					checkedAt: "2026-03-31T12:00:00.000Z",
					message: "Resumen SUNAT API consultado en tiempo real.",
					ledgers: [
						{
							ledgerType: "ventas",
							recordCount: 1,
							totalAmount: 118,
							totalIGV: 18,
						},
						{
							ledgerType: "compras",
							recordCount: 0,
							totalAmount: 0,
							totalIGV: 0,
						},
					],
				},
				sunatCrossCheck: {
					status: "matched",
					reason: "not_applicable",
					recommendedAction: "auto_continue",
				},
				sunatVsLocalGap: {
					recordCount: 0,
					totalAmount: 0,
					totalIGV: 0,
				},
				igvSummary: {
					period: "2026-03",
					sales: "100.00",
					purchases: "0.00",
					igvSales: "18.00",
					igvPurchases: "0.00",
					igvToPay: "18.00",
					igvToRefund: "0.00",
				},
				pdt621Prefill: {
					ruc: "20100070970",
					period: "2026-03",
					razonSocial: "Demo SAC",
					casillas: {
						"100": 100,
						"105": 18,
						"107": 0,
						"120": 0,
						"125": 0,
						"169": 0,
						"185": 18,
					},
					igvResultante: 18,
					status: "a_pagar",
					generatedAt: "2026-03-31T12:00:00.000Z",
					warnings: [],
				},
			},
			recommendedActions: [
				"Proceder con revisión final y envío de PDT 621 prellenado.",
			],
		});

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: buildSignedMachineHeaders("cmp-1"),
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "20100070970",
					razonSocial: "Demo SAC",
					percepcionesCents: 0,
					retencionesCents: 0,
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				flow: "sire_autopilot",
				status: "ready",
			},
		});
	});

	it("returns 422 when SIRE Autopilot payload is invalid", async () => {
		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: buildSignedMachineHeaders("cmp-1"),
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "202603",
					ruc: "20100070970",
					razonSocial: "Demo SAC",
				}),
			}),
		);

		expect(response.status).toBe(422);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("VALIDATION_ERROR");
	});

	it("returns 422 when NPIF query is invalid", async () => {
		const response = await app.handle(
			new Request(
				"http://localhost/api/ledger-mvp/npif-basic?companyId=cmp-1&period=2026/03",
			),
		);

		expect(response.status).toBe(422);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("VALIDATION_ERROR");
	});

	it("enforces mandatory NPIF assisted warning even when service omits warnings", async () => {
		vi.spyOn(ledgerMvpService, "generateNpifBasic").mockResolvedValue({
			traceId: "trace-npif-1",
			flow: "npif_basic",
			generatedAt: "2026-03-31T12:00:00.000Z",
			period: "2026-03",
			status: "ready",
			evidence: {
				profitLoss: {
					period: {
						startDate: new Date("2026-03-01T00:00:00.000Z"),
						endDate: new Date("2026-03-31T23:59:59.000Z"),
					},
					revenue: "1000.00",
					expenses: "200.00",
					netIncome: "800.00",
				},
				balanceSheet: {
					asOfDate: new Date("2026-03-31T23:59:59.000Z"),
					assets: { total: "1500.00" },
					liabilities: { total: "300.00" },
					equity: { total: "1200.00" },
				},
				cashFlow: {
					period: {
						startDate: new Date("2026-03-01T00:00:00.000Z"),
						endDate: new Date("2026-03-31T23:59:59.000Z"),
					},
					operating: "700.00",
					investing: "0.00",
					financing: "0.00",
					netCashFlow: "700.00",
				},
				igvSummary: {
					period: "2026-03",
					sales: "1000.00",
					purchases: "200.00",
					igvSales: "180.00",
					igvPurchases: "36.00",
					igvToPay: "144.00",
					igvToRefund: "0.00",
				},
			},
			recommendedActions: [
				"Validar notas de revelación NPIF antes de cierre mensual.",
			],
			warnings: [],
		});

		const response = await app.handle(
			new Request(
				"http://localhost/api/ledger-mvp/npif-basic?companyId=cmp-1&period=2026-03",
				{
					headers: buildSignedMachineHeaders("cmp-1"),
				},
			),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				flow: "npif_basic",
				warnings: [
					"Resultado NPIF asistido, no autónomo: requiere validación contable manual del contador antes de presentación oficial.",
				],
			},
		});
	});

	it("runs monitor fiscal and returns consolidated status", async () => {
		vi.spyOn(ledgerMvpService, "runMonitorFiscal").mockResolvedValue({
			traceId: "trace-2",
			flow: "monitor_fiscal",
			generatedAt: "2026-03-31T12:00:00.000Z",
			period: "2026-03",
			status: "manual_review",
			alerts: [
				{
					id: "2026-03-ai-1",
					severity: "warning",
					category: "igv",
					message: "Diferencias detectadas entre propuesta SIRE y PLE.",
					confidence: 0.81,
					source: "ai",
					recommendedAction:
						"Recalcular IGV y alinear PDT 621 antes del envio.",
				},
			],
			evidence: {
				proactiveValidation: {
					companyId: "cmp-1",
					period: "2026-03",
					status: "manual_review",
					confidence: 0.81,
					checks: [],
					proactiveAlerts: [],
					recommendedActions: [
						"Recalcular IGV y alinear PDT 621 antes del envio.",
					],
					execution: {
						targetMs: 5000,
						durationMs: 80,
						withinTarget: true,
						mode: "parallel-subagents",
					},
				},
				complianceDashboard: {
					score: 84,
					totalIssues: 1,
					criticalIssues: 0,
					highIssues: 1,
					mediumIssues: 0,
					lowIssues: 0,
					sunatStatus: "WARNINGS",
					lastAudit: new Date("2026-03-31T12:00:00.000Z"),
				},
				openIssues: [],
			},
			recommendedActions: [
				"Escalar validación al contador responsable y registrar decisión HITL.",
			],
		});

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/monitor-fiscal/run", {
				method: "POST",
				headers: buildSignedMachineHeaders("cmp-1"),
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "20100070970",
					ple: {
						salesRecords: 20,
						purchaseRecords: 10,
						salesTotalCents: 100_000,
						purchaseTotalCents: 50_000,
					},
					pdt: {
						form: "621",
						declaredIgvCents: 18_000,
						declaredNetSalesCents: 100_000,
					},
					sire: {
						rvieRecords: 20,
						rceRecords: 10,
						accepted: true,
					},
				}),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				flow: "monitor_fiscal",
				status: "manual_review",
			},
		});
	});

	it("returns 403 when tenant is not allowed by Ledger MVP allowlist", async () => {
		process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = "cmp-allowed";

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-blocked",
					period: "2026-03",
					ruc: "20100070970",
					razonSocial: "Demo SAC",
					percepcionesCents: 0,
					retencionesCents: 0,
				}),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("LEDGER_MVP_TENANT_NOT_ALLOWED");
	});

	it("returns 401 when auth is required and request has no session headers", async () => {
		process.env.LEDGER_MVP_REQUIRE_AUTH = "true";

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "20100070970",
					razonSocial: "Demo SAC",
					percepcionesCents: 0,
					retencionesCents: 0,
				}),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload.success).toBe(false);
	});

	it("returns 403 when caller role is outside Ledger MVP allowed roles", async () => {
		process.env.LEDGER_MVP_REQUIRE_AUTH = "false";
		process.env.LEDGER_MVP_ALLOWED_ROLES = "admin";

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: buildSignedMachineHeaders("cmp-1", "viewer"),
				body: JSON.stringify({
					companyId: "cmp-1",
					period: "2026-03",
					ruc: "20100070970",
					razonSocial: "Demo SAC",
					percepcionesCents: 0,
					retencionesCents: 0,
				}),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("LEDGER_MVP_ROLE_FORBIDDEN");
	});
});
