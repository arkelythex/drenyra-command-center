import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "../../analytics.service";
import * as complianceAnalytics from "../../compliance.analytics";
import * as customerAnalytics from "../../customer.analytics";
import * as financialAnalytics from "../../financial.analytics";
import * as operationalAnalytics from "../../operational.analytics";
import * as taxAnalytics from "../../tax.analytics";
import * as trendAnalytics from "../../trend.analytics";

vi.mock("../../financial.analytics");
vi.mock("../../operational.analytics");
vi.mock("../../tax.analytics");
vi.mock("../../customer.analytics");
vi.mock("../../trend.analytics");
vi.mock("../../compliance.analytics");

describe("AnalyticsService", () => {
	const mockOptions = {
		companyId: "cmp_123",
		currency: "PEN",
		startDate: new Date("2026-01-01"),
		endDate: new Date("2026-03-31"),
	};

	const mockFinancialKPIs = {
		totalRevenue: 1000000,
		totalExpenses: 500000,
		netProfit: 500000,
		profitMargin: 50,
	};

	const mockOperationalKPIs = {
		invoiceCount: 150,
		paidInvoices: 100,
		pendingInvoices: 50,
		collectionRate: 66.67,
	};

	const mockTaxKPIs = {
		igvCollected: 180000,
		igvPaid: 90000,
		igvBalance: 90000,
		taxCompliance: 100,
	};

	const mockCustomerKPIs = {
		totalCustomers: 50,
		activeCustomers: 40,
		newCustomers: 10,
		churnRate: 5,
	};

	const mockTrends = {
		revenueGrowth: 15,
		expenseGrowth: 10,
		customerGrowth: 20,
	};

	const mockCompliance = {
		score: 95,
		documentsFiled: 45,
		pendingDocuments: 0,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(financialAnalytics.FinancialAnalytics.getKPIs).mockResolvedValue(
			mockFinancialKPIs,
		);
		vi.mocked(
			operationalAnalytics.OperationalAnalytics.getKPIs,
		).mockResolvedValue(mockOperationalKPIs);
		vi.mocked(taxAnalytics.TaxAnalytics.getKPIs).mockResolvedValue(mockTaxKPIs);
		vi.mocked(customerAnalytics.CustomerAnalytics.getKPIs).mockResolvedValue(
			mockCustomerKPIs,
		);
		vi.mocked(
			trendAnalytics.TrendAnalytics.getTrendAnalytics,
		).mockResolvedValue(mockTrends);
		vi.mocked(
			complianceAnalytics.ComplianceAnalytics.getMetrics,
		).mockResolvedValue(mockCompliance);
	});

	describe("getDashboardAnalytics", () => {
		it("should return complete dashboard analytics with all KPI categories", async () => {
			const result = await AnalyticsService.getDashboardAnalytics(mockOptions);

			expect(result).toEqual({
				financial: mockFinancialKPIs,
				operational: mockOperationalKPIs,
				tax: mockTaxKPIs,
				customers: mockCustomerKPIs,
				trends: mockTrends,
				compliance: mockCompliance,
			});
		});

		it("should call all analytics modules in parallel", async () => {
			await AnalyticsService.getDashboardAnalytics(mockOptions);

			expect(
				financialAnalytics.FinancialAnalytics.getKPIs,
			).toHaveBeenCalledWith(mockOptions);
			expect(
				operationalAnalytics.OperationalAnalytics.getKPIs,
			).toHaveBeenCalledWith(mockOptions);
			expect(taxAnalytics.TaxAnalytics.getKPIs).toHaveBeenCalledWith(
				mockOptions,
			);
			expect(customerAnalytics.CustomerAnalytics.getKPIs).toHaveBeenCalledWith(
				mockOptions,
			);
			expect(
				trendAnalytics.TrendAnalytics.getTrendAnalytics,
			).toHaveBeenCalledWith(mockOptions);
			expect(
				complianceAnalytics.ComplianceAnalytics.getMetrics,
			).toHaveBeenCalledWith(mockOptions);
		});

		it("should handle partial analytics failures gracefully", async () => {
			vi.mocked(
				financialAnalytics.FinancialAnalytics.getKPIs,
			).mockRejectedValue(new Error("DB error"));

			const result = await AnalyticsService.getDashboardAnalytics(mockOptions);

			expect(result.financial).toBeUndefined();
			expect(result.operational).toEqual(mockOperationalKPIs);
		});
	});

	describe("getFinancialKPIs", () => {
		it("should return financial KPIs only", async () => {
			const result = await AnalyticsService.getFinancialKPIs(mockOptions);

			expect(result).toEqual(mockFinancialKPIs);
			expect(
				financialAnalytics.FinancialAnalytics.getKPIs,
			).toHaveBeenCalledWith(mockOptions);
		});
	});

	describe("getOperationalKPIs", () => {
		it("should return operational KPIs only", async () => {
			const result = await AnalyticsService.getOperationalKPIs(mockOptions);

			expect(result).toEqual(mockOperationalKPIs);
			expect(
				operationalAnalytics.OperationalAnalytics.getKPIs,
			).toHaveBeenCalledWith(mockOptions);
		});
	});

	describe("getTaxKPIs", () => {
		it("should return tax KPIs only", async () => {
			const result = await AnalyticsService.getTaxKPIs(mockOptions);

			expect(result).toEqual(mockTaxKPIs);
			expect(taxAnalytics.TaxAnalytics.getKPIs).toHaveBeenCalledWith(
				mockOptions,
			);
		});
	});

	describe("getCustomerKPIs", () => {
		it("should return customer KPIs only", async () => {
			const result = await AnalyticsService.getCustomerKPIs(mockOptions);

			expect(result).toEqual(mockCustomerKPIs);
			expect(customerAnalytics.CustomerAnalytics.getKPIs).toHaveBeenCalledWith(
				mockOptions,
			);
		});
	});

	describe("getTrendAnalytics", () => {
		it("should return trend analytics only", async () => {
			const result = await AnalyticsService.getTrendAnalytics(mockOptions);

			expect(result).toEqual(mockTrends);
			expect(
				trendAnalytics.TrendAnalytics.getTrendAnalytics,
			).toHaveBeenCalledWith(mockOptions);
		});
	});

	describe("getComplianceMetrics", () => {
		it("should return compliance metrics only", async () => {
			const result = await AnalyticsService.getComplianceMetrics(mockOptions);

			expect(result).toEqual(mockCompliance);
			expect(
				complianceAnalytics.ComplianceAnalytics.getMetrics,
			).toHaveBeenCalledWith(mockOptions);
		});
	});
});
