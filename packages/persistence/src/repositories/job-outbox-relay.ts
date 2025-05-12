/**
 * Outbox Relay — W2-06C
 *
 * Reliable outbox relay that claims events with SKIP LOCKED ownership,
 * publishes them to BullMQ with deterministic jobId, and marks them as
 * published — all in one atomic PG transaction.
 *
 * PostgreSQL is the source of truth. Redis/BullMQ is the transport layer.
 */

import type { Queue } from "bullmq";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { randomUUID } from "node:crypto";
import { PostgresJobExecutionRepository } from "./postgres-job-execution.repository";
import type { DbTransaction } from "../unit-of-work";
import type { FailureProbe } from "../failure";
import { NoopFailureProbe } from "../failure";
import type { JobExecutionMetrics } from "../metrics";
import { NoopJobExecutionMetrics } from "../metrics";
import type { StructuredLogger } from "../logger";
import { NoopLogger } from "../logger";
import { safeCall } from "../observability-safe";

// ─── Constants ───────────────────────────────────────────────────────────────

const CLAIM_TIMEOUT_MS = 60_000; // 1 min claim lease
const BATCH_SIZE = 20;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OutboxRelayConfig {
	queue: Queue;
	batchSize?: number;
	claimTimeoutMs?: number;
}

export interface OutboxRelayDependencies {
	/** Probe de fallos para tests (default Noop) */
	failureProbe?: FailureProbe;
	/** Métricas de jobs (default Noop) */
	metrics?: JobExecutionMetrics;
	/** Logger estructurado (default Noop) */
	logger?: StructuredLogger;
}

export interface ClaimedEvent {
	id: string;
	jobExecutionId: string;
	queueName: string;
	jobType: string;
	payload: unknown;
}

export interface RelayResult {
	claimed: number;
	published: number;
	discarded: number;
	failed: number;
}

// ─── OutboxRelay ─────────────────────────────────────────────────────────────

export class OutboxRelay {
	private readonly repo: PostgresJobExecutionRepository;
	private readonly queue: Queue;
	private readonly batchSize: number;
	private readonly claimTimeoutMs: number;
	private readonly failureProbe: FailureProbe;
	private readonly metrics: JobExecutionMetrics;
	private readonly logger: StructuredLogger;

	constructor(config: OutboxRelayConfig, deps?: OutboxRelayDependencies) {
		this.repo = new PostgresJobExecutionRepository();
		this.queue = config.queue;
		this.batchSize = config.batchSize ?? BATCH_SIZE;
		this.claimTimeoutMs = config.claimTimeoutMs ?? CLAIM_TIMEOUT_MS;
		this.failureProbe = deps?.failureProbe ?? new NoopFailureProbe();
		this.metrics = deps?.metrics ?? new NoopJobExecutionMetrics();
		this.logger = deps?.logger ?? new NoopLogger();
	}

	/**
	 * Run one relay cycle: claim, publish, confirm.
	 * Call this on a timer (e.g., every 500ms).
	 */
	async runCycle(db: PostgresJsDatabase | DbTransaction): Promise<RelayResult> {
		const relayToken = randomUUID();
		const events = await this.claimEvents(db, relayToken);

		if (events.length === 0) {
			return { claimed: 0, published: 0, discarded: 0, failed: 0 };
		}

		// ── after claim ────────────────────────────────────────────────
		for (const event of events) {
			await this.failureProbe.hit("outbox.after-claim", {
				component: "outbox-relay",
				executionId: event.jobExecutionId,
				outboxId: event.id,
				queueName: event.queueName,
				jobType: event.jobType,
			});
		}

		let published = 0;
		let discarded = 0;
		let failed = 0;

		for (const event of events) {
			// Step 1: Check execution validity BEFORE any queue.add
			const execution = await this.repo.findById(
				db as PostgresJsDatabase,
				event.jobExecutionId,
			);

			if (
				execution &&
				(execution.status === "SUPERSEDED" || execution.status === "CANCELLED")
			) {
				await this.discardEvent(db, event.id);
				discarded++;
				continue;
			}

			// Step 2: If execution is NOT in a publishable state (e.g., already ENQUEUED),
			// skip without error
			if (execution && execution.status !== "PENDING") {
				await this.discardEvent(db, event.id);
				discarded++;
				continue;
			}

			// Step 3: Publish to BullMQ (call queue.add)
			await this.failureProbe.hit("outbox.before-queue-add", {
				component: "outbox-relay",
				executionId: event.jobExecutionId,
				outboxId: event.id,
			});

			const ok = await this.publishEvent(db, event);
			if (ok) {
				published++;
			} else {
				await this.recordRelayFailure(db, event.id, "queue.add failed");
				failed++;
			}
		}

		return { claimed: events.length, published, discarded, failed };
	}

	// ─── Claim ─────────────────────────────────────────────────────────

	private async claimEvents(
		tx: PostgresJsDatabase | DbTransaction,
		relayToken: string,
	): Promise<ClaimedEvent[]> {
		const rows = (await tx.execute(sql`
			UPDATE job_outbox
			SET status = 'CLAIMED',
				relay_token = ${relayToken}::uuid,
				claimed_at = NOW(),
				claim_expires_at = NOW() + MAKE_INTERVAL(secs => ${this.claimTimeoutMs / 1000}),
				attempt_count = attempt_count + 1
    			WHERE id IN (
    				SELECT id FROM job_outbox
    				WHERE (status = 'PENDING' AND available_at <= NOW())
    				   OR (status = 'CLAIMED' AND claim_expires_at <= NOW())
    				ORDER BY created_at ASC
    				LIMIT ${this.batchSize}
    				FOR UPDATE SKIP LOCKED
    			)
			RETURNING id, job_execution_id, queue_name, job_type, payload
		`)) as Record<string, unknown>[];

		return rows.map((r) => ({
			id: r.id as string,
			jobExecutionId: r.job_execution_id as string,
			queueName: r.queue_name as string,
			jobType: r.job_type as string,
			payload: r.payload as unknown,
		}));
	}

	// ─── Publish ──────────────────────────────────────────────────────

	private async publishEvent(
		tx: PostgresJsDatabase | DbTransaction,
		event: ClaimedEvent,
	): Promise<boolean> {
		const jobId = `job-execution:${event.jobExecutionId}`;
		const logCtx = {
			executionId: event.jobExecutionId,
			outboxId: event.id,
			queueName: event.queueName,
			jobType: event.jobType,
		};
		const metricLabels = {
			queueName: event.queueName,
			jobType: event.jobType,
		};

		let bullJob: { id?: string };
		try {
			bullJob = await this.queue.add(
				event.jobType,
				{
					executionId: event.jobExecutionId,
					queueName: event.queueName,
					jobType: event.jobType,
					payload: event.payload,
				},
				{
					jobId,
					removeOnComplete: {
						age: 24 * 3600,
						count: 1000,
					},
					removeOnFail: {
						age: 7 * 24 * 3600,
					},
				},
			);
		} catch {
			// queue.add failed — will be retried when claim expires
			safeCall(() => this.metrics.outboxPublishFailed(metricLabels));
			safeCall(() => this.logger.warn("job.outbox.publish_failed", logCtx));
			return false;
		}

		// queue.add succeeded — proceed with PG confirmation
		// NOTE: this is outside the try-catch so failure probe crashes
		// propagate through runCycle() instead of being swallowed.
		return await this.confirmPublish(
			tx,
			event,
			bullJob,
			jobId,
			logCtx,
			metricLabels,
		);
	}

	private async confirmPublish(
		tx: PostgresJsDatabase | DbTransaction,
		event: ClaimedEvent,
		bullJob: { id?: string },
		jobId: string,
		logCtx: Record<string, string>,
		metricLabels: { queueName: string; jobType: string },
	): Promise<true> {
		// ── after queue.add accepted ──
		await this.failureProbe.hit("outbox.after-queue-add", {
			component: "outbox-relay",
			...logCtx,
		});

		await tx.execute(sql`
			UPDATE job_executions
			SET status = 'ENQUEUED'::job_execution_status,
				bullmq_job_id = ${bullJob.id ?? jobId},
				enqueued_at = NOW(),
				updated_at = NOW()
			WHERE id = ${event.jobExecutionId}::uuid
				AND status = 'PENDING'::job_execution_status
		`);

		await tx.execute(sql`
			UPDATE job_outbox
			SET status = 'PUBLISHED',
				published_at = NOW(),
				relay_token = NULL,
				claimed_at = NULL,
				claim_expires_at = NULL
			WHERE id = ${event.id}::uuid
		`);

		await this.failureProbe.hit("outbox.after-pg-confirm", {
			component: "outbox-relay",
			...logCtx,
		});

		safeCall(() => this.metrics.outboxPublished(metricLabels));
		safeCall(() => this.logger.info("job.outbox.published", logCtx));
		return true;
	}

	// ─── Discard ──────────────────────────────────────────────────────

	private async discardEvent(
		tx: PostgresJsDatabase | DbTransaction,
		eventId: string,
	): Promise<void> {
		await tx.execute(sql`
			UPDATE job_outbox
			SET status = 'DISCARDED',
				discarded_at = NOW(),
				relay_token = NULL,
				claimed_at = NULL,
				claim_expires_at = NULL
			WHERE id = ${eventId}::uuid
		`);
	}

	// ─── Record failure ───────────────────────────────────────────────

	private async recordRelayFailure(
		tx: PostgresJsDatabase | DbTransaction,
		eventId: string,
		error: string,
	): Promise<void> {
		await tx.execute(sql`
			UPDATE job_outbox
			SET status = 'FAILED',
				last_error = ${error}::text,
				next_attempt_at = NOW() + MAKE_INTERVAL(secs => ${30}),
				relay_token = NULL,
				claimed_at = NULL,
				claim_expires_at = NULL
			WHERE id = ${eventId}::uuid
		`);
	}
}
