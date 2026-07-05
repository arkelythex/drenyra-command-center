/**
 * Cashflow Routes Integration Tests
 *
 * @module cashflow/__tests__/integration/cashflow-routes.integration.test
 */

import { Money } from "@drenyra/domain";
import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cashflowRoutes } from "../../api/routes";

// Mock function-based query modules (hoisted before imports by vitest)
// The variance query is NOT mocked — it runs its real implementation
// but uses the mocked internal dependencies (getCashflowProjection, getActualCashflow)
vi.mock("../../application/queries/get-cashflow-projection.query");
vi.mock("../../application/queries/get-actual-cashflow.query");
vi.mock("../../application/queries/get-cashflow-forecast.query");

import { getActualCashflow } from "../../application/queries/get-actual-cashflow.query";
import { getCashflowForecast } from "../../application/queries/get-cashflow-forecast.query";
import { getCashflowProjection } from "../../application/queries/get-cashflow-projection.query";

describe("cashflow routes", () => {
	const app = new Elysia().use(cashflowRoutes);

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET /api/cashflow/projection", () => {
		it("should return projection data", async () => {
			const mockProjection = {
				companyId: "cmp-1",
				startDate: new Date("2026-03-01"),
				endDate: new Date("2026-03-31"),
				currency: "PEN" as const,
				inflows: [],
				outflows: [],
				toJSON: () => ({
					companyId: "cmp-1",
					period: { startDate: "2026-03-01", endDate: "2026-03-31" },
					currency: "PEN",
					summary: {
						totalInflows: 0,
						totalOutflows: 0,
						netCashflow: 0,
						isDeficit: false,
					},
					inflows: [],
					outflows: [],
					overdueItems: 0,
					weeklyBreakdown: [],
				}),
			};
			vi.mocked(getCashflowProjection).mockResolvedValue(mockProjection);

			const response = await app.handle(
				new Request(
					"http://localhost/api/cashflow/projection?companyId=cmp-1&days=30",
				),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: true,
				data: {
					companyId: "cmp-1",
					summary: { netCashflow: 0 },
				},
			});
		});

		it("should return 422 when companyId is missing", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/cashflow/projection"),
			);

			expect(response.status).toBe(422);
		});

		it("should use default 30 days when not specified", async () => {
			const mockProjection = {
				companyId: "cmp-1",
				startDate: new Date("2026-03-01"),
				endDate: new Date("2026-03-31"),
				currency: "PEN" as const,
				inflows: [],
				outflows: [],
				toJSON: () => ({
					companyId: "cmp-1",
					period: { startDate: "2026-03-01", endDate: "2026-03-31" },
					currency: "PEN",
					summary: {
						totalInflows: 0,
						totalOutflows: 0,
						netCashflow: 0,
						isDeficit: false,
					},
					inflows: [],
					outflows: [],
					overdueItems: 0,
					weeklyBreakdown: [],
				}),
			};
			vi.mocked(getCashflowProjection).mockResolvedValue(mockProjection);

			const response = await app.handle(
				new Request("http://localhost/api/cashflow/projection?companyId=cmp-1"),
			);

			expect(response.status).toBe(200);
		});
	});

	describe("GET /api/cashflow/actual", () => {
		it("should return actual cashflow data", async () => {
			vi.mocked(getActualCashflow).mockResolvedValue({
				companyId: "cmp-1",
				period: {
					startDate: new Date("2026-01-01"),
					endDate: new Date("2026-01-31"),
				},
				currency: "PEN",
				actualInflows: 5000,
				actualOutflows: 3000,
				netCashflow: 2000,
				transactionCount: { inflows: 10, outflows: 5 },
			});

			const response = await app.handle(
				new Request(
					"http://localhost/api/cashflow/actual?companyId=cmp-1&startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: true,
				data: {
					actualInflows: 5000,
					actualOutflows: 3000,
					netCashflow: 2000,
				},
			});
		});

		it("should return 422 when required params are missing", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/cashflow/actual?companyId=cmp-1"),
			);

			expect(response.status).toBe(422);
		});
	});

	describe("GET /api/cashflow/forecast", () => {
		it("should return forecast data", async () => {
			vi.mocked(getCashflowForecast).mockResolvedValue({
				companyId: "cmp-1",
				months: 3,
				currency: "PEN",
				method: "historical_average",
				basedOnMonths: 2,
				forecast: [
					{
						month: "2026-04",
						expectedInflows: 5000,
						expectedOutflows: 3000,
						netCashflow: 2000,
						confidence: 0.8,
					},
					{
						month: "2026-05",
						expectedInflows: 5200,
						expectedOutflows: 3100,
						netCashflow: 2100,
						confidence: 0.7,
					},
					{
						month: "2026-06",
						expectedInflows: 5400,
						expectedOutflows: 3200,
						netCashflow: 2200,
						confidence: 0.6,
					},
				],
			});

			const response = await app.handle(
				new Request(
					"http://localhost/api/cashflow/forecast?companyId=cmp-1&months=3",
				),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: true,
				data: {
					months: 3,
					forecast: expect.any(Array),
				},
			});
		});

		it("should use default 3 months when not specified", async () => {
			vi.mocked(getCashflowForecast).mockResolvedValue({
				companyId: "cmp-1",
				months: 3,
				currency: "PEN",
				method: "historical_average",
				basedOnMonths: 0,
				forecast: [],
			});

			const response = await app.handle(
				new Request("http://localhost/api/cashflow/forecast?companyId=cmp-1"),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload.data.months).toBe(3);
		});
	});

	describe("GET /api/cashflow/variance", () => {
		it("should return variance analysis", async () => {
			vi.mocked(getCashflowProjection).mockResolvedValue({
				companyId: "cmp-1",
				period: {
					startDate: new Date("2026-01-01"),
					endDate: new Date("2026-01-31"),
				},
				currency: "PEN",
				totalInflows: Money.fromAmount(10000, "PEN"),
				totalOutflows: Money.fromAmount(6000, "PEN"),
				netCashflow: Money.fromAmount(4000, "PEN"),
				weeklyBreakdown: [],
				overdueItems: {
					invoices: 0,
					bills: 0,
					totalAmount: Money.fromAmount(0, "PEN"),
				},
				isDeficit: false,
				deficitAmount: Money.fromAmount(0, "PEN"),
			});
			vi.mocked(getActualCashflow).mockResolvedValue({
				companyId: "cmp-1",
				period: {
					startDate: new Date("2026-01-01"),
					endDate: new Date("2026-01-31"),
				},
				currency: "PEN",
				actualInflows: 8000,
				actualOutflows: 5500,
				netCashflow: 2500,
				transactionCount: { inflows: 5, outflows: 3 },
			});

			const response = await app.handle(
				new Request(
					"http://localhost/api/cashflow/variance?companyId=cmp-1&startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(200);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: true,
				data: {
					projected: expect.any(Object),
					actual: expect.any(Object),
					variance: expect.any(Object),
				},
			});
		});

		it("should return 422 when dates are missing", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/cashflow/variance?companyId=cmp-1"),
			);

			expect(response.status).toBe(422);
		});
	});
});
