/**
 * CFO Analytics — DTO types for frontend consumption.
 *
 * @module application/features/cfo-analytics
 */

// ─── Value Objects ──────────────────────────────────────────────

export interface MoneyValue {
	amount: string;
	currency: string;
	formatted: string;
}

// ─── KPI DTOs ───────────────────────────────────────────────────

export interface RevenueKPIs {
	totalRevenue: MoneyValue;
	monthlyRevenue: MoneyValue;
	quarterlyRevenue: MoneyValue;
	yearlyRevenue: MoneyValue;
	revenueGrowth: number;
	revenueByMonth: Array<{ month: string; revenue: MoneyValue }>;
}

export interface ExpenseKPIs {
	totalExpenses: MoneyValue;
	monthlyExpenses: MoneyValue;
	expensesByCategory: Array<{ category: string; amount: MoneyValue }>;
	expenseTrend: Array<{ month: string; amount: MoneyValue }>;
}

export interface ProfitKPIs {
	grossProfit: MoneyValue;
	netProfit: MoneyValue;
	profitMargin: number;
	profitTrend: Array<{ month: string; profit: MoneyValue }>;
	monthOverMonthGrowth: number;
}

export interface LiquidityKPIs {
	currentRatio: number;
	quickRatio: number;
	cashAndEquivalents: MoneyValue;
	accountsReceivable: MoneyValue;
	accountsPayable: MoneyValue;
}

export interface TaxKPISummary {
	complianceScore: number;
	monthlyIGV: MoneyValue;
	totalTaxLiability: MoneyValue;
	upcomingDeadlines: Array<{
		concept: string;
		dueDate: string;
		amount: MoneyValue;
		status: "pending" | "filed" | "overdue";
	}>;
	complianceByPeriod: Array<{
		period: string;
		score: number;
		issues: string[];
	}>;
}

export interface ClientSummaryKPIs {
	activeClients: number;
	newClients: number;
	churnedClients: number;
	totalClients: number;
	clientProfitability: Array<{
		clientId: string;
		clientName: string;
		revenue: MoneyValue;
		expenses: MoneyValue;
		profit: MoneyValue;
		margin: number;
	}>;
}

export interface DashboardKPIs {
	revenue: RevenueKPIs;
	expenses: ExpenseKPIs;
	profit: ProfitKPIs;
	liquidity: LiquidityKPIs;
	tax: TaxKPISummary;
	clients: ClientSummaryKPIs;
}

export interface WidgetConfig {
	id: string;
	type: string;
	position: { x: number; y: number; w: number; h: number };
}

export interface DashboardConfig {
	widgets: WidgetConfig[];
	layout: string;
}

export interface ReportResult {
	id: string;
	type: string;
	status: string;
	period?: string;
	fileUrl?: string;
	generatedAt?: string;
	createdAt: string;
}
