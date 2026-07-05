/**
 * Retry Engine
 *
 * Configurable retry engine with exponential backoff, jitter, and
 * Dead Letter Queue integration. Supports:
 * - Execute a function with automatic retry on transient errors
 * - Enqueue failed items to the DLQ for scheduled retry
 * - Process pending DLQ items with automatic retry
 *
 * @module ai/services/error-recovery
 */

import { dlqRepo } from "@drenyra/infrastructure/services/error-recovery";
import type { AgentError } from "./agent-error";
import { classifyError } from "./agent-error";

// ─── Configuration ────────────────────────────────────────────────────────────

export interface RetryConfig {
	maxRetries: number;
	baseDelayMs: number;
	maxDelayMs: number;
	useJitter: boolean;
	retryableErrors: ("TRANSIENT" | "UNKNOWN")[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	baseDelayMs: 1000,
	maxDelayMs: 30000,
	useJitter: true,
	retryableErrors: ["TRANSIENT", "UNKNOWN"],
};

// ─── Retry Engine ─────────────────────────────────────────────────────────────

export class RetryEngine {
	private dlqRepo: typeof dlqRepo;

	constructor() {
		this.dlqRepo = dlqRepo;
	}

	/**
	 * Execute a function with automatic retry on transient/unknown errors.
	 *
	 * Flow:
	 * 1. Call fn()
	 * 2. If success → return result with retries=0
	 * 3. If throws → classify error
	 * 4. If retryable → calculate delay, retry up to maxRetries
	 * 5. If all retries exhausted → enqueue to DLQ
	 *
	 * @param fn - The async function to execute
	 * @param context - Execution context (agentName, runId, etc.)
	 * @param config - Optional partial retry configuration
	 * @returns Object with result, error, and retry count
	 */
	async executeWithRetry<T>(
		fn: () => Promise<T>,
		context: {
			agentName: string;
			runId: string;
			workflowState?: string;
			input?: unknown;
		},
		config?: Partial<RetryConfig>,
	): Promise<{ result?: T; error?: AgentError; retries: number }> {
		const cfg: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

		for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
			try {
				const result = await fn();
				return { result, retries: attempt };
			} catch (err) {
				const agentError = classifyError(err, context.agentName);

				// If this is a permanent error, don't retry
				if (!cfg.retryableErrors.includes(agentError.type as "TRANSIENT" | "UNKNOWN")) {
					return { error: agentError, retries: attempt };
				}

				// If this was the last attempt, enqueue to DLQ
				if (attempt >= cfg.maxRetries) {
					await this.enqueueForRetry(
						context.runId,
						context.agentName,
						agentError,
						context.workflowState,
						undefined,
						context.input,
					);
					return { error: agentError, retries: attempt + 1 };
				}

				// Calculate delay with exponential backoff + optional jitter
				const delay = this.calculateDelay(attempt, cfg);
				await this.sleep(delay);
			}
		}

		// Should never reach here, but satisfy TypeScript
		return { retries: cfg.maxRetries + 1 };
	}

	/**
	 * Enqueue a failed execution to the Dead Letter Queue for scheduled retry.
	 *
	 * @param runId - The run ID
	 * @param agentName - The agent name
	 * @param error - The classified error
	 * @param workflowState - Optional workflow state for recovery
	 * @param batchId - Optional batch ID
	 * @param input - Optional input data for replay
	 */
	async enqueueForRetry(
		runId: string,
		agentName: string,
		error: AgentError,
		workflowState?: string,
		batchId?: string,
		input?: unknown,
	): Promise<void> {
		const now = new Date();
		const retryDelay = error.type === "TRANSIENT" ? 5000 : 30000; // 5s for transient, 30s for unknown
		const nextRetryAt = new Date(now.getTime() + retryDelay);

		await this.dlqRepo.enqueue({
			runId,
			agentName,
			errorType: error.type,
			errorMessage: error.message,
			errorDetails: error.details as Record<string, unknown>,
			workflowState: workflowState ?? null,
			retryCount: 0,
			maxRetries: 3,
			lastRetryAt: null,
			nextRetryAt,
			status: "pending",
			companyId: null,
			batchId: batchId ?? null,
		});
	}

	/**
	 * Process pending DLQ items.
	 *
	 * Dequeues items with status='pending' or 'retrying' whose
	 * nextRetryAt <= now(), then attempts to re-execute the operation.
	 *
	 * NOTE: This is a framework method. The actual retry function must be
	 * provided by the caller via the `processor` callback.
	 *
	 * @deprecated Use processPendingItems with an explicit processor instead.
	 * This overload processes items but cannot actually re-execute the
	 * original operation without a processor function.
	 *
	 * @param limit - Max items to dequeue (default 10)
	 * @returns Number of items processed
	 */
	async processPendingRetries(limit?: number): Promise<number> {
		return this.processPendingItems(limit);
	}

	/**
	 * Process pending DLQ items with an optional processor.
	 *
	 * When a processor is provided, each item is re-executed:
	 * - On success → markResolved
	 * - On failure → incrementRetry (if retries remain) or markDead
	 *
	 * When no processor is provided, items are only counted.
	 *
	 * @param limit - Max items to dequeue
	 * @param processor - Optional async function to re-execute the failed operation
	 * @returns Number of items processed
	 */
	async processPendingItems<T>(
		limit?: number,
		processor?: (item: {
			id: string;
			runId: string;
			agentName: string;
			input?: unknown;
		}) => Promise<T>,
	): Promise<number> {
		const items = await this.dlqRepo.dequeue(limit ?? 10);

		if (!processor) {
			// Without a processor, just count the items
			return items.length;
		}

		let processed = 0;

		for (const item of items) {
			try {
				const retryDelay = item.errorType === "TRANSIENT" ? 5000 : 30000;
				const nextRetryAt = new Date(Date.now() + retryDelay);

				// Mark as retrying before execution
				await this.dlqRepo.incrementRetry(item.id, nextRetryAt);

				// Re-execute the operation
				await processor({
					id: item.id,
					runId: item.runId,
					agentName: item.agentName,
					input: item.errorDetails ?? undefined,
				});

				// Success — mark as resolved
				await this.dlqRepo.markResolved(item.id);
				processed++;
			} catch {
				const maxRetries = item.maxRetries;
				const currentRetry = item.retryCount + 1;

				if (currentRetry >= maxRetries) {
					await this.dlqRepo.markDead(item.id);
				}
			}
		}

		return processed;
	}

	/**
	 * Calculate delay for a given attempt using exponential backoff + optional jitter.
	 *
	 * Formula: baseDelay * 2^attempt + random(jitter)
	 * When jitter is enabled, up to baseDelay/2 of randomness is added.
	 * The result is capped at maxDelayMs.
	 *
	 * @param attempt - Zero-based attempt number
	 * @param config - Retry configuration
	 * @returns Delay in milliseconds
	 */
	calculateDelay(attempt: number, config: RetryConfig): number {
		const exponential = config.baseDelayMs * Math.pow(2, attempt);
		const jitter = config.useJitter ? Math.random() * (config.baseDelayMs / 2) : 0;
		return Math.min(exponential + jitter, config.maxDelayMs);
	}

	/**
	 * Sleep for a given number of milliseconds.
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
