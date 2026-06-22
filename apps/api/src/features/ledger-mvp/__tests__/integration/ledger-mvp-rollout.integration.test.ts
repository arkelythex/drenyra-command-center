import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ledgerMvpModule, ledgerMvpService } from "../../index";

function buildSireAutopilotPayload(companyId: string): Record<string, unknown> {
	return {
		companyId,
		period: "2026-03",
		ruc: "20100070970",
		razonSocial: "Demo SAC",
		percepcionesCents: 0,
		retencionesCents: 0,
	};
}

describe("ledger-mvp rollout integration", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = {
			...originalEnv,
			LEDGER_MVP_ALLOWED_COMPANY_IDS: "cmp-1",
			LEDGER_MVP_ALLOWED_ROLES: "admin",
			LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT: "admin",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("requires authentication by default in staging when auth flag is not set", async () => {
		process.env.NODE_ENV = "staging";
		delete process.env.LEDGER_MVP_REQUIRE_AUTH;
		delete process.env.FLUX_MVP_REQUIRE_AUTH;

		const app = new Elysia().use(ledgerMvpModule);
		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(buildSireAutopilotPayload("cmp-1")),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SESSION_REQUIRED",
		});
	});

	it("rejects unauthenticated calls in development when auth flag is not set", async () => {
		process.env.NODE_ENV = "development";
		delete process.env.LEDGER_MVP_REQUIRE_AUTH;
		delete process.env.FLUX_MVP_REQUIRE_AUTH;

		vi.spyOn(ledgerMvpService, "runSireAutopilot").mockResolvedValue({
			traceId: "trace-rollout-1",
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

		const app = new Elysia().use(ledgerMvpModule);
		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(buildSireAutopilotPayload("cmp-1")),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SESSION_REQUIRED",
		});
	});

	it("keeps tenant allowlist enforcement in staging when session headers are present", async () => {
		process.env.NODE_ENV = "staging";
		process.env.LEDGER_MVP_REQUIRE_AUTH = "true";
		process.env.LEDGER_MVP_ALLOWED_COMPANY_IDS = "cmp-allowed";

		const app = new Elysia().use(ledgerMvpModule);
		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "usr-admin",
					"x-user-role": "admin",
					"x-company-id": "cmp-blocked",
				},
				body: JSON.stringify(buildSireAutopilotPayload("cmp-blocked")),
			}),
		);

		expect(response.status).toBe(403);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "LEDGER_MVP_TENANT_NOT_ALLOWED",
		});
	});
});
