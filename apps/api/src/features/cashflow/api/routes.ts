/**
 * Cashflow API Routes
 *
 * Endpoints for cash flow projection, actual, and forecasting.
 *
 * @module cashflow/api
 */

import { Elysia, t } from "elysia";
import { companyScopeGuard } from "../../../shared/plugins";
import { ok } from "../../shared/api-response";
import { getActualCashflow } from "../application/queries/get-actual-cashflow.query";
import { getCashflowForecast } from "../application/queries/get-cashflow-forecast.query";
import { getCashflowProjection } from "../application/queries/get-cashflow-projection.query";
import { getCashflowVariance } from "../application/queries/get-cashflow-variance.query";

/**
 * Cashflow routes
 *
 * @example
 * ```ts
 * app.use(cashflowRoutes);
 * ```
 */
export const cashflowRoutes = new Elysia({ prefix: "/api/cashflow" })
	.use(companyScopeGuard({ allowHeaderFallback: true }))
	/**
	 * GET /api/cashflow/projection
	 *
	 * Get cashflow projection for a period
	 */
	.get(
		"/projection",
		async ({ query }) => {
			const projection = await getCashflowProjection({
				companyId: query.companyId,
				days: query.days ? Number(query.days) : undefined,
				currency: query.currency,
			});

			return ok(projection.toJSON());
		},
		{
			query: t.Object({
				companyId: t.String({ minLength: 1 }),
				days: t.Optional(t.Numeric({ minimum: 1, maximum: 365 })),
				currency: t.Optional(
					t.Union([t.Literal("PEN"), t.Literal("USD"), t.Literal("EUR")]),
				),
			}),
			detail: {
				summary: "Get cashflow projection",
				description: `
Returns projected cash inflows and outflows for a period.

**Includes:**
- Expected inflows (unpaid invoices)
- Expected outflows (unpaid bills)
- Net cash flow
- Weekly breakdown
- Overdue items

**Features:**
- Automatic currency conversion
- Overdue detection
- Week-by-week breakdown
- Deficit alerts
        `,
				tags: ["Cashflow"],
			},
		},
	)

	/**
	 * GET /api/cashflow/actual
	 *
	 * Get actual cashflow for a period
	 */
	.get(
		"/actual",
		async ({ query }) => {
			const actual = await getActualCashflow({
				companyId: query.companyId,
				startDate: new Date(query.startDate),
				endDate: new Date(query.endDate),
				currency: query.currency,
			});

			return ok(actual);
		},
		{
			query: t.Object({
				companyId: t.String(),
				startDate: t.String({ format: "date" }),
				endDate: t.String({ format: "date" }),
				currency: t.Optional(
					t.Union([t.Literal("PEN"), t.Literal("USD"), t.Literal("EUR")]),
				),
			}),
			detail: {
				summary: "Get actual cashflow",
				description:
					"Returns actual cash inflows and outflows for a historical period based on bank transactions",
				tags: ["Cashflow"],
			},
		},
	)

	/**
	 * GET /api/cashflow/forecast
	 *
	 * Get cashflow forecast using historical data
	 */
	.get(
		"/forecast",
		async ({ query }) => {
			const forecast = await getCashflowForecast({
				companyId: query.companyId,
				months: query.months ? Number(query.months) : undefined,
				currency: query.currency,
			});

			return ok(forecast);
		},
		{
			query: t.Object({
				companyId: t.String(),
				months: t.Optional(t.Numeric({ minimum: 1, maximum: 12 })),
				currency: t.Optional(
					t.Union([t.Literal("PEN"), t.Literal("USD"), t.Literal("EUR")]),
				),
			}),
			detail: {
				summary: "Get cashflow forecast",
				description: `
Returns cashflow forecast based on historical bank transaction trends.

**Methods:**
- Historical average
- Trend analysis
- Seasonal adjustments (optional)

**Future:** AI-powered forecasting with Agent Swarm
        `,
				tags: ["Cashflow"],
			},
		},
	)

	/**
	 * GET /api/cashflow/variance
	 *
	 * Compare projected vs actual cashflow
	 */
	.get(
		"/variance",
		async ({ query }) => {
			const variance = await getCashflowVariance({
				companyId: query.companyId,
				startDate: new Date(query.startDate),
				endDate: new Date(query.endDate),
				currency: query.currency,
			});

			return ok(variance);
		},
		{
			query: t.Object({
				companyId: t.String(),
				startDate: t.String({ format: "date" }),
				endDate: t.String({ format: "date" }),
				currency: t.Optional(
					t.Union([t.Literal("PEN"), t.Literal("USD"), t.Literal("EUR")]),
				),
			}),
			detail: {
				summary: "Get cashflow variance analysis",
				description:
					"Compares projected vs actual cashflow to identify variances",
				tags: ["Cashflow"],
			},
		},
	);
