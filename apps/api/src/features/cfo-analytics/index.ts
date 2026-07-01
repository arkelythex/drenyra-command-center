import { Elysia } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import {
	CfoDateRangeQuerySchema,
	CfoPeriodQuerySchema,
	CfoQuerySchema,
	GenerateReportSchema,
	SaveConfigSchema,
} from "./cfo-analytics.schemas";
import { ClientAnalyticsService } from "./services/client-analytics.service";
import { DashboardService } from "./services/dashboard.service";
import { FinancialKPIsService } from "./services/financial-kpis.service";
import { ReportsService } from "./services/reports.service";
import { TaxAnalyticsService } from "./services/tax-analytics.service";

export type {
	ClientSummaryKPIs,
	DashboardConfig,
	DashboardKPIs,
	ExpenseKPIs,
	LiquidityKPIs,
	ProfitKPIs,
	ReportResult,
	RevenueKPIs,
	TaxKPISummary,
} from "./cfo-analytics.types";
export { ClientAnalyticsService } from "./services/client-analytics.service";
export { DashboardService } from "./services/dashboard.service";
export { FinancialKPIsService } from "./services/financial-kpis.service";
export { ReportsService } from "./services/reports.service";
export { TaxAnalyticsService } from "./services/tax-analytics.service";

export const cfoAnalyticsModule = new Elysia({ prefix: "/api/cfo" })
	.use(companyScopeGuard())
	.onError(({ code, error, set }) => {
		if (code === "VALIDATION") {
			set.status = 422;
			return fail("Invalid CFO analytics parameters", "VALIDATION_ERROR");
		}

		set.status = 500;
		return fail(getErrorMessage(error), "INTERNAL_ERROR");
	})

	.get(
		"/dashboard",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await DashboardService.getDashboardKPIs(
				companyId,
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Dashboard Completo CFO",
				description:
					"KPIs principales del CFO: revenue, expenses, profit, liquidity, tax, clients",
			},
		},
	)

	.get(
		"/dashboard/config",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const config = await DashboardService.getDashboardConfig(companyId);
			return ok(config);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Obtener Config Dashboard",
				description: "Restaurar la configuración guardada del dashboard",
			},
		},
	)

	.post(
		"/dashboard/config",
		async ({ body, companyContext }) => {
			const companyId = companyContext?.companyId || body.companyId;
			const dashboard = await DashboardService.saveDashboardConfig(
				companyId,
				body.name,
				body.config,
				companyContext?.userId,
			);
			return ok(dashboard);
		},
		{
			body: SaveConfigSchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Guardar Config Dashboard",
				description: "Guardar la configuración de widgets del dashboard",
			},
		},
	)

	.get(
		"/kpis/revenue",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await FinancialKPIsService.getRevenueKPIs(
				companyId,
				query.period || "monthly",
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoPeriodQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Revenue KPIs",
				description: "Ingresos por período (mensual/trimestral/anual)",
			},
		},
	)

	.get(
		"/kpis/expenses",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await FinancialKPIsService.getExpenseKPIs(
				companyId,
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Expenses KPIs",
				description: "Desglose de gastos y tendencias",
			},
		},
	)

	.get(
		"/kpis/profit",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await FinancialKPIsService.getProfitKPIs(
				companyId,
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Profit KPIs",
				description: "Tendencia de ganancias y margen",
			},
		},
	)

	.get(
		"/kpis/liquidity",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await FinancialKPIsService.getLiquidityKPIs(
				companyId,
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Liquidity KPIs",
				description: "Ratios de liquidez (current ratio, quick ratio)",
			},
		},
	)

	.get(
		"/tax/compliance",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const score = await TaxAnalyticsService.getComplianceScore(
				companyId,
				query.currency,
			);
			return ok({ complianceScore: score });
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Tax Compliance Score",
				description: "Score de cumplimiento tributario por período",
			},
		},
	)

	.get(
		"/tax/upcoming",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const deadlines =
				await TaxAnalyticsService.getUpcomingDeadlines(companyId);
			return ok(deadlines);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Próximas Fechas Tributarias",
				description: "Próximos vencimientos SUNAT",
			},
		},
	)

	.get(
		"/tax/liability",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await TaxAnalyticsService.getTaxLiabilityProjection(
				companyId,
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Proyección Tributaria",
				description: "Proyección de obligaciones tributarias (IGV)",
			},
		},
	)

	.get(
		"/clients/summary",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await ClientAnalyticsService.getClientSummary(
				companyId,
				query.currency,
			);
			return ok(result);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Client Summary",
				description: "Resumen de clientes: activos, nuevos, churn",
			},
		},
	)

	.get(
		"/clients/profitability",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const result = await ClientAnalyticsService.getClientSummary(
				companyId,
				query.currency,
			);
			return ok(result.clientProfitability);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Client Profitability",
				description: "Rentabilidad por cliente",
			},
		},
	)

	.post(
		"/reports/generate",
		async ({ body, companyContext }) => {
			const companyId = companyContext?.companyId || body.companyId;
			const result = await ReportsService.generateReport(
				companyId,
				body.type as "financial" | "tax" | "client" | "custom",
				body.period,
				body.parameters,
				companyContext?.userId,
			);
			return ok(result);
		},
		{
			body: GenerateReportSchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Generar Reporte",
				description: "Generar un reporte personalizado",
			},
		},
	)

	.get(
		"/reports",
		async ({ query, companyContext }) => {
			const companyId = companyContext?.companyId || query.companyId;
			const reports = await ReportsService.listReports(companyId);
			return ok(reports);
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Listar Reportes",
				description: "Listar reportes generados",
			},
		},
	)

	.get(
		"/reports/:id/download",
		async ({ params, companyContext, query, set }) => {
			const report = await ReportsService.getReportDownload(params.id);

			if (!report) {
				set.status = 404;
				return fail("Report not found", "NOT_FOUND");
			}

			if (report.fileUrl) {
				set.redirect = report.fileUrl;
				return;
			}

			return ok({
				id: report.id,
				type: report.type,
				status: report.status,
				period: report.period,
				generatedAt: report.generatedAt?.toISOString(),
				message:
					"No file URL available. Report data can be re-fetched via KPI endpoints.",
			});
		},
		{
			query: CfoQuerySchema,
			detail: {
				tags: ["CFO Analytics"],
				summary: "Descargar Reporte",
				description: "Descargar un reporte generado por ID",
			},
		},
	);
