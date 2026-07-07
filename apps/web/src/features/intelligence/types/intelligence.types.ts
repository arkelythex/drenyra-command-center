import type { AnomalySeverity } from "@drenyra/agents";

/** Metric card displayed at the top of the dashboard */
export interface DashboardMetric {
	id: string;
	label: string;
	value: number | string;
	unit?: string;
	trend?: "up" | "down" | "neutral";
	trendValue?: string;
	icon: string;
	color: "primary" | "warning" | "danger" | "success" | "info";
}

/** Anomaly formatted for UI display */
export interface AnomalyDisplayItem {
	id: string;
	type: string;
	entity: string;
	severity: AnomalySeverity;
	description: string;
	amount: number;
	date: string;
	confidence: number;
}

/** Cashflow prediction formatted for UI */
export interface CashflowDisplayData {
	currentBalance: number;
	predictedNext30: number;
	predictedNext60: number;
	predictedNext90: number;
	trend: "positive" | "negative" | "stable";
	confidence: number;
	historicalData: { date: string; value: number }[];
	forecastData: {
		date: string;
		value: number;
		confidenceLower: number;
		confidenceUpper: number;
	}[];
}

/** Compliance obligation formatted for UI */
export interface ComplianceDisplayItem {
	id: string;
	obligation: string;
	dueDate: string;
	status: "pending" | "filed" | "overdue" | "exempt";
	severity: "low" | "medium" | "high" | "critical";
	amount?: number;
	legalReference: string;
}

/** Supplier intelligence formatted for UI */
export interface SupplierDisplayData {
	totalSuppliers: number;
	topSupplierConcentration: number;
	averagePaymentDelay: number;
	atRiskSuppliers: number;
	agingBreakdown: { range: string; amount: number; percentage: number }[];
	topSuppliers: { name: string; amount: number; percentage: number }[];
}

/** Document classification formatted for UI */
export interface DocumentDisplayData {
	totalClassified: number;
	typeBreakdown: { type: string; count: number; percentage: number }[];
	averageConfidence: number;
	recentResults: {
		id: string;
		type: string;
		confidence: number;
		date: string;
	}[];
}

/** Intelligence dashboard state combining all 5 pillars */
export interface IntelligenceDashboardData {
	metrics: DashboardMetric[];
	anomalies: AnomalyDisplayItem[];
	cashflow: CashflowDisplayData | null;
	compliance: ComplianceDisplayItem[];
	supplier: SupplierDisplayData | null;
	documents: DocumentDisplayData | null;
	lastUpdated: string;
}
