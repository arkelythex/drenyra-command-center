/**
 * OpenRouter Agent Adapter
 *
 * Connects ARKELYTHEX 100 agents to OpenRouter API
 * Each agent gets optimal LLM model selection
 *
 * @since 2026.1.0
 */

// Local type definitions to avoid circular dependency with @drenyra/agent-swarm
// TODO: Extract these to a shared package when resolving the circular dependency
interface AdapterTask {
	id: string;
	data: unknown;
	[key: string]: unknown;
}

interface AdapterAgentResult {
	agentId: string;
	taskId: string;
	success: boolean;
	data: unknown;
	executionTime: number;
	timestamp: Date;
	errors?: string[];
}

interface AdapterAgent {
	id: string;
	name?: string;
	execute(task: AdapterTask): Promise<AdapterAgentResult>;
	[key: string]: unknown;
}

import { SecureLogger } from "@drenyra/shared/secure-logger";
import { type OpenRouterTool, openRouter } from "../index.js";
import { SYSTEM_PROMPTS } from "./types.js";

export function createOpenRouterAgent(
	baseAgent: AdapterAgent,
	options?: {
		tools?: OpenRouterTool[];
		temperature?: number;
		maxTokens?: number;
	},
): AdapterAgent {
	return {
		...baseAgent,

		async execute(task: AdapterTask): Promise<AdapterAgentResult> {
			const startTime = Date.now();

			try {
				const systemPrompt =
					SYSTEM_PROMPTS[baseAgent.id] || SYSTEM_PROMPTS["default"];

				const userPrompt =
					typeof task.data === "string"
						? task.data
						: JSON.stringify(task.data, null, 2);

				const response = await openRouter.executeAgentTask(
					baseAgent.id,
					systemPrompt,
					userPrompt,
					options?.tools,
				);

				const content = response.choices[0]?.message?.content || "";
				let parsedData: Record<string, unknown>;

				try {
					parsedData = JSON.parse(content);
				} catch {
					parsedData = { analysis: content };
				}

				const costMetrics = openRouter.getCostMetrics();

				SecureLogger.info("Agent execution via OpenRouter", {
					agentId: baseAgent.id,
					model: response.model,
					tokens: response.usage.total_tokens,
					cost: response.usage.cost,
					budgetRemaining: costMetrics.budgetRemaining,
				});

				return {
					agentId: baseAgent.id,
					taskId: task.id,
					success: true,
					data: {
						...parsedData,
						_meta: {
							model: response.model,
							tokens: response.usage.total_tokens,
							cost: response.usage.cost,
						},
					},
					executionTime: Date.now() - startTime,
					timestamp: new Date(),
				};
			} catch (error) {
				SecureLogger.error("Agent execution failed", {
					agentId: baseAgent.id,
					error: error instanceof Error ? error.message : String(error),
				});

				return {
					agentId: baseAgent.id,
					taskId: task.id,
					success: false,
					data: null,
					executionTime: Date.now() - startTime,
					timestamp: new Date(),
					errors: [error instanceof Error ? error.message : String(error)],
				};
			}
		},
	};
}

export async function batchExecuteAgents(
	tasks: Array<{ agent: AdapterAgent; task: AdapterTask }>,
	options?: {
		maxConcurrent?: number;
	},
): Promise<AdapterAgentResult[]> {
	const maxConcurrent = options?.maxConcurrent || 5;
	const results: AdapterAgentResult[] = [];

	for (let i = 0; i < tasks.length; i += maxConcurrent) {
		const batch = tasks.slice(i, i + maxConcurrent);

		const batchResults = await Promise.all(
			batch.map(({ agent, task }) => {
				const enhancedAgent = createOpenRouterAgent(agent);
				return enhancedAgent.execute(task);
			}),
		);

		results.push(...batchResults);
	}

	return results;
}

export function getOpenRouterCostSummary(): {
	totalCost: number;
	budgetRemaining: number;
	topModels: Array<{ model: string; cost: number }>;
	topProviders: Array<{ provider: string; cost: number }>;
} {
	const metrics = openRouter.getCostMetrics();

	const topModels = Array.from(metrics.modelBreakdown.entries())
		.map(([model, stats]) => ({ model, cost: stats.cost }))
		.sort((a, b) => b.cost - a.cost)
		.slice(0, 5);

	const topProviders = Array.from(metrics.providerBreakdown.entries())
		.map(([provider, stats]) => ({ provider, cost: stats.cost }))
		.sort((a, b) => b.cost - a.cost)
		.slice(0, 5);

	return {
		totalCost: metrics.totalCost,
		budgetRemaining: metrics.budgetRemaining,
		topModels,
		topProviders,
	};
}

export function checkBudgetStatus(warningThreshold = 0.8): {
	status: "ok" | "warning" | "exceeded";
	remaining: number;
	percentage: number;
} {
	const metrics = openRouter.getCostMetrics();
	const percentage = metrics.totalCost / metrics.monthlyBudget;

	let status: "ok" | "warning" | "exceeded";
	if (percentage >= 1) {
		status = "exceeded";
	} else if (percentage >= warningThreshold) {
		status = "warning";
	} else {
		status = "ok";
	}

	return {
		status,
		remaining: metrics.budgetRemaining,
		percentage: percentage * 100,
	};
}
