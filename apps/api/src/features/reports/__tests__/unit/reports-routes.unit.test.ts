/**
 * Reports Routes Unit Tests (v1)
 *
 * Tests for the v1 reports API endpoints.
 */

import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetProfitLoss } = vi.hoisted(() => ({
	mockGetProfitLoss: vi.fn(),
}));

vi.mock("../../application/queries/get-profit-loss", () => ({ getProfitLoss: mockGetProfitLoss }));
vi.mock("../../application/queries/get-balance-sheet", () => ({ getBalanceSheet: vi.fn() }));
vi.mock("../../application/queries/get-cash-flow", () => ({ getCashFlow: vi.fn() }));
vi.mock("../../application/queries/get-sales-by-customer", () => ({ getSalesByCustomer: vi.fn() }));

import { v1ReportsModule } from "../../v1/routes";

const COMPANY_ID = "cmp-1";

function v1ReportRequest(path: string): Request {
	return new Request(`http://localhost${path}`, {
		headers: { "x-company-id": COMPANY_ID },
	});
}

describe("v1 reports routes", () => {
	const app = new Elysia().use(v1ReportsModule);

	beforeEach(() => { vi.restoreAllMocks(); });
	afterEach(() => { vi.restoreAllMocks(); });

	describe("GET /api/v1/reports/profit-loss", () => {
		it("returns 401 when company context is missing", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/v1/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31"),
			);
			expect(response.status).toBe(401);
		});

		it("returns 422 when required params are missing", async () => {
			const response = await app.handle(v1ReportRequest("/api/v1/reports/profit-loss"));
			expect(response.status).toBe(422);
		});

		it("returns 422 when date range is invalid", async () => {
			const response = await app.handle(
				v1ReportRequest("/api/v1/reports/profit-loss?startDate=2026-02-01&endDate=2026-01-31"),
			);
			expect(response.status).toBe(422);
		});

		it("includes X-API-Version header", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/v1/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31"),
			);
			// Even without auth, the response includes the version header
			expect(response.headers.get("X-API-Version")).toBe("1");
		});
	});

	describe("GET /api/v1/reports/balance-sheet", () => {
		it("returns 401 without company context", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/v1/reports/balance-sheet?asOfDate=2026-06-30"),
			);
			expect(response.status).toBe(401);
		});

		it("returns 422 when asOfDate is missing", async () => {
			const response = await app.handle(v1ReportRequest("/api/v1/reports/balance-sheet"));
			expect(response.status).toBe(422);
		});
	});

	describe("GET /api/v1/reports/cash-flow", () => {
		it("returns 401 without company context", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/v1/reports/cash-flow?startDate=2026-01-01&endDate=2026-01-31"),
			);
			expect(response.status).toBe(401);
		});
	});

	describe("GET /api/v1/reports/sales-by-customer", () => {
		it("returns 401 without company context", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/v1/reports/sales-by-customer?startDate=2026-01-01&endDate=2026-01-31"),
			);
			expect(response.status).toBe(401);
		});
	});

	describe("X-API-Version header", () => {
		it("includes X-API-Version: 1 header", async () => {
			const response = await app.handle(
				new Request("http://localhost/api/v1/reports/profit-loss?startDate=2026-01-01&endDate=2026-01-31"),
			);
			expect(response.headers.get("X-API-Version")).toBe("1");
		});
	});
});
