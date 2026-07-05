export type RiskCategory =
	| "fiscal"
	| "compliance"
	| "operational"
	| "financial";
export type RiskSeverity = "critical" | "high" | "medium" | "low";
export type RiskTrend = "up" | "down" | "stable";

export interface RiskItem {
	id: string;
	category: RiskCategory;
	severity: RiskSeverity;
	title: string;
	description: string;
	amount?: number;
	impact: string;
	probability: number;
	trend: RiskTrend;
}

export interface ContributorHealth {
	ruc: string;
	name: string;
	status: "active" | "inactive" | "no_habido" | "pending";
	riskScore: number;
	documentsCount: number;
	totalAmount: number;
}
