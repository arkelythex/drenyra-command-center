export interface BudgetSlice {
	spent: number;
	limit: number;
	remaining: number;
	percentage: number;
}

export interface AgentStats {
	calls: number;
	totalCost: number;
	avgCostPerCall: number;
}

export interface TrendPoint {
	date: string;
	spent: number;
	calls: number;
}

export interface TopModel {
	model: string;
	calls: number;
	totalCost: number;
}

export interface CostSummaryResponse {
	historical: {
		daily: BudgetSlice;
		monthly: BudgetSlice;
		byAgent: Record<string, AgentStats>;
		trend: TrendPoint[];
		topModels: TopModel[];
		totalEvents: number;
	};
	budget: {
		daily: BudgetSlice;
		monthly: BudgetSlice;
	};
	meta: {
		source: "database" | "memory";
		totalDbEvents: number;
		updatedAt: string;
	};
}

export interface RecentEvent {
	id: string;
	agentType: string;
	modelUsed: string;
	totalTokens: number;
	costUsd: number;
	wasBlocked: boolean;
	createdAt: string;
}
