import {
	Agent,
	AgentResult,
	Task,
} from "../../../agent-swarm/src/core/orchestrator-2026.js";
import { OpenRouterTool } from "./index.js";
export declare function createOpenRouterAgent(
	baseAgent: Agent,
	options?: {
		tools?: OpenRouterTool[];
		temperature?: number;
		maxTokens?: number;
	},
): Agent;
export declare function batchExecuteAgents(
	tasks: Array<{
		agent: Agent;
		task: Task;
	}>,
	options?: {
		maxConcurrent?: number;
	},
): Promise<AgentResult[]>;
export declare function getOpenRouterCostSummary(): {
	totalCost: number;
	budgetRemaining: number;
	topModels: Array<{
		model: string;
		cost: number;
	}>;
	topProviders: Array<{
		provider: string;
		cost: number;
	}>;
};
export declare function checkBudgetStatus(warningThreshold?: number): {
	status: "ok" | "warning" | "exceeded";
	remaining: number;
	percentage: number;
};
//# sourceMappingURL=agent-adapter.d.ts.map
