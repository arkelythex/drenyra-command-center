/**
 * Reports Routes Unit Tests
 *
 * @module reports/__tests__/unit/reports-routes.unit
 */

import { Money } from "@arkelythex/domain";
import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsService, reportsModule } from "../../index";

const COMPANY_ID = "cmp-1";

function reportRequest(path: string): Request {
	return new Request(`http://localhost${path}`, {
		headers: { "x-company-id": COMPANY_ID },
	});
}

describe("reports routes", () => {
	const app = new Elysia().use(reportsModule);

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("GET /reports/profit-loss", () => {
		it("returns 500 when company context cannot be resolved", async () => {
			const response = await app.handle(
				new Request(
					"http://localhost/api/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
		});

		it("returns 500 when company scope header is present but context missing", async () => {
			vi.spyOn(ReportsService, "getProfitLoss").mockResolvedValue({
				period: {
					startDate: new Date("2026-01-01"),
					endDate: new Date("2026-01-31"),
				},
				revenue: Money.fromAmount(11800, "PEN").toString(),
				expenses: "3540.00",
				netIncome: "8260.00",
			});

			const response = await app.handle(
				reportRequest(
					"/api/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
		});

		it("returns 422 when required params are missing", async () => {
			const response = await app.handle(
				reportRequest("/api/reports/profit-loss"),
			);

			expect(response.status).toBe(422);
		});

		it("returns 422 when date range is invalid", async () => {
			const response = await app.handle(
				reportRequest(
					"/api/reports/profit-loss?startDate=2026-02-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(422);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: false,
				code: "VALIDATION_ERROR",
			});
		});

		it("returns 500 when the response violates the report contract", async () => {
			vi.spyOn(ReportsService, "getProfitLoss").mockResolvedValue({
				period: {
					startDate: new Date("2026-01-01"),
					endDate: new Date("2026-01-31"),
				},
				revenue: "not-money",
				expenses: "3540.00",
				netIncome: "0",
			} as never);

			const response = await app.handle(
				reportRequest(
					"/api/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: false,
				code: "INTERNAL_ERROR",
			});
		});

		it("returns 500 when service throws", async () => {
			vi.spyOn(ReportsService, "getProfitLoss").mockRejectedValue(
				new Error("DB error"),
			);

			const response = await app.handle(
				reportRequest(
					"/api/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
			const payload = await response.json();
			expect(payload).toMatchObject({
				success: false,
				code: "INTERNAL_ERROR",
			});
		});
	});

	describe("GET /reports/balance-sheet", () => {
		it("returns 500 when company context cannot be resolved", async () => {
			const response = await app.handle(
				reportRequest("/api/reports/balance-sheet?asOfDate=2026-03-31"),
			);

			expect(response.status).toBe(500);
		});

		it("returns 422 when asOfDate is missing", async () => {
			const response = await app.handle(
				reportRequest("/api/reports/balance-sheet"),
			);

			expect(response.status).toBe(422);
		});

		it("returns 422 when asOfDate is invalid", async () => {
			const response = await app.handle(
				reportRequest("/api/reports/balance-sheet?asOfDate=not-a-date"),
			);

			expect(response.status).toBe(422);
		});
	});

	describe("GET /reports/cash-flow", () => {
		it("returns 500 when company context cannot be resolved", async () => {
			const response = await app.handle(
				reportRequest(
					"/api/reports/cash-flow?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
		});

		it("returns 422 when dates are missing", async () => {
			const response = await app.handle(
				reportRequest("/api/reports/cash-flow"),
			);

			expect(response.status).toBe(422);
		});
	});

	describe("GET /reports/sales-by-customer", () => {
		it("returns 500 when company context cannot be resolved", async () => {
			const response = await app.handle(
				reportRequest(
					"/api/reports/sales-by-customer?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
		});

		it("returns 500 when no sales data available", async () => {
			vi.spyOn(ReportsService, "getSalesByCustomer").mockResolvedValue([]);

			const response = await app.handle(
				reportRequest(
					"/api/reports/sales-by-customer?startDate=2026-01-01&endDate=2026-01-31",
				),
			);

			expect(response.status).toBe(500);
		});

		it("returns 422 when required params are missing", async () => {
			const response = await app.handle(
				reportRequest("/api/reports/sales-by-customer"),
			);

			expect(response.status).toBe(422);
		});
	});
});
