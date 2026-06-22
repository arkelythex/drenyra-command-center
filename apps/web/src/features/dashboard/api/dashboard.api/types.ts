// ─── Dashboard API Types ────────────────────────────────────────
// Aggregated from the original monolithic dashboard.api.ts

export interface DashboardSireStatusPayload {
	period: string;
	totalInvoices: number;
	matched: number;
	unmatched: number;
	rejected: number;
	pendingSubmission: number;
}

export interface DashboardSummaryStatus {
	matched: number;
	unmatched: number;
	rejected: number;
	totalInvoices: number;
	matchRate: number;
}

export interface DashboardSummaryResponse {
	status: DashboardSummaryStatus;
}

export interface DashboardOverviewSystemStatus {
	status: "ONLINE";
	version: string;
	uptime: number;
	dbLatency: number;
	lastCheckedAt: string;
}

export interface DashboardProcessedDocs {
	total: number;
	processed: number;
	pending: number;
	rejected: number;
	draft: number;
	processingRate: number;
}

export interface DashboardLiquidityPoint {
	date: string;
	balance: number;
	currency: "PEN" | "USD";
}

export interface DashboardOverviewResponse {
	systemStatus: DashboardOverviewSystemStatus;
	processedDocs: DashboardProcessedDocs;
	liquidity: DashboardLiquidityPoint[];
}

export interface DashboardRecentTransaction {
	id: string;
	number: string;
	totalAmount: number;
	status: "PAID" | "DRAFT" | "REJECTED";
}

export interface DashboardExpenseBudgetExecution {
	totalExpenses: number;
	totalIgv: number;
	billCount: number;
	currency: "PEN" | "USD";
}

export interface DashboardExpenseCategory {
	category: string;
	total: number;
	count: number;
	percentage: number;
}

export interface DashboardTopVendor {
	vendorId: string;
	vendorName: string;
	ruc: string;
	total: number;
	billCount: number;
}

export interface DashboardExpensesResponse {
	budgetExecution: DashboardExpenseBudgetExecution;
	paymentCompliance: number;
	expenseByCategory: DashboardExpenseCategory[];
	topVendors: DashboardTopVendor[];
}

export interface DashboardBillingEvolutionPoint {
	month: string;
	label: string;
	total: number;
	igv: number;
	count: number;
}

export interface DashboardTopCustomer {
	customerId: string;
	customerName: string;
	total: number;
	invoiceCount: number;
}

export interface DashboardIncomeResponse {
	totalBilled: number;
	totalIgv: number;
	collected: number;
	pending: number;
	overdue: number;
	invoiceCount: number;
	collectionRate: number;
	currency: "PEN" | "USD";
	billingEvolution: DashboardBillingEvolutionPoint[];
	topCustomers: DashboardTopCustomer[];
}

export interface DashboardFiscalIndicatorsResponse {
	exchangeRate: {
		compra: number;
		venta: number;
	};
	uit: {
		year: number;
		value: number;
	};
}
