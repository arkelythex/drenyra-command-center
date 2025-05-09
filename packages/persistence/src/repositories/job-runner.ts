/**
 * JobRunner — W2-06C
 *
 * Public safe API for executing jobs with lease acquisition, heartbeat,
 * fencing, and lifecycle management.
 *
 * Similar to consumeOnce: manages the full lifecycle so callers don't
 * have to handle token, generation, lease, completion, or rollback.
 */

import { createHash } from "node:crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { PostgresJobExecutionRepository } from "./postgres-job-execution.repository";
import type { FailureProbe } from "../failure";
import { NoopFailureProbe } from "../failure";
import type { JobExecutionMetrics } from "../metrics";
import { NoopJobExecutionMetrics } from "../metrics";
import type { StructuredLogger } from "../logger";
import { NoopLogger } from "../logger";
import { safeCall } from "../observability-safe";

// ─── Types ───────────────────────────────────────────────────────────────────

export type LeaseAcquisition =
	| {
			kind: "acquired";
			token: string;
			generation: number;
			execution?: {
				queueName: string;
				jobType: string;
				logicalKey: string;
				attemptCount: number;
				payload?: unknown;
			};
	  }
	| { kind: "already-completed" }
	| { kind: "currently-running"; retryAfterMs?: number }
	| { kind: "superseded" }
	| { kind: "cancelled" }
	| { kind: "terminal-failure" }
	| { kind: "stale-delivery" };

export interface JobContext {
	execution: {
		id: string;
		generation: number;
		queueName: string;
		jobType: string;
		logicalKey: string;
		attemptCount: number;
		payload?: unknown;
	};
	/** AbortSignal that fires when ownership is lost */
	signal: AbortSignal;
	/** Renew the lease. Returns false if ownership was lost. */
	heartbeat(): Promise<boolean>;
}

export type JobResult =
	| { kind: "completed"; resultMetadata?: unknown }
	| { kind: "failed-retryable"; failureCode: string }
	| { kind: "failed-terminal"; failureCode: string };

export interface JobRunnerConfig {
	db: PostgresJsDatabase;
	defaultLeaseDurationMs?: number;
}

export interface JobRunnerDependencies {
	failureProbe?: FailureProbe;
	metrics?: JobExecutionMetrics;
	logger?: StructuredLogger;
}

// ─── JobRunner ───────────────────────────────────────────────────────────────

export class JobRunner {
	private readonly repo: PostgresJobExecutionRepository;
	private readonly db: PostgresJsDatabase;
	private readonly defaultLeaseDurationMs: number;
	private readonly failureProbe: FailureProbe;
	private readonly metrics: JobExecutionMetrics;
	private readonly logger: StructuredLogger;

	constructor(config: JobRunnerConfig, deps?: JobRunnerDependencies) {
		this.repo = new PostgresJobExecutionRepository();
		this.db = config.db;
		this.defaultLeaseDurationMs = config.defaultLeaseDurationMs ?? 60_000;
		this.failureProbe = deps?.failureProbe ?? new NoopFailureProbe();
		this.metrics = deps?.metrics ?? new NoopJobExecutionMetrics();
		this.logger = deps?.logger ?? new NoopLogger();
	}

	/**
	 * Run a job: acquire lease → heartbeat → handler → complete.
	 *
	 * The handler receives { execution, signal, heartbeat }.
	 * - `signal` fires when ownership is lost (lease expired or superseded).
	 * - `heartbeat()` returns false if the lease can't be renewed.
	 *
	 * If the handler returns normally, the job is marked COMPLETED.
	 * If it throws, the job is marked FAILED RETRYABLE (or TERMINAL).
	 */
	async run(
		executionId: string,
		handler: (ctx: JobContext) => Promise<JobResult>,
		leaseDurationMs?: number,
	): Promise<void> {
		const token = crypto.randomUUID();
		const tokenHash = hashToken(token);
		const duration = leaseDurationMs ?? this.defaultLeaseDurationMs;

		const logCtx = {
			executionId,
			queueName: "",
			jobType: "",
			generation: 0,
			attemptCount: 0,
			executionTokenHash: tokenHash,
		};
		const metricLabels = {
			queueName: "",
			jobType: "",
		};

		const ctx = {
			component: "job-runner" as const,
			executionId,
			queueName: "",
			jobType: "",
			generation: 0,
			attemptCount: 0,
			executionTokenHash: tokenHash,
		};

		// Step 1: Acquire lease
		await this.failureProbe.hit("runner.before-acquire", ctx);
		const result = await this.acquireLease(executionId, token, duration);
		await this.failureProbe.hit("runner.after-acquire", ctx);

		if (result.kind !== "acquired") {
			// Non-blocking states: no-op
			return;
		}

		const generation = result.generation;
		if (!result.execution) {
			// Should never happen — acquired implies execution data loaded
			return;
		}
		const execInfo = result.execution;

		// Update context with execution info
		ctx.queueName = execInfo.queueName;
		ctx.jobType = execInfo.jobType;
		ctx.generation = generation;
		ctx.attemptCount = execInfo.attemptCount;
		logCtx.queueName = execInfo.queueName;
		logCtx.jobType = execInfo.jobType;
		logCtx.generation = generation;
		logCtx.attemptCount = execInfo.attemptCount;
		metricLabels.queueName = execInfo.queueName;
		metricLabels.jobType = execInfo.jobType;

		const abortController = new AbortController();

		// Step 2: Start heartbeat
		const heartbeatHandle = this.startHeartbeat(
			executionId,
			token,
			generation,
			duration,
			abortController,
		);

		try {
			// Step 3: Execute handler
			await this.failureProbe.hit("runner.before-handler", ctx);
			const jobResult = await handler({
				execution: {
					id: executionId,
					generation,
					queueName: execInfo.queueName,
					jobType: execInfo.jobType,
					logicalKey: execInfo.logicalKey,
					attemptCount: execInfo.attemptCount,
					payload: execInfo.payload,
				},
				signal: abortController.signal,
				heartbeat: async () => {
					await this.failureProbe.hit("runner.before-heartbeat", ctx);
					const ok = await this.renewLease(
						executionId,
						token,
						generation,
						duration,
					);
					await this.failureProbe.hit("runner.after-heartbeat", ctx);
					if (!ok) {
						abortController.abort();
					}
					return ok;
				},
			});

			// Step 4: Complete or fail
			switch (jobResult.kind) {
				case "completed": {
					await this.failureProbe.hit("runner.before-complete", ctx);
					const completeResult = await this.repo.complete(this.db, {
						executionId,
						executionToken: token,
						expectedGeneration: generation,
						resultMetadata: jobResult.resultMetadata,
					});
					await this.failureProbe.hit("runner.after-complete", ctx);
					this.emitCompleted(completeResult, logCtx);
					break;
				}
				case "failed-retryable":
				case "failed-terminal": {
					await this.failureProbe.hit("runner.before-fail", ctx);
					const failResult = await this.repo.fail(this.db, {
						executionId,
						executionToken: token,
						expectedGeneration: generation,
						failureClass:
							jobResult.kind === "failed-terminal" ? "TERMINAL" : "RETRYABLE",
						failureCode: jobResult.failureCode,
						retryable: jobResult.kind === "failed-retryable",
					});
					await this.failureProbe.hit("runner.after-fail", ctx);
					this.emitFailure(
						failResult,
						logCtx,
						metricLabels,
						jobResult.failureCode,
						jobResult.kind === "failed-terminal",
					);
					break;
				}
			}
		} catch (error) {
			// Unexpected error — mark as RETRYABLE
			const msg = error instanceof Error ? error.message : "Unknown error";
			await this.repo.fail(this.db, {
				executionId,
				executionToken: token,
				expectedGeneration: generation,
				failureClass: "RETRYABLE",
				failureCode: `UNHANDLED:${msg.slice(0, 80)}`,
				retryable: true,
			});
			throw error;
		} finally {
			clearInterval(heartbeatHandle);
		}
	}

	// ─── Acquire lease ────────────────────────────────────────────────

	private emitCompleted(
		result: { kind: string },
		logCtx: Record<string, unknown>,
	): void {
		if (result.kind === "completed") {
			safeCall(() => this.logger.info("job.runner.completed", logCtx));
		} else {
			safeCall(() =>
				this.logger.warn("job.runner.ownership_lost", {
					...logCtx,
					reason: result.kind,
				}),
			);
		}
	}

	private emitFailure(
		result: { kind: string },
		logCtx: Record<string, unknown>,
		metricLabels: Record<string, string | undefined>,
		failureCode: string,
		isTerminal: boolean,
	): void {
		if (result.kind !== "failed") {
			safeCall(() =>
				this.logger.warn("job.runner.ownership_lost", {
					...logCtx,
					reason: result.kind,
				}),
			);
			return;
		}
		if (isTerminal) {
			safeCall(() => this.metrics.executionTerminalFailure(metricLabels));
			safeCall(() =>
				this.logger.error("job.runner.failed", {
					...logCtx,
					failureClass: "TERMINAL",
					failureCode,
				}),
			);
		} else {
			safeCall(() =>
				this.logger.warn("job.runner.failed", {
					...logCtx,
					failureClass: "RETRYABLE",
					failureCode,
				}),
			);
		}
	}

	private async acquireLease(
		executionId: string,
		token: string,
		durationMs: number,
	): Promise<
		| {
				kind: "acquired";
				token: string;
				generation: number;
				execution: {
					queueName: string;
					jobType: string;
					logicalKey: string;
					attemptCount: number;
					payload?: unknown;
				};
		  }
		| LeaseAcquisition
	> {
		const result = await this.repo.acquireLease(this.db, {
			executionId,
			executionToken: token,
			leaseDurationMs: durationMs,
			expectedGeneration: 1,
		});

		if (result.kind === "acquired") {
			safeCall(() =>
				this.logger.info("job.runner.acquired", {
					executionId,
					executionTokenHash: hashToken(token),
				}),
			);
			const exec = await this.repo.findById(this.db, executionId);
			return {
				kind: "acquired",
				token,
				generation: exec?.generation ?? 1,
				execution: {
					queueName: exec?.queueName ?? "",
					jobType: exec?.jobType ?? "",
					logicalKey: exec?.logicalKey ?? "",
					attemptCount: exec?.attemptCount ?? 0,
					payload: undefined, // loaded separately
				},
			};
		}

		return this.mapLeaseResult(result);
	}

	private mapLeaseResult(
		result: Awaited<ReturnType<PostgresJobExecutionRepository["acquireLease"]>>,
	): LeaseAcquisition {
		switch (result.kind) {
			case "acquired":
				return result as unknown as LeaseAcquisition;
			case "already-running": {
				const retryMs = result.leaseExpiresAt
					? Math.max(0, new Date(result.leaseExpiresAt).getTime() - Date.now())
					: undefined;
				return {
					kind: "currently-running",
					...(retryMs !== undefined && { retryAfterMs: retryMs }),
				} as LeaseAcquisition;
			}
			case "wrong-generation":
				return { kind: "superseded" };
			case "invalid-state":
				return this.mapInvalidState(result.status);
		}
	}

	private mapInvalidState(status: string): LeaseAcquisition {
		switch (status) {
			case "COMPLETED":
				return { kind: "already-completed" };
			case "CANCELLED":
				return { kind: "cancelled" };
			case "SUPERSEDED":
				return { kind: "superseded" };
			case "FAILED":
				return { kind: "terminal-failure" };
			default:
				return { kind: "stale-delivery" };
		}
	}

	// ─── Heartbeat ────────────────────────────────────────────────────

	private startHeartbeat(
		executionId: string,
		token: string,
		generation: number,
		durationMs: number,
		abortController: AbortController,
	): ReturnType<typeof setInterval> {
		return setInterval(
			async () => {
				const ok = await this.renewLease(
					executionId,
					token,
					generation,
					durationMs,
				);
				if (!ok) {
					abortController.abort();
				}
			},
			Math.floor(durationMs / 3),
		);
	}

	private async renewLease(
		executionId: string,
		token: string,
		generation: number,
		durationMs: number,
	): Promise<boolean> {
		const result = await this.db.execute(sql`
			UPDATE job_executions
			SET lease_expires_at = NOW() + ${durationMs} * interval '1 millisecond',
				updated_at = NOW()
			WHERE id = ${executionId}::uuid
				AND status = 'RUNNING'::job_execution_status
				AND execution_token = ${token}::uuid
				AND generation = ${generation}
			RETURNING id
		`);

		return result.length === 1;
	}
}

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

/**
 * Hash un token para logging — nunca exponer el token completo.
 */
function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
