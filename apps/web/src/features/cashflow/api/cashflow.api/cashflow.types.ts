// ─── Cashflow API Types ──────────────────────────────────────────
// Aggregated from the original monolithic cashflow.api.ts

export interface CashflowProjectionItem {
	id: string;
	type: "inflow" | "outflow";
	documentType: "invoice" | "bill" | "retention";
	reference: string;
	amount: number;
	dueDate: string;
	status: "pending" | "overdue" | "paid";
	customerOrVendor: string;
}

export interface CashflowProjectionData {
	companyId: string;
	period: {
		startDate: string;
		endDate: string;
	};
	currency: "PEN" | "USD" | "EUR";
	summary: {
		totalInflows: number;
		totalOutflows: number;
		netCashflow: number;
		isDeficit: boolean;
	};
	inflows: CashflowProjectionItem[];
	outflows: CashflowProjectionItem[];
	overdueItems: number;
	weeklyBreakdown: Array<{
		weekStart: string;
		weekEnd: string;
		inflows: number;
		outflows: number;
		netCashflow: number;
	}>;
}

export interface ActualCashflowData {
	companyId: string;
	period: {
		startDate: string;
		endDate: string;
	};
	currency: "PEN" | "USD" | "EUR";
	actualInflows: number;
	actualOutflows: number;
	netCashflow: number;
	transactionCount: {
		inflows: number;
		outflows: number;
	};
}

export interface CashflowForecastMonth {
	month: string;
	expectedInflows: number;
	expectedOutflows: number;
	netCashflow: number;
	confidence: number;
}

export interface CashflowForecastData {
	companyId: string;
	months: number;
	currency: "PEN" | "USD" | "EUR";
	forecast: CashflowForecastMonth[];
	method: string;
	basedOnMonths: number;
}

export interface CashflowVarianceData {
	companyId: string;
	period: {
		startDate: string;
		endDate: string;
	};
	currency: "PEN" | "USD" | "EUR";
	projected: {
		inflows: number;
		outflows: number;
		netCashflow: number;
	};
	actual: {
		inflows: number;
		outflows: number;
		netCashflow: number;
	};
	variance: {
		inflows: number;
		outflows: number;
		netCashflow: number;
		inflowsPercentage: number;
		outflowsPercentage: number;
		netPercentage: number;
	};
	alerts: string[];
}
