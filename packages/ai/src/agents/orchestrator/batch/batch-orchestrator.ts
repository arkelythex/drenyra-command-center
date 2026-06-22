/**
 * Batch Orchestrator
 *
 * Processes multiple invoices with controlled concurrency by wrapping
 * WorkflowOrchestratorV2.processInvoice(). Each invoice runs in a separate
 * agent workflow, while a semaphore limits the number of concurrent runs.
 *
 * Items are processed independently — failures in one item do not block
 * the rest of the batch. The batch-level status reflects the aggregate:
 *   - completed:  all items succeeded
 *   - partial:    at least one succeeded and at least one failed
 *   - failed:     all items failed
 *
 * @module ai/agents/orchestrator/batch
 */

import { randomUUID } from "crypto";
import type { SessionStore } from "../../../session/session-store";
import type { WorkflowOrchestratorV2 } from "../workflow-v2";
import type { ReaderInput } from "../../types/agent.types";
import type {
	BatchOrchestratorConfig,
	BatchResult,
	BatchItemResult,
	BatchItemStatus,
	BatchStatus,
} from "./batch.types";
import type { EventBus } from "../event.bus";
import { loggers } from "../../../logger";

/**
 * BatchOrchestrator — processes multiple invoice inputs with a concurrency
 * limit via a simple semaphore (counter + promise queue).
 *
 * @example
 * ```ts
 * const orchestrator = new BatchOrchestrator(
 *   sessionStore,
 *   () => new WorkflowOrchestratorV2(reader, parser, validator, arbitrator),
 *   { maxConcurrent: 3 },
 * );
 *
 * const result = await orchestrator.runBatch({
 *   batchId: batch.id,
 *   companyId: "uuid",
 *   inputs: [input1, input2, input3],
 * });
 * ```
 */
export class BatchOrchestrator {
	private sessionStore: SessionStore;
	private createOrchestrator: () => WorkflowOrchestratorV2;
	private config: BatchOrchestratorConfig;
	private active: Map<string, AbortController>;
	private cancelled: Set<string> = new Set();
	private semaphoreCount = 0;
	private queue: Array<() => void> = [];

	constructor(
		sessionStore: SessionStore,
		createOrchestrator: () => WorkflowOrchestratorV2,
		config: Partial<BatchOrchestratorConfig> = {},
	) {
		this.sessionStore = sessionStore;
		this.createOrchestrator = createOrchestrator;
		this.config = {
			maxConcurrent: 3,
			enablePersistence: true,
			companyId: "",
			...config,
		};
		this.active = new Map();
	}

	/**
	 * Run a batch of invoice processing jobs.
	 *
	 * 1. Initializes the batch in the session store (creates item rows).
	 * 2. Processes each input with a semaphore-guarded concurrency limit.
	 * 3. After each item completes or fails, updates item status + batch progress in the store.
	 * 4. Determines the final batch status and persists it.
	 *
	 * Errors from individual processInvoice() calls are caught per-item
	 * and never propagate to the batch level. Only the initial DB setup
	 * or final status update failures propagate.
	 */
	async runBatch(params: {
		batchId: string;
		companyId: string;
		inputs: ReaderInput[];
		sessionId?: string;
	}): Promise<BatchResult> {
		const { batchId, companyId, inputs, sessionId } = params;
		const total = inputs.length;
		const items: BatchItemResult[] = new Array(total);

		loggers.ai.info("Batch started", { batchId, companyId, total });

		// ── Register AbortController ────────────────────────────────
		const controller = new AbortController();
		this.active.set(params.batchId, controller);

		// ── Create batch item rows in the store ─────────────────────
		if (this.config.enablePersistence) {
			for (const _ of inputs) {
				await this.sessionStore.addBatchItem(batchId, { sessionId });
			}
		}

		// Retrieve item IDs so we can update by ID later
		const dbItems = this.config.enablePersistence
			? await this.sessionStore.getBatchItems(batchId)
			: [];

		// ── Process each input with semaphore ───────────────────────
		const processingPromises = inputs.map(async (input, index) => {
			await this.acquire();

			// Check if batch was cancelled while waiting for semaphore
			if (this.cancelled.has(batchId)) {
				const itemResult: BatchItemResult = {
					index,
					status: "cancelled" as BatchItemStatus,
				};
				items[index] = itemResult;
				if (this.config.enablePersistence && dbItems[index]) {
					await this.sessionStore.updateBatchItem(batchId, dbItems[index].id, {
						status: "cancelled",
					});
				}
				this.release();
				return;
			}

			const itemResult: BatchItemResult = {
				index,
				status: "running" as BatchItemStatus,
			};

			try {
				const runId = randomUUID();

				// Update item status to running
				if (this.config.enablePersistence && dbItems[index]) {
					await this.sessionStore.updateBatchItem(batchId, dbItems[index].id, {
						status: "running",
						runId,
					});
				}

				// Process the invoice
				const orchestrator = this.createOrchestrator();
				const result = await orchestrator.processInvoice(input, runId);

				// Mark item completed
				itemResult.status = "completed";
				itemResult.runId = runId;
				itemResult.sessionId = sessionId;
				itemResult.result = result;

				if (this.config.enablePersistence && dbItems[index]) {
					await this.sessionStore.updateBatchItem(batchId, dbItems[index].id, {
						status: "completed",
						runId,
					});
				}

				loggers.ai.info("Batch item completed", {
					batchId,
					index,
					runId,
				});
			} catch (error) {
				const errorMessage = error instanceof Error
					? error.message
					: String(error);

				itemResult.status = "failed";
				itemResult.error = errorMessage;

				if (this.config.enablePersistence && dbItems[index]) {
					await this.sessionStore.updateBatchItem(batchId, dbItems[index].id, {
						status: "failed",
						error: errorMessage,
					});
				}

				loggers.ai.warn("Batch item failed", {
					batchId,
					index,
					error: errorMessage,
				});
			} finally {
				items[index] = itemResult;
				this.release();
			}
		});

		await Promise.all(processingPromises);

		// ── Determine final batch status ────────────────────────────
		const completedCount = items.filter((i) => i.status === "completed").length;
		const failedCount = items.filter((i) => i.status === "failed").length;
		const cancelledCount = items.filter((i) => i.status === "cancelled").length;

		let finalStatus: BatchStatus;
		if (cancelledCount > 0) {
			finalStatus = "cancelled";
		} else if (completedCount === total) {
			finalStatus = "completed";
		} else if (failedCount === total) {
			finalStatus = "failed";
		} else {
			finalStatus = "partial";
		}

		// ── Persist final batch state ───────────────────────────────
		if (this.config.enablePersistence) {
			await this.sessionStore.updateBatchProgress(batchId, {
				status: finalStatus,
				completed: completedCount,
				failed: failedCount,
			});
		}

		this.active.delete(batchId);

		loggers.ai.info("Batch finished", {
			batchId,
			status: finalStatus,
			completed: completedCount,
			failed: failedCount,
		});

		return {
			batchId,
			status: finalStatus,
			total,
			completed: completedCount,
			failed: failedCount,
			items,
		};
	}

	// ─── Progress Tracking ───────────────────────────────────────────────

	/**
	 * Returns lightweight progress for a running batch by reading the
	 * persisted batch state from the session store.
	 */
	async getProgress(
		batchId: string,
	): Promise<{ total: number; completed: number; failed: number } | null> {
		try {
			const batch = await this.sessionStore.getBatch(batchId);
			if (!batch) return null;
			return {
				total: batch.total,
				completed: batch.completed,
				failed: batch.failed,
			};
		} catch {
			return null;
		}
	}

	// ─── Cancel Batch ────────────────────────────────────────────────────

	/**
	 * Cancel a running batch.
	 *
	 * 1. Adds the batchId to the cancelled set so queued items skip processing.
	 * 2. Resolves all queued semaphore waiters so they can check the cancelled set.
	 * 3. Aborts any currently running processes.
	 * 4. Updates the batch status in the DB if persistence is enabled.
	 */
	async cancelBatch(batchId: string): Promise<void> {
		this.cancelled.add(batchId);

		// Resolve all queued waiters — they'll check `cancelled` and skip
		while (this.queue.length > 0) {
			const waiter = this.queue.shift();
			if (waiter) waiter();
		}

		// Abort any currently running processes
		const controller = this.active.get(batchId);
		if (controller) {
			controller.abort();
		}

		// Update batch status in DB if persistence enabled
		if (this.config.enablePersistence) {
			try {
				await this.sessionStore.updateBatchProgress(batchId, {
					status: "cancelled",
				});
			} catch (err) {
				loggers.ai.warn("Failed to update cancelled batch status in DB", {
					batchId,
					error: String(err),
				});
			}
		}

		loggers.ai.info("Batch cancelled", { batchId });
		this.active.delete(batchId);
	}

	// ─── Semaphore Implementation ────────────────────────────────────────

	/**
	 * Acquire a semaphore slot. If the maximum concurrency has been reached,
	 * the caller will be queued until a slot is released.
	 */
	private async acquire(): Promise<void> {
		if (this.semaphoreCount < this.config.maxConcurrent) {
			this.semaphoreCount++;
			return;
		}
		return new Promise<void>((resolve) => {
			this.queue.push(resolve);
		});
	}

	/**
	 * Release a semaphore slot. If items are queued, the next one acquires
	 * the slot immediately. Otherwise the counter is decremented.
	 */
	private release(): void {
		const next = this.queue.shift();
		if (next) {
			// Transfer the slot to the next queued item
			next();
		} else {
			this.semaphoreCount--;
		}
	}
}
