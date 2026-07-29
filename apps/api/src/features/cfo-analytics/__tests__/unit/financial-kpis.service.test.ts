import { db } from "@drenyra/persistence/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinancialKPIsService } from "../../services/financial-kpis.service";

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		where: vi.fn(),
		groupBy: vi.fn().mockReturnThis(),
		orderBy: vi.fn(),
	},
}));

vi.mock("@drenyra/persistence/query", () => ({
	and: vi.fn(),
	eq: vi.fn(),
	gte: vi.fn(),
	lte: vi.fn(),
	sql: vi.fn((strings: TemplateStringsArray) => strings.join("")),
}));

const mockDb = db as unknown as {
	select: ReturnType<typeof vi.fn>;
	from: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
	groupBy: ReturnType<typeof vi.fn>;
	orderBy: ReturnType<typeof vi.fn>;
};

describe("FinancialKPIsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.select.mockReturnThis();
		mockDb.from.mockReturnThis();
		mockDb.groupBy.mockReturnThis();
	});

	describe("getRevenueKPIs", () => {
		it("returns total, monthly revenue, growth, and period trend", async () => {
			mockDb.where
				.mockResolvedValueOnce([{ total: "1000" }])
				.mockResolvedValueOnce([{ total: "300" }])
				.mockResolvedValueOnce([{ total: "200" }])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([
				{ period: "2026-01", total: "100" },
				{ period: "2026-02", total: "200" },
			]);

			const result = await FinancialKPIsService.getRevenueKPIs("company-1");

			expect(result.totalRevenue).toMatchObject({ amount: "1000.00", currency: "PEN" });
			expect(result.monthlyRevenue.amount).toBe("300.00");
			expect(result.quarterlyRevenue.amount).toBe("0.00");
			expect(result.revenueGrowth).toBe(50);
			expect(result.revenueByMonth).toMatchObject([
				{ month: "2026-01", revenue: { amount: "100.00", currency: "PEN" } },
				{ month: "2026-02", revenue: { amount: "200.00", currency: "PEN" } },
			]);
		});

		it("reports zero growth when the preceding period has no revenue", async () => {
			mockDb.where
				.mockResolvedValueOnce([{ total: "300" }])
				.mockResolvedValueOnce([{ total: "300" }])
				.mockResolvedValueOnce([{ total: "0" }])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([]);

			const result = await FinancialKPIsService.getRevenueKPIs("company-1");

			expect(result.revenueGrowth).toBe(0);
			expect(result.revenueByMonth).toEqual([]);
		});

		it.each(["quarterly", "yearly"] as const)(
			"places %s revenue in its matching period field",
			async (period) => {
				mockDb.where
					.mockResolvedValueOnce([{ total: "1000" }])
					.mockResolvedValueOnce([{ total: "400" }])
					.mockResolvedValueOnce([{ total: "200" }])
					.mockReturnThis();
				mockDb.orderBy.mockResolvedValue([]);

				const result = await FinancialKPIsService.getRevenueKPIs("company-1", period);

				expect(result.monthlyRevenue.amount).toBe("0.00");
				expect(
					period === "quarterly"
						? result.quarterlyRevenue.amount
						: result.yearlyRevenue.amount,
				).toBe("400.00");
			},
		);

		it("preserves the requested currency", async () => {
			mockDb.where
				.mockResolvedValueOnce([{ total: "0" }])
				.mockResolvedValueOnce([{ total: "0" }])
				.mockResolvedValueOnce([{ total: "0" }])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([]);

			const result = await FinancialKPIsService.getRevenueKPIs(
				"company-1",
				"monthly",
				"USD",
			);

			expect(result.totalRevenue.currency).toBe("USD");
		});
	});

	describe("getExpenseKPIs", () => {
		it("returns totals and normalizes trend amounts", async () => {
			mockDb.where
				.mockResolvedValueOnce([{ total: "800" }])
				.mockResolvedValueOnce([{ total: "250" }])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([{ month: "2026-03", total: "250" }]);

			const result = await FinancialKPIsService.getExpenseKPIs("company-1");

			expect(result.totalExpenses.amount).toBe("800.00");
			expect(result.monthlyExpenses.amount).toBe("250.00");
			expect(result.expensesByCategory).toEqual([]);
			expect(result.expenseTrend).toMatchObject([
				{ month: "2026-03", amount: { amount: "250.00", currency: "PEN" } },
			]);
		});

		it("uses zero values when expense queries return no rows", async () => {
			mockDb.where
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([]);

			const result = await FinancialKPIsService.getExpenseKPIs("company-1");

			expect(result.totalExpenses.amount).toBe("0.00");
			expect(result.monthlyExpenses.amount).toBe("0.00");
		});
	});

	describe("getProfitKPIs", () => {
		it("calculates month-over-month growth and profit trend", async () => {
			mockDb.where
				.mockResolvedValueOnce([{ total: "1000" }])
				.mockResolvedValueOnce([{ total: "300" }])
				.mockResolvedValueOnce([{ total: "200" }])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([{ month: "2026-03", total: "300" }]);

			const result = await FinancialKPIsService.getProfitKPIs("company-1");

			expect(result.grossProfit.amount).toBe("300.00");
			expect(result.netProfit.amount).toBe("300.00");
			expect(result.profitMargin).toBe(100);
			expect(result.monthOverMonthGrowth).toBe(50);
			expect(result.profitTrend[0]).toMatchObject({
				month: "2026-03",
				profit: { amount: "300.00", currency: "PEN" },
			});
		});

		it("returns zero margin and growth for empty profit data", async () => {
			mockDb.where
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockReturnThis();
			mockDb.orderBy.mockResolvedValue([]);

			const result = await FinancialKPIsService.getProfitKPIs("company-1");

			expect(result.profitMargin).toBe(0);
			expect(result.monthOverMonthGrowth).toBe(0);
		});
	});

	describe("getLiquidityKPIs", () => {
		it("returns cash, receivables, and an unbounded current ratio without payables", async () => {
			mockDb.where
				.mockResolvedValueOnce([{ total: "500" }])
				.mockResolvedValueOnce([{ total: "250" }]);

			const result = await FinancialKPIsService.getLiquidityKPIs("company-1");

			expect(result.cashAndEquivalents.amount).toBe("500.00");
			expect(result.accountsReceivable.amount).toBe("250.00");
			expect(result.accountsPayable.amount).toBe("0.00");
			expect(result.currentRatio).toBe(999);
			expect(result.quickRatio).toBe(999);
		});

		it("uses a neutral ratio when both assets and liabilities are zero", async () => {
			mockDb.where.mockResolvedValue([]);

			const result = await FinancialKPIsService.getLiquidityKPIs("company-1");

			expect(result.currentRatio).toBe(1);
			expect(result.quickRatio).toBe(1);
		});
	});
});
