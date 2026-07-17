/**
 * Domain-agnostic agent orchestrator.
 *
 * Coordinates task execution across registered agents using the
 * PluginRegistry for plugin-based agent registration.
 *
 * Zero fiscal imports — all agents are registered via the generic
 * agent registration interface.
 *
 * @module @arkelythex/platform-core/swarm
 */

import type { TaskDefinition, TaskResult } from "../kernel/types.js";

/**
 * Agent execution contract.
 *
 * Any callable agent registered with the orchestrator must implement
 * this interface.
 */
export interface AgentExecutor {
	id: string;
	type: string;
	capabilities: string[];
	execute(task: TaskDefinition): Promise<TaskResult>;
}

/**
 * Orchestrator health metrics.
 */
export interface OrchestratorMetrics {
	totalAgents: number;
	tasksExecuted: number;
	tasksFailed: number;
}

/**
 * Aggregation strategy for parallel execution results.
 */
export type AggregationStrategy = "all-results" | "first-wins" | "consensus";

/**
 * Domain-agnostic orchestrator for agent task execution.
 *
 * @example
 * ```ts
 * const orchestrator = new Orchestrator();
 * orchestrator.registerAgent(myAgent);
 * const result = await orchestrator.execute(task);
 * ```
 */
export class Orchestrator {
	private agents = new Map<string, AgentExecutor>();
	private tasksExecuted = 0;
	private tasksFailed = 0;
	private isShutdown = false;

	/**
	 * Register an agent executor.
	 */
	registerAgent(agent: AgentExecutor): void {
		this.agents.set(agent.id, agent);
	}

	/**
	 * Execute a single task against the first matching agent.
	 *
	 * If no agent matches the task type, returns a failed TaskResult.
	 * If the orchestrator is shut down, returns a failed TaskResult.
	 */
	async execute(task: TaskDefinition): Promise<TaskResult> {
		if (this.isShutdown) {
			return this.failedResult(task.id, "Orchestrator is shut down");
		}

		const agent = this.findAgent(task);
		if (!agent) {
			return this.failedResult(
				task.id,
				`No agent registered for type: ${task.type}`,
			);
		}

		try {
			const result = await agent.execute(task);
			this.tasksExecuted++;
			return result;
		} catch (error) {
			this.tasksFailed++;
			return this.failedResult(
				task.id,
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	/**
	 * Execute a task across multiple agents in parallel.
	 */
	async executeParallel(
		task: TaskDefinition,
		agentIds: string[],
		strategy: AggregationStrategy = "all-results",
	): Promise<TaskResult[]> {
		if (agentIds.length === 0) return [];

		const promises = agentIds.map(async (agentId) => {
			const agent = this.agents.get(agentId);
			if (!agent) {
				return this.failedResult(task.id, `Agent not found: ${agentId}`);
			}

			try {
				const result = await agent.execute(task);
				this.tasksExecuted++;
				return result;
			} catch (error) {
				this.tasksFailed++;
				return this.failedResult(
					task.id,
					error instanceof Error ? error.message : String(error),
				);
			}
		});

		const results = await Promise.all(promises);
		return this.aggregate(results, strategy);
	}

	/**
	 * Shut down the orchestrator. No further tasks will be accepted.
	 */
	shutdown(): void {
		this.isShutdown = true;
	}

	/**
	 * Return health metrics.
	 */
	getHealthMetrics(): OrchestratorMetrics {
		return {
			totalAgents: this.agents.size,
			tasksExecuted: this.tasksExecuted,
			tasksFailed: this.tasksFailed,
		};
	}

	/**
	 * Find the best agent for a task.
	 */
	private findAgent(task: TaskDefinition): AgentExecutor | undefined {
		// Direct type match first
		for (const agent of this.agents.values()) {
			if (agent.type === task.type) return agent;
		}
		return undefined;
	}

	/**
	 * Create a failed TaskResult.
	 */
	private failedResult(taskId: string, error: string): TaskResult {
		return {
			taskId,
			status: "failed",
			error,
			startedAt: new Date().toISOString(),
			attempts: 1,
		};
	}

	/**
	 * Aggregate results using the specified strategy.
	 */
	private aggregate(
		results: TaskResult[],
		strategy: AggregationStrategy,
	): TaskResult[] {
		switch (strategy) {
			case "first-wins":
				return results.length > 0 ? [results[0]] : [];
			case "consensus": {
				const completed = results.filter((r) => r.status === "completed");
				return completed.length > 0 ? [completed[0]] : results.slice(0, 1);
			}
			default:
				return results;
		}
	}
}
