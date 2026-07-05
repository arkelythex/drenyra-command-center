/**
 * Dashboard Analytics Types
 * Real-time business intelligence and KPIs
 *
 * Shared type definitions for the analytics feature.
 * Includes the `toMoneyValue` utility for serializing Money VOs.
 */

import type { Currency, Money } from "@drenyra/domain";

/**
 * Money Value (for JSON serialization)
 */
export interface MoneyValue {
	amount: string;
	currency: Currency;
	formatted: string;
}

/**
 * Convert Money VO to serializable format for API responses.
 *
 * @param money - Money value object instance
 * @returns Serializable object with amount, currency, and formatted string
 */
export function toMoneyValue(money: Money): MoneyValue {
	return {
		amount: money.toString(),
		currency: money.getCurrency(),
		formatted: money.format(),
	};
}

/**
 * Analytics Query Options
 */
export interface AnalyticsOptions {
	companyId: string;
	startDate?: Date;
	endDate?: Date;
	currency?: Currency;
	includeProjections?: boolean;
}

/**
 * Main Dashboard Analytics
 */
export interface DashboardAnalytics {
	// Financial KPIs
	financial: FinancialKPIs;

	// Operational KPIs
	operational: OperationalKPIs;

	// Tax KPIs
	tax: TaxKPIs;

	// Customer KPIs
	customers: CustomerKPIs;

	// Trends
	trends: TrendAnalytics;

	// Compliance
	compliance: ComplianceMetrics;
}

/**
 * Financial KPIs
 */
export interface FinancialKPIs {
	totalRevenue: MoneyValue;
	monthlyRevenue: MoneyValue;
	averageInvoiceValue: MoneyValue;
	outstandingAmount: MoneyValue;
	collectedAmount: MoneyValue;
	projectedRevenue: MoneyValue;

	// Growth metrics
	revenueGrowth: number; // Percentage
	monthOverMonthGrowth: number;
}

/**
 * Operational KPIs
 */
export interface OperationalKPIs {
	totalInvoices: number;
	paidInvoices: number;
	pendingInvoices: number;
	overdueInvoices: number;
	draftInvoices: number;
	cancelledInvoices: number;

	// Rates
	collectionRate: number; // Percentage
	overdueRate: number;
	averageDaysToPayment: number;
}

/**
 * Tax KPIs
 */
export interface TaxKPIs {
	totalIGV: MoneyValue;
	monthlyIGV: MoneyValue;
	detractionsAmount: MoneyValue;
	retentionsAmount: MoneyValue;

	// By period
	igvByMonth: Array<{
		month: string;
		amount: MoneyValue;
	}>;
}

/**
 * Customer KPIs
 */
export interface CustomerKPIs {
	totalCustomers: number;
	activeCustomers: number;
	newCustomersThisMonth: number;

	topCustomers: Array<{
		customerId: string;
		customerName: string;
		totalSpent: MoneyValue;
		invoiceCount: number;
		lastPurchase: Date;
	}>;

	customersBySegment: {
		vip: number; // > 10k PEN
		regular: number; // 1k - 10k PEN
		occasional: number; // < 1k PEN
	};
}

/**
 * Trend Analytics
 */
export interface TrendAnalytics {
	revenueByMonth: Array<{
		month: string;
		year: number;
		revenue: MoneyValue;
		invoiceCount: number;
		averageValue: MoneyValue;
	}>;

	revenueByCustomer: Array<{
		customerId: string;
		customerName: string;
		revenue: MoneyValue;
	}>;

	revenueByProduct: Array<{
		productId: string;
		productName: string;
		revenue: MoneyValue;
		quantity: number;
	}>;

	paymentTrends: Array<{
		month: string;
		year: number;
		totalPayments: MoneyValue;
		paymentCount: number;
	}>;
}

/**
 * Compliance Metrics
 */
export interface ComplianceMetrics {
	complianceScore: number; // 0-100
	pendingSUNAT: number;
	rejectedInvoices: number;
	missingDocuments: number;
	issues: string[];
}

/**
 * Period Comparison
 */
export interface PeriodComparison {
	current: MoneyValue;
	previous: MoneyValue;
	change: MoneyValue;
	changePercentage: number;
	trend: "up" | "down" | "stable";
}
