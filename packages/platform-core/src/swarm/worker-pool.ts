/**
 * Domain-agnostic worker pool for concurrent agent execution.
 *
 * Manages a configurable pool of in-process workers that execute
 * agent tasks with concurrency control and backpressure.
 *
 * No Worker Threads — this is an in-process scheduler suitable for
 * all JavaScript runtimes (Bun, Node.js, Deno).
 *
 * @module @arkelythex/platform-core/swarm
 */

import type { TaskDefinition } from "../kernel/types.js";

/**
 * A task execution function.
 */
export type TaskExecutor = () => Promise<unknown>;

/**
 * Configuration for the WorkerPool.
 */
export interface WorkerPoolConfig {
	/** Maximum number of concurrent workers (default: CPU count) */
	maxWorkers?: number;
	/** Queue capacity before backpressure kicks in (default: 1000) */
	queueCapacity?: number;
}

/**
 * Worker pool metrics for monitoring.
 */
export interface WorkerPoolMetrics {
	maxWorkers: number;
	activeWorkers: number;
	queuedTasks: number;
	tasksExecuted: number;
	tasksFailed: number;
}

/**
 * A queued task with its resolve/reject callbacks.
 */
interface QueuedTask {
	executor: TaskExecutor;
	resolve: (value: unknown) => void;
	reject: (error: Error) => void;
}

/**
 * In-process worker pool with concurrency control.
 *
 * @example
 * ```ts
 * const pool = new WorkerPool({ maxWorkers: 4 });
 * const result = await pool.execute(task, async () => {
 *   return agent.execute(task);
 * });
 * ```
 */
export class WorkerPool {
	private readonly maxWorkers: number;
	private readonly queueCapacity: number;
	private activeCount = 0;
	private tasksExecuted = 0;
	private tasksFailed = 0;
	private shutdownRequested = false;
	private queue: QueuedTask[] = [];

	constructor(config: WorkerPoolConfig = {}) {
		this.maxWorkers = config.maxWorkers ?? 4;
		this.queueCapacity = config.queueCapacity ?? 1000;
	}

	/**
	 * Execute a task via the pool.
	 *
	 * If a worker is available, the task executes immediately.
	 * Otherwise, it is queued until a worker frees up.
	 */
	async execute(
		_task: TaskDefinition,
		executor: TaskExecutor,
	): Promise<unknown> {
		if (this.shutdownRequested) {
			throw new Error("Worker pool is shut down");
		}

		if (this.queue.length >= this.queueCapacity) {
			throw new Error("Worker pool queue is full");
		}

		return new Promise((resolve, reject) => {
			this.queue.push({ executor, resolve, reject });
			this.processQueue();
		});
	}

	/**
	 * Process the next task in the queue.
	 */
	private processQueue(): void {
		while (this.activeCount < this.maxWorkers && this.queue.length > 0) {
			const task = this.queue.shift()!;
			this.activeCount++;
			this.executeTask(task);
		}
	}

	/**
	 * Execute a single task and handle its completion.
	 */
	private async executeTask(task: QueuedTask): Promise<void> {
		try {
			const result = await task.executor();
			this.tasksExecuted++;
			task.resolve(result);
		} catch (error) {
			this.tasksFailed++;
			task.reject(error instanceof Error ? error : new Error(String(error)));
		} finally {
			this.activeCount--;
			this.processQueue();
		}
	}

	/**
	 * Return current pool metrics.
	 */
	getMetrics(): WorkerPoolMetrics {
		return {
			maxWorkers: this.maxWorkers,
			activeWorkers: this.activeCount,
			queuedTasks: this.queue.length,
			tasksExecuted: this.tasksExecuted,
			tasksFailed: this.tasksFailed,
		};
	}

	/**
	 * Shut down the pool. No new tasks will be accepted.
	 * Currently executing tasks are allowed to finish.
	 */
	shutdown(): void {
		this.shutdownRequested = true;
		this.queue = [];
	}
}
