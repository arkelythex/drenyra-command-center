import { Elysia, t } from "elysia";
import { fail, getErrorMessage, ok } from "../../shared/api-response";
import { companyScopeGuard } from "../../../shared/plugins";
import { InboxDashboardService } from "./inbox-dashboard.service";
import { getExpenses } from "../application/queries/get-expenses.query";
import { getFiscalIndicators } from "../application/queries/get-fiscal-indicators.query";
import { getIncome } from "../application/queries/get-income.query";
import { getLiquidity } from "../application/queries/get-liquidity.query";
import { getOverview } from "../application/queries/get-overview.query";
import { getSireStatus } from "../application/queries/get-sire-status.query";
import { getSystemStatus } from "../application/queries/get-system-status.query";
import { getTaxCalendar } from "../application/queries/get-tax-calendar.query";
import {
	DateRangeQuerySchema,
	LiquidityQuerySchema,
	OverviewQuerySchema,
	SireStatusQuerySchema,
	TaxCalendarQuerySchema,
} from "./dashboard.schemas";

/**
 * dashboardRoutes const.
 *
 * @example
 * ```ts
 * console.log(dashboardRoutes);
 * ```
 */
export const dashboardRoutes = new Elysia({ prefix: "/api/dashboard" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	.get("/system-status", async () => ok(await getSystemStatus()), {
		detail: { tags: ["Dashboard"], summary: "System health status" },
	})
	.get("/fiscal-indicators", async () => ok(await getFiscalIndicators()), {
		detail: { tags: ["Dashboard"], summary: "Exchange rate and UIT" },
	})
	.get(
		"/overview",
		async ({ query }) => {
			try {
				return ok(await getOverview(query.companyId));
			} catch (error) {
				return fail("Failed to get overview", "OVERVIEW_ERROR", {
					details: getErrorMessage(error, "Unknown"),
				});
			}
		},
		{
			query: OverviewQuerySchema,
			detail: {
				tags: ["Dashboard"],
				summary: "Dashboard overview (Resumen tab)",
			},
		},
	)
	.get(
		"/liquidity",
		async ({ query }) => {
			try {
				return ok(
					await getLiquidity(query.companyId, Number(query.months) || 12),
				);
			} catch (error) {
				return fail("Failed to get liquidity", "LIQUIDITY_ERROR", {
					details: getErrorMessage(error, "Unknown"),
				});
			}
		},
		{
			query: LiquidityQuerySchema,
			detail: {
				tags: ["Dashboard"],
				summary: "Cash flow / liquidity chart data",
			},
		},
	)
	.get(
		"/tax-calendar",
		async ({ query }) => {
			try {
				return ok(
					await getTaxCalendar(
						query.companyId,
						query.month ? Number(query.month) : undefined,
						query.year ? Number(query.year) : undefined,
					),
				);
			} catch (error) {
				return fail("Failed to get tax calendar", "TAX_CALENDAR_ERROR", {
					details: getErrorMessage(error, "Unknown"),
				});
			}
		},
		{
			query: TaxCalendarQuerySchema,
			detail: {
				tags: ["Dashboard"],
				summary: "SUNAT tax calendar obligations",
			},
		},
	)
	.get(
		"/sire-status",
		async ({ query }) => {
			try {
				return ok(await getSireStatus(query.companyId, query.period));
			} catch (error) {
				return fail("Failed to get SIRE status", "SIRE_STATUS_ERROR", {
					details: getErrorMessage(error, "Unknown"),
				});
			}
		},
		{
			query: SireStatusQuerySchema,
			detail: { tags: ["Dashboard"], summary: "SIRE matching status" },
		},
	)
	.get(
		"/expenses",
		async ({ query }) => {
			try {
				return ok(
					await getExpenses(
						query.companyId,
						query.startDate ? new Date(query.startDate) : undefined,
						query.endDate ? new Date(query.endDate) : undefined,
					),
				);
			} catch (error) {
				return fail("Failed to get expenses", "EXPENSES_ERROR", {
					details: getErrorMessage(error, "Unknown"),
				});
			}
		},
		{
			query: DateRangeQuerySchema,
			detail: {
				tags: ["Dashboard"],
				summary: "Expense analytics (Gastos tab)",
			},
		},
	)
	.get(
		"/income",
		async ({ query }) => {
			try {
				return ok(
					await getIncome(
						query.companyId,
						query.startDate ? new Date(query.startDate) : undefined,
						query.endDate ? new Date(query.endDate) : undefined,
					),
				);
			} catch (error) {
				return fail("Failed to get income", "INCOME_ERROR", {
					details: getErrorMessage(error, "Unknown"),
				});
			}
		},
		{
			query: DateRangeQuerySchema,
			detail: {
				tags: ["Dashboard"],
				summary: "Income analytics (Ingresos tab)",
			},
		},
	)
	.get(
		"/control-tower",
		async ({ query, set }) => {
			try {
				const { ControlTowerService } = await import(
					"../application/services/control-tower.service"
				);
				return ok(
					await ControlTowerService.getPortfolio({
						ownerCompanyId: query.companyId,
						period: query.period,
					}),
				);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "CONTROL_TOWER_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				period: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Dashboard"],
				summary: "Multi-RUC control tower portfolio view",
			},
		},
	)
	.get(
		"/inbox",
		async ({ query, set }) => {
			try {
				const dashboard = await InboxDashboardService.getDashboard(
					query.companyId,
				);
				return ok(dashboard);
			} catch (error) {
				set.status = 500;
				return fail(getErrorMessage(error), "INBOX_ERROR");
			}
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
			}),
			detail: {
				tags: ["Dashboard"],
				summary: "Inbox dashboard for monthly close center",
			},
		},
	);
