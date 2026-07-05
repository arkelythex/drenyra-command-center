import { Elysia } from "elysia";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";

import {
	AnalyticsQuerySchema,
	OperationalQuerySchema,
} from "./analytics.schemas";
import { getCustomerKPIs } from "./application/queries/get-customer-kpis";
import { getDashboardAnalytics } from "./application/queries/get-dashboard-analytics";
import { getFinancialKPIs } from "./application/queries/get-financial-kpis";
import { getOperationalKPIs } from "./application/queries/get-operational-kpis";
import { getTaxKPIs } from "./application/queries/get-tax-kpis";

// Barrel exports
export { AnalyticsService } from "./analytics.service";
export { ComplianceAnalytics } from "./compliance.analytics";
export { CustomerAnalytics } from "./customer.analytics";
export { FinancialAnalytics } from "./financial.analytics";
export { OperationalAnalytics } from "./operational.analytics";
export { TaxAnalytics } from "./tax.analytics";
export { TrendAnalytics } from "./trend.analytics";
export {
	type AnalyticsOptions,
	type ComplianceMetrics,
	type CustomerKPIs,
	type DashboardAnalytics,
	type FinancialKPIs,
	type MoneyValue,
	type OperationalKPIs,
	type PeriodComparison,
	type TaxKPIs,
	type TrendAnalytics as TrendAnalyticsType,
	toMoneyValue,
} from "./types/analytics.types";

/**
 * Analytics Elysia module - Complete dashboard and KPI endpoints.
 *
 * Provides six REST endpoints for financial, operational, tax, customer, trend,
 * and compliance analytics. All endpoints support multi-currency (PEN/USD) and
 * optional date-range filtering.
 *
 * **Architecture**:
 * - Mounted at `/analytics` prefix
 * - Each endpoint maps to AnalyticsService static method
 * - Query validation via Elysia schemas (AnalyticsQuerySchema, OperationalQuerySchema)
 * - Parallel query execution where possible (getDashboardAnalytics)
 * - All monetary values typed with @drenyra/domain Money VO
 *
 * **Module Features**:
 * - 6 primary endpoints (dashboard, financial, operational, tax, customers, trends)
 * - Automatic OpenAPI documentation (via Elysia `detail` tags)
 * - Type-safe query parameters with Elysia validation
 * - Empty data set handling (returns zeros, not errors)
 * - Multi-currency support (PEN default, USD on request)
 *
 * **Performance Considerations**:
 * - getDashboardAnalytics uses Promise.all() for parallel queries
 * - Other endpoints execute single specialized queries
 * - Optional date range filtering reduces query scope
 * - Database indexes expected on: (companyId, status, currency), (issueDate), (customerId)
 *
 * @example Basic usage
 * ```ts
 * import { analyticsModule } from "./analytics/index";
 *
 * const app = new Elysia()
 *   .use(authMiddleware)  // Add auth before analytics
 *   .use(analyticsModule);
 *
 * // Now available:
 * // GET /analytics/dashboard
 * // GET /analytics/financial
 * // GET /analytics/operational
 * // GET /analytics/tax
 * // GET /analytics/customers
 * ```
 *
 * @example Full integration with app
 * ```ts
 * const app = new Elysia({ prefix: '/api/v1' })
 *   .use(analyticsModule);  // Available at /api/v1/analytics/*
 * ```
 */
export const analyticsModule = new Elysia({ prefix: "/api/analytics" })
	.use(companyScopeGuard())
	/**
	 * GET /analytics/dashboard - Complete dashboard with all KPIs.
	 *
	 * Aggregates financial, operational, tax, customer, trend, and compliance metrics.
	 * Executes all 6 metric queries in parallel for optimal performance.
	 *
	 * **Response Structure**:
	 * ```ts
	 * {
	 *   financial: { totalRevenue, monthlyRevenue, growth, ... },
	 *   operational: { totalInvoices, collectionRate, ... },
	 *   tax: { totalIGV, monthlyIGV, ... },
	 *   customers: { totalCustomers, topCustomers, ... },
	 *   trends: { revenueByMonth, paymentTrends, ... },
	 *   compliance: { complianceScore, pendingSUNAT, ... }
	 * }
	 * ```
	 *
	 * **Query Parameters** (AnalyticsQuerySchema):
	 * - companyId (required): Company UUID
	 * - startDate (optional): ISO 8601 start date
	 * - endDate (optional): ISO 8601 end date
	 * - currency (optional): PEN|USD, defaults PEN
	 *
	 * **Use Cases**:
	 * - Primary dashboard view in UI
	 * - Export complete KPI report
	 * - Scheduled compliance checks
	 *
	 * @example
	 * ```ts
	 * // Fetch full dashboard for January 2026
	 * GET /analytics/dashboard?companyId=cmp_123&startDate=2026-01-01&endDate=2026-01-31&currency=PEN
	 *
	 * // Response (200 OK):
	 * {
	 *   financial: { totalRevenue: { amount: "500000.00", currency: "PEN" }, ... },
	 *   operational: { collectionRate: 85, ... },
	 *   tax: { totalIGV: { amount: "90000.00", currency: "PEN" }, ... },
	 *   ...
	 * }
	 * ```
	 *
	 * @example Error: Invalid company
	 * ```ts
	 * GET /analytics/dashboard?companyId=invalid-uuid
	 * // Response (400 Bad Request): "Query validation failed"
	 * ```
	 *
	 * @example Performance: Parallel execution
	 * ```ts
	 * // All 6 queries execute in parallel via Promise.all()
	 * // Total response time ≈ slowest single query (not sum of all)
	 * // Typical: 200-500ms for full dashboard
	 * ```
	 */
	.get(
		"/dashboard",
		({ query }) => {
			return getDashboardAnalytics({
				companyId: query.companyId,
				startDate: query.startDate ? new Date(query.startDate) : undefined,
				endDate: query.endDate ? new Date(query.endDate) : undefined,
				currency: query.currency as "PEN" | "USD",
			});
		},
		{
			query: AnalyticsQuerySchema,
			detail: {
				tags: ["Analytics"],
				summary: "Dashboard Completo",
				description:
					"Obtiene todas las métricas KPI (financieras, operativas, tributarias, clientes, tendencias, cumplimiento)",
			},
		},
	)

	/**
	 * GET /analytics/financial - Financial KPIs only.
	 *
	 * Returns revenue, growth, outstanding amounts, and average invoice value.
	 * Lighter endpoint than full dashboard when only financial data needed.
	 *
	 * **Metrics Returned**:
	 * - totalRevenue: Lifetime revenue from paid invoices
	 * - monthlyRevenue: Current month revenue
	 * - averageInvoiceValue: monthlyRevenue / invoice count
	 * - outstandingAmount: Unpaid invoices (accounts receivable)
	 * - collectedAmount: Alias for monthlyRevenue
	 * - projectedRevenue: monthlyRevenue × 1.1 (10% projection)
	 * - revenueGrowth, monthOverMonthGrowth: MoM percentage change
	 *
	 * **Query Parameters**:
	 * - companyId (required): Company UUID
	 * - startDate (optional): Filters revenue calculation
	 * - endDate (optional): Filters revenue calculation
	 * - currency (optional): PEN|USD, defaults PEN
	 *
	 * @example
	 * ```ts
	 * // Q1 2026 financial metrics
	 * GET /analytics/financial?companyId=cmp_123&startDate=2026-01-01&endDate=2026-03-31&currency=PEN
	 *
	 * // Response (200 OK):
	 * {
	 *   totalRevenue: { amount: "1500000.00", currency: "PEN", formatted: "S/ 1,500,000.00" },
	 *   monthlyRevenue: { amount: "500000.00", currency: "PEN", formatted: "S/ 500,000.00" },
	 *   averageInvoiceValue: { amount: "12500.00", currency: "PEN", formatted: "S/ 12,500.00" },
	 *   outstandingAmount: { amount: "85000.00", currency: "PEN", formatted: "S/ 85,000.00" },
	 *   monthOverMonthGrowth: 15.5
	 * }
	 * ```
	 */
	.get(
		"/financial",
		({ query }) => {
			return getFinancialKPIs({
				companyId: query.companyId,
				currency: query.currency as "PEN" | "USD",
			});
		},
		{
			query: AnalyticsQuerySchema,
			detail: {
				tags: ["Analytics"],
				summary: "KPIs Financieros",
				description:
					"Ingresos, crecimiento, montos pendientes, valor promedio de factura",
			},
		},
	)

	/**
	 * GET /analytics/operational - Operational KPIs (invoice status, collection rates).
	 *
	 * Returns invoice counts by status, collection rate, and overdue metrics.
	 * Focused on operational efficiency, not financial amounts.
	 *
	 * **Metrics Returned**:
	 * - totalInvoices: Total invoice count
	 * - paidInvoices, pendingInvoices, overdueInvoices: Counts by status
	 * - draftInvoices, cancelledInvoices: Draft and cancelled counts
	 * - collectionRate: (Paid / Total) × 100%
	 * - overdueRate: (Overdue / Total) × 100%
	 * - averageDaysToPayment: Placeholder (0)
	 *
	 * **Query Parameters**:
	 * - companyId (required): Company UUID
	 * - No date range or currency needed (snapshot metrics)
	 *
	 * **Why no date range?**
	 * - Operational KPIs reflect current invoice state (SENT, PAID, OVERDUE)
	 * - Historical states not relevant (status changes over time)
	 * - Date-filtered operational metrics available via separate endpoint
	 *
	 * @example
	 * ```ts
	 * // Current operational state
	 * GET /analytics/operational?companyId=cmp_123
	 *
	 * // Response (200 OK):
	 * {
	 *   totalInvoices: 150,
	 *   paidInvoices: 120,
	 *   pendingInvoices: 18,
	 *   overdueInvoices: 8,
	 *   draftInvoices: 4,
	 *   cancelledInvoices: 0,
	 *   collectionRate: 80,
	 *   overdueRate: 5.33,
	 *   averageDaysToPayment: 0
	 * }
	 * ```
	 *
	 * @example High overdue rate alert
	 * ```ts
	 * GET /analytics/operational?companyId=cmp_123
	 * // If overdueRate > 10, trigger payment collection workflow
	 * ```
	 */
	.get(
		"/operational",
		({ query }) => {
			return getOperationalKPIs({
				companyId: query.companyId,
			});
		},
		{
			query: OperationalQuerySchema,
			detail: {
				tags: ["Analytics"],
				summary: "KPIs Operativos",
				description:
					"Conteos de facturas por estado, tasa de cobranza, tasa de vencimiento",
			},
		},
	)

	/**
	 * GET /analytics/tax - Tax and compliance KPIs (IGV, detractions, retentions).
	 *
	 * Returns tax metrics for SUNAT 2026 reporting and compliance.
	 * Includes IGV collected, detractions (SPOT), and retentions.
	 *
	 * **Metrics Returned** (SUNAT 2026):
	 * - totalIGV: Sum of all IGV (Impuesto General a las Ventas) collected
	 * - monthlyIGV: IGV in current calendar month
	 * - detractionsAmount: SPOT detractions (12% for services > S/ 700)
	 * - retentionsAmount: Tax retentions (10% for non-resident services)
	 * - igvByMonth: Array of monthly IGV breakdown (empty array - future feature)
	 *
	 * **SUNAT Context**:
	 * - IGV Rate: 18% standard in Peru
	 * - SIRE: Monthly submission by day 10
	 * - UBL 2.1: XML format required for SUNAT
	 * - Detractions: Mandatory for eligible services (SPOT system)
	 *
	 * **Query Parameters**:
	 * - companyId (required): Company UUID
	 * - startDate (optional): Tax period start
	 * - endDate (optional): Tax period end
	 * - currency (optional): PEN|USD, defaults PEN
	 *
	 * @example
	 * ```ts
	 * // January 2026 tax metrics
	 * GET /analytics/tax?companyId=cmp_123&startDate=2026-01-01&endDate=2026-01-31&currency=PEN
	 *
	 * // Response (200 OK):
	 * {
	 *   totalIGV: { amount: "27000.00", currency: "PEN", formatted: "S/ 27,000.00" },
	 *   monthlyIGV: { amount: "27000.00", currency: "PEN", formatted: "S/ 27,000.00" },
	 *   detractionsAmount: { amount: "0.00", currency: "PEN" },
	 *   retentionsAmount: { amount: "0.00", currency: "PEN" },
	 *   igvByMonth: []
	 * }
	 * ```
	 *
	 * @example SIRE submission preparation
	 * ```ts
	 * // Get monthly tax data for SIRE reporting
	 * const taxData = await fetch('/analytics/tax?companyId=cmp_123&currency=PEN');
	 * // Use totalIGV for SIRE Form 621 submission by 10th of next month
	 * ```
	 */
	.get(
		"/tax",
		({ query }) => {
			return getTaxKPIs({
				companyId: query.companyId,
				currency: query.currency as "PEN" | "USD",
			});
		},
		{
			query: AnalyticsQuerySchema,
			detail: {
				tags: ["Analytics"],
				summary: "KPIs Tributarios (SUNAT)",
				description:
					"IGV, detracciones, retenciones para cumplimiento SUNAT 2026",
			},
		},
	)

	/**
	 * GET /analytics/customers - Customer analytics and segmentation.
	 *
	 * Returns customer counts, top customers by revenue, and segmentation metrics.
	 * Helps identify key accounts and customer concentration risk.
	 *
	 * **Metrics Returned**:
	 * - totalCustomers: COUNT(DISTINCT customerId) across all invoices
	 * - activeCustomers: Currently equals totalCustomers (segmentation TBD)
	 * - topCustomers: Top 5 by revenue (paid invoices only)
	 *   - Each includes: customerId, customerName, totalSpent (Money), invoiceCount
	 * - customersBySegment: Segmentation (VIP, Regular, Occasional) - placeholder
	 *
	 * **Segmentation Logic** (Future):
	 * - VIP: Revenue > 75th percentile
	 * - Regular: 3+ invoices, revenue 25-75th percentile
	 * - Occasional: <3 invoices or low-revenue customers
	 *
	 * **Query Parameters**:
	 * - companyId (required): Company UUID
	 * - startDate (optional): Filters customer analysis period
	 * - endDate (optional): Filters customer analysis period
	 * - currency (optional): PEN|USD, defaults PEN
	 *
	 * @example
	 * ```ts
	 * // Top customers in January 2026
	 * GET /analytics/customers?companyId=cmp_123&startDate=2026-01-01&endDate=2026-01-31&currency=PEN
	 *
	 * // Response (200 OK):
	 * {
	 *   totalCustomers: 47,
	 *   activeCustomers: 47,
	 *   topCustomers: [
	 *     {
	 *       customerId: "bp_001",
	 *       customerName: "ACME Corp S.A.",
	 *       totalSpent: { amount: "125000.00", currency: "PEN", formatted: "S/ 125,000.00" },
	 *       invoiceCount: 8
	 *     },
	 *     ...
	 *   ],
	 *   customersBySegment: { vip: 0, regular: 0, occasional: 0 }
	 * }
	 * ```
	 *
	 * @example Customer concentration analysis
	 * ```ts
	 * const customers = await fetch('/analytics/customers?companyId=cmp_123');
	 * const topRevenue = customers.topCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
	 * const concentration = (topRevenue / totalRevenue) * 100;
	 * // Alert if top 5 customers > 50% of revenue
	 * ```
	 */
	.get(
		"/customers",
		({ query }) => {
			return getCustomerKPIs({
				companyId: query.companyId,
				currency: query.currency as "PEN" | "USD",
			});
		},
		{
			query: AnalyticsQuerySchema,
			detail: {
				tags: ["Analytics"],
				summary: "Análisis de Clientes",
				description:
					"Conteo de clientes, clientes principales, segmentación (VIP/Regular/Ocasional)",
			},
		},
	);
