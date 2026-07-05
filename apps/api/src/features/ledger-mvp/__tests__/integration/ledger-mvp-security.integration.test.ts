import { createHmac } from "node:crypto";
import { Elysia } from "elysia";
import { register } from "prom-client";
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

describe("ledger-mvp routes security integration", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.restoreAllMocks();
		process.env = {
			...originalEnv,
			NODE_ENV: "test",
			LEDGER_MVP_REQUIRE_AUTH: "false",
			LEDGER_MVP_ALLOWED_COMPANY_IDS: "cmp-1",
			LEDGER_MVP_ALLOWED_ROLES_SIRE_AUTOPILOT: "admin",
			DRENYRA_MACHINE_CALLER_SECRET: "machine-secret",
			LEDGER_MVP_MACHINE_CALLER_ALLOWLIST: "ledger-orchestrator",
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.env = { ...originalEnv };
	});

	it("rejects SIRE autopilot route when no auth headers are provided", async () => {
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

	it("denies spoofable header-only context on sensitive SIRE autopilot route", async () => {
		const app = new Elysia().use(ledgerMvpModule);

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-user-id": "usr-viewer",
					"x-user-role": "viewer",
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify(buildSireAutopilotPayload("cmp-1")),
			}),
		);

		expect(response.status).toBe(401);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: false,
			code: "SESSION_REQUIRED",
		});

		const deniedMetric = register.getSingleMetric(
			"drenyra_api_ledger_mvp_access_denied_total",
		);
		const deniedValues = deniedMetric
			? ((await deniedMetric.get()).values ?? [])
			: [];
		const hasAuthDenied = deniedValues.some(
			(entry) =>
				entry.labels?.endpoint === "sire_autopilot_run" &&
				entry.labels?.reason === "auth" &&
				entry.value >= 1,
		);
		expect(hasAuthDenied).toBe(true);
	});

	it("rejects calls when company is outside Ledger MVP tenant allowlist", async () => {
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

	it("accepts calls when tenant and role are allowed and records success metrics", async () => {
		vi.spyOn(ledgerMvpService, "runSireAutopilot").mockResolvedValue({
			traceId: "trace-security-1",
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
		const now = Date.now().toString();
		const signature = createHmac(
			"sha256",
			process.env.DRENYRA_MACHINE_CALLER_SECRET as string,
		)
			.update(["ledger-orchestrator", now, "cmp-1", "admin"].join("."))
			.digest("hex");

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-ark-service-id": "ledger-orchestrator",
					"x-ark-service-role": "admin",
					"x-ark-service-company-id": "cmp-1",
					"x-ark-service-timestamp": now,
					"x-ark-service-signature": `sha256=${signature}`,
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify(buildSireAutopilotPayload("cmp-1")),
			}),
		);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload).toMatchObject({
			success: true,
			data: {
				status: "ready",
			},
		});

		const requestMetric = register.getSingleMetric(
			"drenyra_api_ledger_mvp_requests_total",
		);
		const requestValues = requestMetric
			? ((await requestMetric.get()).values ?? [])
			: [];
		const hasSuccess = requestValues.some(
			(entry) =>
				entry.labels?.endpoint === "sire_autopilot_run" &&
				entry.labels?.outcome === "success" &&
				entry.labels?.http_status === "200" &&
				entry.value >= 1,
		);
		expect(hasSuccess).toBe(true);
	});

	it("records SUNAT unavailable metric when SIRE autopilot runs in degraded mode", async () => {
		vi.spyOn(ledgerMvpService, "runSireAutopilot").mockResolvedValue({
			traceId: "trace-security-2",
			flow: "sire_autopilot",
			generatedAt: "2026-03-31T12:00:00.000Z",
			period: "2026-03",
			status: "manual_review",
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
					status: "unavailable",
					reason: "timeout",
					period: "2026-03",
					checkedAt: "2026-03-31T12:00:00.000Z",
					message: "No se pudo consultar SUNAT en tiempo real: ventas timeout",
					ledgers: [],
				},
				sunatCrossCheck: {
					status: "unavailable",
					reason: "timeout",
					recommendedAction: "manual_review",
				},
				sunatVsLocalGap: null,
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
			recommendedActions: ["Validar SUNAT SOL manualmente antes del cierre."],
		});

		const app = new Elysia().use(ledgerMvpModule);
		const now = Date.now().toString();
		const signature = createHmac(
			"sha256",
			process.env.DRENYRA_MACHINE_CALLER_SECRET as string,
		)
			.update(["ledger-orchestrator", now, "cmp-1", "admin"].join("."))
			.digest("hex");

		const response = await app.handle(
			new Request("http://localhost/api/ledger-mvp/sire-autopilot/run", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-ark-service-id": "ledger-orchestrator",
					"x-ark-service-role": "admin",
					"x-ark-service-company-id": "cmp-1",
					"x-ark-service-timestamp": now,
					"x-ark-service-signature": `sha256=${signature}`,
					"x-company-id": "cmp-1",
				},
				body: JSON.stringify(buildSireAutopilotPayload("cmp-1")),
			}),
		);

		expect(response.status).toBe(200);

		const unavailableMetric = register.getSingleMetric(
			"drenyra_api_ledger_mvp_sunat_live_unavailable_total",
		);
		const unavailableValues = unavailableMetric
			? ((await unavailableMetric.get()).values ?? [])
			: [];
		const hasTimeoutReason = unavailableValues.some(
			(entry) =>
				entry.labels?.endpoint === "sire_autopilot_run" &&
				entry.labels?.reason === "timeout" &&
				entry.value >= 1,
		);
		expect(hasTimeoutReason).toBe(true);
	});
});
