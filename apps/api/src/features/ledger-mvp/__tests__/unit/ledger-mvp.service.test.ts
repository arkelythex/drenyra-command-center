import type {
	ComplianceDashboard,
	ComplianceIssue,
	ComplianceReproducibilityReport,
	IGVSummary,
	SIRESummary,
	SIRESunatLiveSummary,
} from "@drenyra/domain";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PseProactiveValidatorService } from "../../../pse-compliance/pse-proactive-validator.service";
import type {
	BalanceSheetReport,
	CashFlowReport,
	ProfitLossReport,
} from "../../../reports/reports.schemas";
import type {
	Pdt621Input,
	Pdt621Result,
} from "../../../taxation/pdt-621.service";
import { LedgerMvpService } from "../../ledger-mvp.service";

function createReproducibilityReport(
	overrides?: Partial<ComplianceReproducibilityReport>,
): ComplianceReproducibilityReport {
	return {
		period: "2026-03",
		companyId: "cmp-1",
		reproducible: true,
		coverage: "COMPLETE_DATA",
		sire: {
			recordCount: 10,
			totalAmount: 1000,
			totalIGV: 180,
		},
		ledger: {
			recordCount: 10,
			totalAmount: 1000,
			totalIGV: 180,
		},
		differences: {
			recordCount: 0,
			totalAmount: 0,
			totalIGV: 0,
		},
		tolerances: {
			recordCount: 0,
			totalAmount: 0.01,
			totalIGV: 0.01,
		},
		...overrides,
	};
}

function createIgvSummary(overrides?: Partial<IGVSummary>): IGVSummary {
	return {
		period: "2026-03",
		sales: "1000.00",
		purchases: "200.00",
		igvSales: "180.00",
		igvPurchases: "36.00",
		igvToPay: "144.00",
		igvToRefund: "0.00",
		...overrides,
	};
}

function createSireSummary(overrides?: Partial<SIRESummary>): SIRESummary {
	return {
		period: "2026-03",
		recordCount: 10,
		totalAmount: 1000,
		totalIGV: 180,
		currency: "PEN",
		generatedAt: new Date("2026-03-31T12:00:00.000Z"),
		...overrides,
	};
}

function createProfitLoss(
	overrides?: Partial<ProfitLossReport>,
): ProfitLossReport {
	return {
		period: {
			startDate: new Date("2026-03-01T00:00:00.000Z"),
			endDate: new Date("2026-03-31T23:59:59.000Z"),
		},
		revenue: "1000.00",
		expenses: "300.00",
		netIncome: "700.00",
		...overrides,
	};
}

function createBalanceSheet(
	overrides?: Partial<BalanceSheetReport>,
): BalanceSheetReport {
	return {
		asOfDate: new Date("2026-03-31T23:59:59.000Z"),
		assets: { total: "1500.00" },
		liabilities: { total: "400.00" },
		equity: { total: "1100.00" },
		...overrides,
	};
}

function createCashFlow(overrides?: Partial<CashFlowReport>): CashFlowReport {
	return {
		period: {
			startDate: new Date("2026-03-01T00:00:00.000Z"),
			endDate: new Date("2026-03-31T23:59:59.000Z"),
		},
		operating: "700.00",
		investing: "0.00",
		financing: "0.00",
		netCashFlow: "700.00",
		...overrides,
	};
}

function createDashboard(
	overrides?: Partial<ComplianceDashboard>,
): ComplianceDashboard {
	return {
		score: 95,
		totalIssues: 0,
		criticalIssues: 0,
		highIssues: 0,
		mediumIssues: 0,
		lowIssues: 0,
		sunatStatus: "COMPLIANT",
		lastAudit: new Date("2026-03-31T23:59:59.000Z"),
		...overrides,
	};
}

function createService() {
	const verifySireReproducibility =
		vi.fn<
			(input: {
				companyId: string;
				year: number;
				month: number;
				totalTolerance?: number;
				igvTolerance?: number;
				recordTolerance?: number;
			}) => Promise<ComplianceReproducibilityReport>
		>();

	const getIgvSummary =
		vi.fn<
			(companyId: string, year: number, month: number) => Promise<IGVSummary>
		>();
	const getSireSummary =
		vi.fn<
			(companyId: string, year: number, month: number) => Promise<SIRESummary>
		>();
	const getSunatLiveSummary =
		vi.fn<
			(input: {
				companyId: string;
				period: string;
				ruc: string;
			}) => Promise<SIRESunatLiveSummary>
		>();

	const getProfitLoss =
		vi.fn<
			(
				companyId: string,
				startDate: Date,
				endDate: Date,
			) => Promise<ProfitLossReport>
		>();

	const getBalanceSheet =
		vi.fn<(companyId: string, asOfDate: Date) => Promise<BalanceSheetReport>>();

	const getCashFlow =
		vi.fn<
			(
				companyId: string,
				startDate: Date,
				endDate: Date,
			) => Promise<CashFlowReport>
		>();

	const getComplianceDashboard =
		vi.fn<(companyId: string) => Promise<ComplianceDashboard>>();

	const getComplianceIssues =
		vi.fn<(companyId: string) => Promise<ComplianceIssue[]>>();

	const validatePseCompliance =
		vi.fn<
			(
				input: Parameters<PseProactiveValidatorService["validate"]>[0],
			) => Promise<
				Awaited<ReturnType<PseProactiveValidatorService["validate"]>>
			>
		>();

	const pdtBuilder = vi.fn<(input: Pdt621Input) => Pdt621Result>();

	const service = new LedgerMvpService({
		verifySireReproducibility,
		getIgvSummary,
		getSireSummary,
		getSunatLiveSummary,
		getProfitLoss,
		getBalanceSheet,
		getCashFlow,
		getComplianceDashboard,
		getComplianceIssues,
		validatePseCompliance,
		pdtBuilder,
		traceIdFactory: () => "trace-test",
		nowFactory: () => new Date("2026-03-31T12:00:00.000Z"),
	});

	return {
		service,
		verifySireReproducibility,
		getIgvSummary,
		getSireSummary,
		getSunatLiveSummary,
		getProfitLoss,
		getBalanceSheet,
		getCashFlow,
		getComplianceDashboard,
		getComplianceIssues,
		validatePseCompliance,
		pdtBuilder,
	};
}

describe("LedgerMvpService", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns ready for SIRE autopilot when reconciliation is reproducible", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport(),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "available",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "Resumen SUNAT API consultado en tiempo real.",
			ledgers: [
				{
					ledgerType: "ventas",
					recordCount: 10,
					totalAmount: 1000,
					totalIGV: 180,
				},
				{ ledgerType: "compras", recordCount: 0, totalAmount: 0, totalIGV: 0 },
			],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.status).toBe("ready");
		expect(result.traceId).toBe("trace-test");
		expect(result.evidence.sireSummary.recordCount).toBe(10);
		expect(result.evidence.sunatLiveSummary.status).toBe("available");
		expect(result.evidence.sunatCrossCheck).toEqual({
			status: "matched",
			reason: "not_applicable",
			recommendedAction: "auto_continue",
		});
		expect(result.evidence.sunatVsLocalGap).toEqual({
			recordCount: 0,
			totalAmount: 0,
			totalIGV: 0,
		});
		expect(result.evidence.pdt621Prefill.casillas["185"]).toBe(144);
		expect(ctx.pdtBuilder).toHaveBeenCalledTimes(1);
	});

	it("returns blocked for SIRE autopilot when gaps exceed blocking thresholds", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport({
				reproducible: false,
				differences: {
					recordCount: 31,
					totalAmount: 1500,
					totalIGV: 400,
				},
			}),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "available",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "Resumen SUNAT API consultado en tiempo real.",
			ledgers: [
				{
					ledgerType: "ventas",
					recordCount: 10,
					totalAmount: 1000,
					totalIGV: 180,
				},
				{ ledgerType: "compras", recordCount: 0, totalAmount: 0, totalIGV: 0 },
			],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.status).toBe("blocked");
		expect(result.recommendedActions).toContain(
			"Bloquear envío automático y requerir aprobación HITL del supervisor.",
		);
	});

	it("returns manual_review when SUNAT live summary diverges from local totals", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport(),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "available",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "Resumen SUNAT API consultado en tiempo real.",
			ledgers: [
				{
					ledgerType: "ventas",
					recordCount: 9,
					totalAmount: 980,
					totalIGV: 176.4,
				},
				{ ledgerType: "compras", recordCount: 0, totalAmount: 0, totalIGV: 0 },
			],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.status).toBe("manual_review");
		expect(result.evidence.sunatCrossCheck).toEqual({
			status: "mismatch",
			reason: "not_applicable",
			recommendedAction: "manual_review",
		});
		expect(result.recommendedActions).toContain(
			"Resolver diferencias entre conciliación local y SUNAT API en tiempo real.",
		);
	});

	it("maps missing_config SUNAT unavailable path into typed cross-check contract", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport(),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "unavailable",
			reason: "missing_config",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "No hay configuración SUNAT.",
			ledgers: [],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.evidence.sunatLiveSummary.status).toBe("unavailable");
		expect(result.evidence.sunatCrossCheck).toEqual({
			status: "unavailable",
			reason: "missing_config",
			recommendedAction: "manual_review",
		});
		expect(result.recommendedActions).toContain(
			"Validar resumen del periodo en SUNAT SOL de forma manual antes de enviar PDT 621.",
		);
	});

	it("maps timeout SUNAT unavailable path into typed cross-check contract", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport(),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "unavailable",
			reason: "timeout",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "Timeout en SUNAT API.",
			ledgers: [],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.evidence.sunatCrossCheck).toEqual({
			status: "unavailable",
			reason: "timeout",
			recommendedAction: "manual_review",
		});
		expect(result.recommendedActions).toContain(
			"Reintentar consulta SUNAT API con ventana de recuperación antes del cierre.",
		);
	});

	it("maps upstream_error SUNAT unavailable path into typed cross-check contract", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport(),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "unavailable",
			reason: "upstream_error",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "Error de upstream SUNAT.",
			ledgers: [],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.evidence.sunatCrossCheck).toEqual({
			status: "unavailable",
			reason: "upstream_error",
			recommendedAction: "manual_review",
		});
		expect(result.recommendedActions).toContain(
			"Reintentar consulta SUNAT API con ventana de recuperación antes del cierre.",
		);
	});

	it("keeps auth-specific fallback actions when SUNAT auth is unavailable", async () => {
		const ctx = createService();

		ctx.verifySireReproducibility.mockResolvedValue(
			createReproducibilityReport(),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());
		ctx.getSireSummary.mockResolvedValue(createSireSummary());
		ctx.getSunatLiveSummary.mockResolvedValue({
			source: "sunat-api",
			status: "unavailable",
			reason: "auth_unavailable",
			period: "2026-03",
			checkedAt: "2026-03-31T12:00:00.000Z",
			message: "No hay token SUNAT disponible.",
			ledgers: [],
		});
		ctx.pdtBuilder.mockReturnValue({
			ruc: "20100070970",
			period: "2026-03",
			razonSocial: "Demo SAC",
			casillas: {
				"100": 1000,
				"105": 180,
				"107": 0,
				"120": 200,
				"125": 36,
				"169": 0,
				"185": 144,
			},
			igvResultante: 144,
			status: "a_pagar",
			generatedAt: "2026-03-31T12:00:00.000Z",
			warnings: [],
		});

		const result = await ctx.service.runSireAutopilot({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			razonSocial: "Demo SAC",
			percepcionesCents: 0,
			retencionesCents: 0,
		});

		expect(result.evidence.sunatCrossCheck).toEqual({
			status: "unavailable",
			reason: "auth_error",
			recommendedAction: "manual_review",
		});
		expect(result.recommendedActions).toContain(
			"Renovar credenciales OAuth SUNAT antes del siguiente intento automático.",
		);
	});

	it("returns manual_review for NPIF basic when period has no accounting movement", async () => {
		const ctx = createService();

		ctx.getProfitLoss.mockResolvedValue(
			createProfitLoss({
				revenue: "0.00",
				expenses: "0.00",
				netIncome: "0.00",
			}),
		);
		ctx.getBalanceSheet.mockResolvedValue(
			createBalanceSheet({
				assets: { total: "0.00" },
				liabilities: { total: "0.00" },
				equity: { total: "0.00" },
			}),
		);
		ctx.getCashFlow.mockResolvedValue(
			createCashFlow({
				operating: "0.00",
				netCashFlow: "0.00",
			}),
		);
		ctx.getIgvSummary.mockResolvedValue(createIgvSummary());

		const result = await ctx.service.generateNpifBasic({
			companyId: "cmp-1",
			period: "2026-03",
		});

		expect(result.status).toBe("manual_review");
		expect(result.warnings).toHaveLength(1);
		expect(result.warnings[0]).toContain("asistido, no autónomo");
		expect(result.warnings[0]).toContain("validación contable manual");
	});

	it("keeps mandatory NPIF warning even when warning-disable flags are enabled", async () => {
		const originalDisableWarning = process.env.LEDGER_MVP_DISABLE_NPIF_WARNING;
		const originalLegacyDisableWarning =
			process.env.FLUX_MVP_DISABLE_NPIF_WARNING;

		process.env.LEDGER_MVP_DISABLE_NPIF_WARNING = "true";
		process.env.FLUX_MVP_DISABLE_NPIF_WARNING = "1";

		try {
			const ctx = createService();

			ctx.getProfitLoss.mockResolvedValue(createProfitLoss());
			ctx.getBalanceSheet.mockResolvedValue(createBalanceSheet());
			ctx.getCashFlow.mockResolvedValue(createCashFlow());
			ctx.getIgvSummary.mockResolvedValue(createIgvSummary());

			const result = await ctx.service.generateNpifBasic({
				companyId: "cmp-1",
				period: "2026-03",
			});

			expect(result.status).toBe("ready");
			expect(result.warnings).toContain(
				"Resultado NPIF asistido, no autónomo: requiere validación contable manual del contador antes de presentación oficial.",
			);
		} finally {
			if (originalDisableWarning === undefined) {
				delete process.env.LEDGER_MVP_DISABLE_NPIF_WARNING;
			} else {
				process.env.LEDGER_MVP_DISABLE_NPIF_WARNING = originalDisableWarning;
			}

			if (originalLegacyDisableWarning === undefined) {
				delete process.env.FLUX_MVP_DISABLE_NPIF_WARNING;
			} else {
				process.env.FLUX_MVP_DISABLE_NPIF_WARNING =
					originalLegacyDisableWarning;
			}
		}
	});

	it("returns blocked for monitor fiscal when there is at least one critical issue", async () => {
		const ctx = createService();

		ctx.validatePseCompliance.mockResolvedValue({
			companyId: "cmp-1",
			period: "2026-03",
			status: "ready",
			confidence: 0.9,
			checks: [],
			proactiveAlerts: [
				{
					level: "warning",
					message: "Brecha IGV detectada: S/ 12.00.",
					action: "Recalcular IGV y alinear PDT 621 antes del envio.",
				},
				{
					level: "info",
					message:
						"OPENROUTER credentials missing; using deterministic fallback alerts.",
					action:
						"Configurar OpenRouter para habilitar alertas AI enriquecidas en producción.",
				},
			],
			recommendedActions: ["Continuar con envio PSE de forma automatizada."],
			execution: {
				targetMs: 5000,
				durationMs: 100,
				withinTarget: true,
				mode: "parallel-subagents",
			},
		});
		ctx.getComplianceDashboard.mockResolvedValue(createDashboard());
		ctx.getComplianceIssues.mockResolvedValue([
			{
				id: "iss-1",
				companyId: "cmp-1",
				type: "MISSING_SUNAT",
				severity: "CRITICAL",
				title: "Critical test issue",
				description: "Must block",
				createdAt: new Date("2026-03-31T00:00:00.000Z"),
			},
		]);

		const result = await ctx.service.runMonitorFiscal({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			ple: {
				salesRecords: 10,
				purchaseRecords: 5,
				salesTotalCents: 100_000,
				purchaseTotalCents: 30_000,
			},
			pdt: {
				form: "621",
				declaredIgvCents: 18_000,
				declaredNetSalesCents: 100_000,
			},
			sire: {
				rvieRecords: 10,
				rceRecords: 5,
				accepted: true,
			},
		});

		expect(result.status).toBe("blocked");
		expect(result.alerts).toHaveLength(2);
		expect(Object.keys(result.alerts[0]).sort()).toEqual(
			[
				"id",
				"severity",
				"category",
				"message",
				"confidence",
				"source",
				"recommendedAction",
			].sort(),
		);
		expect(result.alerts[0]).toMatchObject({
			id: "2026-03-heuristic-1",
			severity: "warning",
			category: "igv",
			message: "Brecha IGV detectada: S/ 12.00.",
			confidence: 0.9,
			source: "heuristic",
			recommendedAction: "Recalcular IGV y alinear PDT 621 antes del envio.",
		});
		expect(result.recommendedActions).toContain(
			"Resolver issues CRITICAL antes de enviar cualquier declaración SUNAT.",
		);
	});

	it("returns runtime-normalized AI alerts for monitor fiscal when proactive alerts do not include heuristic openrouter markers", async () => {
		const ctx = createService();

		ctx.validatePseCompliance.mockResolvedValue({
			companyId: "cmp-1",
			period: "2026-03",
			status: "ready",
			confidence: 0.92,
			checks: [],
			proactiveAlerts: [
				{
					level: "warning",
					message: "Brecha IGV detectada en consolidado mensual: S/ 7.80.",
					action:
						"Revisar libro ventas y recalcular base imponible para PDT 621.",
				},
				{
					level: "info",
					message:
						"Inconsistencia leve entre RVIE y resumen interno de compras.",
					action: "Conciliar RVIE/RCE y documentar sustento antes del cierre.",
				},
			],
			recommendedActions: [
				"Registrar evidencia de conciliación fiscal en expediente.",
			],
			execution: {
				targetMs: 5000,
				durationMs: 120,
				withinTarget: true,
				mode: "parallel-subagents",
			},
		});
		ctx.getComplianceDashboard.mockResolvedValue(createDashboard());
		ctx.getComplianceIssues.mockResolvedValue([]);

		const result = await ctx.service.runMonitorFiscal({
			companyId: "cmp-1",
			period: "2026-03",
			ruc: "20100070970",
			ple: {
				salesRecords: 10,
				purchaseRecords: 5,
				salesTotalCents: 100_000,
				purchaseTotalCents: 30_000,
			},
			pdt: {
				form: "621",
				declaredIgvCents: 18_000,
				declaredNetSalesCents: 100_000,
			},
			sire: {
				rvieRecords: 10,
				rceRecords: 5,
				accepted: true,
			},
		});

		expect(result.status).toBe("ready");
		expect(result.alerts).toHaveLength(2);
		expect(Object.keys(result.alerts[0]).sort()).toEqual(
			[
				"id",
				"severity",
				"category",
				"message",
				"confidence",
				"source",
				"recommendedAction",
			].sort(),
		);
		expect(result.alerts[0]).toMatchObject({
			id: "2026-03-ai-1",
			severity: "warning",
			category: "igv",
			message: "Brecha IGV detectada en consolidado mensual: S/ 7.80.",
			confidence: 0.92,
			source: "ai",
			recommendedAction:
				"Revisar libro ventas y recalcular base imponible para PDT 621.",
		});
		expect(result.alerts[1]).toMatchObject({
			id: "2026-03-ai-2",
			source: "ai",
		});
		expect(ctx.validatePseCompliance).toHaveBeenCalledTimes(1);
		expect(ctx.getComplianceDashboard).toHaveBeenCalledTimes(1);
		expect(ctx.getComplianceIssues).toHaveBeenCalledTimes(1);
	});
});
