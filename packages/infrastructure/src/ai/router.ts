/**
 * Adaptive Compute Router
 *
 * Intelligently routes AI tasks to the most cost-effective model
 * Tracks usage and costs for optimization
 */

import { loggers } from "../logger";
import { getModelForTask, type ModelTask } from "./models";

/**
 * Estimated costs per 1K tokens (USD)
 */
const MODEL_COSTS = {
	flash: {
		input: 0.000075,
		output: 0.0003,
	},
	reasoning: {
		input: 0.003,
		output: 0.015,
	},
	opus: {
		input: 0.015,
		output: 0.075,
	},
} as const;

/**
 * Usage tracking for cost optimization
 */
interface UsageMetrics {
	task: ModelTask;
	model: string;
	inputTokens: number;
	outputTokens: number;
	cost: number;
	duration: number;
	timestamp: Date;
	success: boolean;
}

class AdaptiveRouter {
	private metrics: UsageMetrics[] = [];

	/**
	 * Route a task to the appropriate model
	 */
	async route(task: ModelTask) {
		const model = getModelForTask(task);
		const startTime = Date.now();

		return {
			model,
			recordMetrics: (
				inputTokens: number,
				outputTokens: number,
				success: boolean,
			) => {
				const duration = Date.now() - startTime;
				const modelType = this.getModelType(task);
				const cost = this.calculateCost(modelType, inputTokens, outputTokens);

				const metric: UsageMetrics = {
					task,
					model: modelType,
					inputTokens,
					outputTokens,
					cost,
					duration,
					timestamp: new Date(),
					success,
				};

				this.metrics.push(metric);

				// Log expensive operations
				if (cost > 0.01) {
					loggers.ai.warn("Expensive operation detected", { task, cost });
				}
			},
		};
	}

	/**
	 * Get model type from task
	 */
	private getModelType(task: ModelTask): "flash" | "reasoning" | "opus" {
		if (task === "OCR" || task === "EXTRACTION") return "flash";
		if (task === "ANALYSIS") return "opus";
		return "reasoning";
	}

	/**
	 * Calculate cost for a request
	 */
	private calculateCost(
		modelType: "flash" | "reasoning" | "opus",
		inputTokens: number,
		outputTokens: number,
	): number {
		const costs = MODEL_COSTS[modelType];
		const inputCost = (inputTokens / 1000) * costs.input;
		const outputCost = (outputTokens / 1000) * costs.output;
		return inputCost + outputCost;
	}

	/**
	 * Get usage statistics
	 */
	getStats() {
		if (this.metrics.length === 0) {
			return {
				totalCost: 0,
				totalRequests: 0,
				avgDuration: 0,
				successRate: 0,
				byTask: {},
			};
		}

		const totalCost = this.metrics.reduce((sum, m) => sum + m.cost, 0);
		const totalRequests = this.metrics.length;
		const avgDuration =
			this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
		const successRate =
			this.metrics.filter((m) => m.success).length / totalRequests;

		// Group by task
		const byTask = this.metrics.reduce(
			(acc, m) => {
				if (!acc[m.task]) {
					acc[m.task] = {
						count: 0,
						totalCost: 0,
						avgDuration: 0,
						successRate: 0,
					};
				}

				const taskMetrics = acc[m.task];
				if (taskMetrics) {
					taskMetrics.count++;
					taskMetrics.totalCost += m.cost;
					taskMetrics.avgDuration += m.duration;
				}

				return acc;
			},
			{} as Record<
				string,
				{
					count: number;
					totalCost: number;
					avgDuration: number;
					successRate: number;
				}
			>,
		);

		// Calculate averages
		for (const task in byTask) {
			const metrics = this.metrics.filter((m) => m.task === task);
			const taskMetrics = byTask[task];
			if (taskMetrics) {
				taskMetrics.avgDuration = taskMetrics.avgDuration / taskMetrics.count;
				taskMetrics.successRate =
					metrics.filter((m) => m.success).length / metrics.length;
			}
		}

		return {
			totalCost,
			totalRequests,
			avgDuration,
			successRate,
			byTask,
		};
	}

	/**
	 * Clear metrics (for testing)
	 */
	clearMetrics() {
		this.metrics = [];
	}
}

/**
 * Singleton instance
 * @example
 * ```ts
 * console.log(aiRouter);
 * ```
 */

export const aiRouter = new AdaptiveRouter();

/**
 * Helper: Log AI operation cost
 * @param task - Input for task.
 * @param cost - Input for cost.
 * @param duration - Input for duration.
 * @returns Result of logAIOperation.
 * @example
 * ```ts
 * const result = logAIOperation({} as ModelTask, 0, 0);
 * console.log(result);
 * ```
 */

export function logAIOperation(
	task: ModelTask,
	cost: number,
	duration: number,
) {
	loggers.ai.info("AI operation completed", { task, cost, duration });
}
