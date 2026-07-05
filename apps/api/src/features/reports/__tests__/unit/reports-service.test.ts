/**
 * ReportsService Unit Tests
 *
 * @module reports/__tests__/unit/reports-service.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReportsService } from "../../index";
import { db } from "@drenyra/persistence/client";
import { bills, invoices } from "@drenyra/persistence/schema";

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockResolvedValue([{ total: "0" }]),
	},
}));

vi.mock("@drenyra/persistence/query", () => ({
	and: vi.fn(),
	eq: vi.fn(),
	gte: vi.fn(),
	lte: vi.fn(),
	sql: vi.fn((strings: TemplateStringsArray) => strings.join("")),
}));

describe("ReportsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(db.select as ReturnType<typeof vi.fn>).mockReturnThis();
		(db.from as ReturnType<typeof vi.fn>).mockReturnThis();
		(db.where as ReturnType<typeof vi.fn>).mockReturnThis();
		(db.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
			{ total: "0" },
		]);
	});

	describe("getProfitLoss", () => {
		it("should return profit and loss with revenue and expenses from paid documents", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "11800.00" }])
				.mockResolvedValueOnce([{ total: "3540.00" }]);

			const result = await ReportsService.getProfitLoss(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(result).toHaveProperty("period");
			expect(result).toHaveProperty("revenue");
			expect(result).toHaveProperty("expenses");
			expect(result).toHaveProperty("netIncome");
			expect(result.revenue).toBe("11800.00");
			expect(result.expenses).toBe("3540.00");
			expect(result.netIncome).toBe("8260.00");
		});

		it("should return zero revenue and expenses when no paid documents exist", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "0" }])
				.mockResolvedValueOnce([{ total: "0" }]);

			const result = await ReportsService.getProfitLoss(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(result.revenue).toBe("0.00");
			expect(result.expenses).toBe("0.00");
			expect(result.netIncome).toBe("0.00");
		});

		it("should include period information", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "0" }])
				.mockResolvedValueOnce([{ total: "0" }]);

			const startDate = new Date("2026-02-01");
			const endDate = new Date("2026-02-28");

			const result = await ReportsService.getProfitLoss(
				"cmp-1",
				startDate,
				endDate,
			);

			expect(result.period.startDate).toEqual(startDate);
			expect(result.period.endDate).toEqual(endDate);
		});

		it("should query invoices and bills when building the baseline P&L", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "5000.00" }])
				.mockResolvedValueOnce([{ total: "1200.00" }]);

			await ReportsService.getProfitLoss(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(db.select).toHaveBeenCalledTimes(2);
			expect(db.from).toHaveBeenNthCalledWith(1, invoices);
			expect(db.from).toHaveBeenNthCalledWith(2, bills);
		});
	});

	describe("getBalanceSheet", () => {
		it("should return baseline receivables, payables, and equity", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "12000.00" }])
				.mockResolvedValueOnce([{ total: "4500.00" }]);

			const asOfDate = new Date("2026-03-31");
			const result = await ReportsService.getBalanceSheet("cmp-1", asOfDate);

			expect(result.asOfDate).toEqual(asOfDate);
			expect(result.assets.total).toBe("12000.00");
			expect(result.liabilities.total).toBe("4500.00");
			expect(result.equity.total).toBe("7500.00");
		});

		it("should return zeroed baseline when no open balances exist", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "0" }])
				.mockResolvedValueOnce([{ total: "0" }]);

			const result = await ReportsService.getBalanceSheet(
				"cmp-1",
				new Date("2026-06-30"),
			);

			expect(result.assets.total).toBe("0.00");
			expect(result.liabilities.total).toBe("0.00");
			expect(result.equity.total).toBe("0.00");
		});

		it("should query invoices and bills when building balance sheet baseline", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "10.00" }])
				.mockResolvedValueOnce([{ total: "5.00" }]);

			await ReportsService.getBalanceSheet("cmp-1", new Date("2026-03-31"));

			expect(db.select).toHaveBeenCalledTimes(2);
			expect(db.from).toHaveBeenNthCalledWith(1, invoices);
			expect(db.from).toHaveBeenNthCalledWith(2, bills);
		});
	});

	describe("getCashFlow", () => {
		it("should return baseline operating cash flow from paid inflow and outflow", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "9800.00" }])
				.mockResolvedValueOnce([{ total: "4300.00" }]);

			const startDate = new Date("2026-01-01");
			const endDate = new Date("2026-01-31");

			const result = await ReportsService.getCashFlow(
				"cmp-1",
				startDate,
				endDate,
			);

			expect(result.period.startDate).toEqual(startDate);
			expect(result.period.endDate).toEqual(endDate);
			expect(result.operating).toBe("5500.00");
			expect(result.investing).toBe("0.00");
			expect(result.financing).toBe("0.00");
			expect(result.netCashFlow).toBe("5500.00");
		});

		it("should return zero values for all sections when there are no paid movements", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "0" }])
				.mockResolvedValueOnce([{ total: "0" }]);

			const result = await ReportsService.getCashFlow(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(result.operating).toBe("0.00");
			expect(result.investing).toBe("0.00");
			expect(result.financing).toBe("0.00");
			expect(result.netCashFlow).toBe("0.00");
		});

		it("should query invoices and bills when building cash flow baseline", async () => {
			(db.where as ReturnType<typeof vi.fn>)
				.mockResolvedValueOnce([{ total: "10.00" }])
				.mockResolvedValueOnce([{ total: "5.00" }]);

			await ReportsService.getCashFlow(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(db.select).toHaveBeenCalledTimes(2);
			expect(db.from).toHaveBeenNthCalledWith(1, invoices);
			expect(db.from).toHaveBeenNthCalledWith(2, bills);
		});
	});

	describe("getSalesByCustomer", () => {
		it("should return sales grouped by customer", async () => {
			const mockResults = [
				{ customerId: "cust-1", total: "5000", count: "3" },
				{ customerId: "cust-2", total: "3000.00", count: 2 },
			];
			(db.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults);

			const result = await ReportsService.getSalesByCustomer(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				customerId: "cust-1",
				total: "5000.00",
				count: 3,
			});
		});

		it("should return empty array when no invoices exist", async () => {
			(db.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const result = await ReportsService.getSalesByCustomer(
				"cmp-1",
				new Date("2026-01-01"),
				new Date("2026-01-31"),
			);

			expect(result).toEqual([]);
		});

		it("should filter by companyId and date range", async () => {
			(db.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			await ReportsService.getSalesByCustomer(
				"cmp-specific",
				new Date("2026-03-01"),
				new Date("2026-03-31"),
			);

			expect(db.select).toHaveBeenCalled();
			expect(db.from).toHaveBeenCalledWith(invoices);
		});
	});
});
