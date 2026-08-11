/**
 * Orchestrator Service - Master Coordinator
 *
 * Implements PARL-inspired dynamic orchestration without RL training.
 * Decides when to parallelize, what agents to spawn, and tracks costs.
 *
 * @module ai-swarm/orchestrator
 */

import { generateText, type LanguageModel } from "ai";
import { createLogger } from "../../../lib/logger";
import {
	getModelForAgent,
	hasOpenRouterKey,
	openrouter,
} from "../config/openrouter.config";
import type {
	AgentType,
	BaseTask,
	TaskAnalysis,
	TaskPriority,
} from "../config/types";
import { budgetTracker } from "../tools/budget-tracker";

const logger = createLogger({ module: "ai-swarm/orchestrator-service" });

/**
 * Task complexity metrics
 */
interface TaskComplexity {
	fileCount: number;
	totalSizeBytes: number;
	taskType: "INVOICE" | "BILL" | "RECONCILIATION" | "SIRE";
	priority: TaskPriority;
}

/**
 * Orchestrator Service
 *
 * Analyzes tasks and decides execution strategy:
 * - Sequential vs Parallel
 * - Batch size
 * - Agent selection
 * - Cost estimation
 * @example
 * ```ts
 * const value = new OrchestratorService();
 * console.log(value);
 * ```
 */

export class OrchestratorService {
	/**
	 * Analyze task and determine execution strategy
	 *
	 * Implements PARL-inspired heuristics:
	 * 1. Small tasks (<5 files): Sequential
	 * 2. Medium tasks (5-20 files): Parallel batch of 5
	 * 3. Large tasks (>20 files): Parallel batch of 10
	 *
	 * @param task - Task to analyze
	 * @returns Execution strategy
	 */
	async analyzeTask(complexity: TaskComplexity): Promise<TaskAnalysis> {
		const { fileCount, taskType } = complexity;

		// Heuristic 1: Small tasks are sequential
		if (fileCount < 5) {
			return {
				shouldParallelize: false,
				batchSize: 1,
				estimatedCost: fileCount * 0.012,
				estimatedTime: fileCount * 30, // 30 seconds per file
				agentsRequired: this.getAgentsForTaskType(taskType),
			};
		}

		// Heuristic 2: Medium tasks use batch of 5
		if (fileCount <= 20) {
			const batchSize = 5;
			const batches = Math.ceil(fileCount / batchSize);

			return {
				shouldParallelize: true,
				batchSize,
				estimatedCost: fileCount * 0.012,
				estimatedTime: batches * 30, // 30 seconds per batch
				agentsRequired: this.getAgentsForTaskType(taskType),
			};
		}

		// Heuristic 3: Large tasks use batch of 10
		const batchSize = 10;
		const batches = Math.ceil(fileCount / batchSize);

		return {
			shouldParallelize: true,
			batchSize,
			estimatedCost: fileCount * 0.012,
			estimatedTime: batches * 30, // 30 seconds per batch
			agentsRequired: this.getAgentsForTaskType(taskType),
		};
	}

	/**
	 * Determine which agents are needed for task type
	 */
	private getAgentsForTaskType(taskType: string): AgentType[] {
		switch (taskType) {
			case "INVOICE":
				return ["ocr", "sunat", "pcge", "evidence"];
			case "BILL":
				return ["ocr", "sunat", "pcge", "evidence"];
			case "RECONCILIATION":
				return ["reconciliation", "evidence"];
			case "SIRE":
				return ["sunat", "evidence"];
			default:
				return ["ocr", "sunat"];
		}
	}

	/**
	 * Ask orchestrator AI to review execution plan
	 *
	 * Uses Claude 3.5 Sonnet for strategic decisions.
	 * This is optional - only used when human review is needed.
	 */
	async reviewExecutionPlan(
		task: BaseTask,
		analysis: TaskAnalysis,
	): Promise<{ approved: boolean; feedback?: string }> {
		if (!hasOpenRouterKey()) {
			return {
				approved: true,
				feedback: "Skipped: OPENROUTER_API_KEY not configured.",
			};
		}

		try {
			const model = openrouter(
				getModelForAgent("orchestrator"),
			) as unknown as LanguageModel;

			const prompt = `
You are the orchestrator for ARKELYTHEX financial automation system.

Review this execution plan:

Task: ${task.type}
Priority: ${task.priority}
Files: ${task.metadata?.fileCount || 0}

Proposed Strategy:
- Parallel: ${analysis.shouldParallelize}
- Batch Size: ${analysis.batchSize}
- Estimated Cost: $${analysis.estimatedCost.toFixed(4)}
- Estimated Time: ${analysis.estimatedTime}s
- Agents: ${analysis.agentsRequired.join(", ")}

Should we approve this plan? Consider:
1. Cost efficiency
2. Time constraints
3. Resource availability

Respond with JSON:
{
  "approved": boolean,
  "feedback": "string (if not approved)"
}
`;

			const result = await generateText({
				model,
				prompt,
				temperature: 0.1,
			});

			const response = JSON.parse(result.text);
			return response;
		} catch (error) {
			logger.error({ error }, "Orchestrator review failed");
			// Default to approving if AI fails
			return { approved: true };
		}
	}

	/**
	 * Calculate current budget usage
	 *
	 * In-memory for POC (see `tools/budget-tracker.ts`)
	 */
	async getBudgetUsage() {
		return budgetTracker.getUsage();
	}
}
