/**
 * Job Reconciliation — W2-06C
 *
 * Periodic reconciliation sweep to detect inconsistencies between the
 * PostgreSQL job_executions registry and the BullMQ/Redis transport layer.
 *
 * Checks:
 * 1. PENDING executions without a pending outbox event
 * 2. ENQUEUED executions whose BullMQ job disappeared
 * 3. Outbox events published but execution still PENDING
 * 4. RUNNING executions with expired leases (delegated to RecoverySweep)
 *
 * All repairs happen from PostgreSQL — never trust BullMQ state blindly.
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FailureProbe } from "../failure";
import { NoopFailureProbe } from "../failure";
import type { StructuredLogger } from "../logger";
import { NoopLogger } from "../logger";
import type { JobExecutionMetrics } from "../metrics";
import { NoopJobExecutionMetrics } from "../metrics";
import { safeCall } from "../observability-safe";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReconciliationDivergence =
	| "PENDING_WITHOUT_OUTBOX"
	| "ENQUEUED_JOB_MISSING"
	| "PUBLISHED_EXECUTION_PENDING"
	| "STALE_OUTBOX_CLAIM";

export interface ReconciliationResult {
	pendingWithoutOutbox: number;
	enqueuedWithoutJob: number;
	outboxPublishedPendingExecution: number;
	pendingOutboxRepublished: number;
}

export interface ReconciliationDependencies {
	failureProbe?: FailureProbe;
	metrics?: JobExecutionMetrics;
	logger?: StructuredLogger;
}

// ─── ReconciliationSweep ─────────────────────────────────────────────────────

export class ReconciliationSweep {
	private readonly db: PostgresJsDatabase;
	private readonly failureProbe: FailureProbe;
	private readonly metrics: JobExecutionMetrics;
	private readonly logger: StructuredLogger;

	constructor(db: PostgresJsDatabase, deps?: ReconciliationDependencies) {
		this.db = db;
		this.failureProbe = deps?.failureProbe ?? new NoopFailureProbe();
		this.metrics = deps?.metrics ?? new NoopJobExecutionMetrics();
		this.logger = deps?.logger ?? new NoopLogger();
	}

	/**
	 * Run one reconciliation cycle.
	 */
	async runCycle(): Promise<ReconciliationResult> {
		const result: ReconciliationResult = {
			pendingWithoutOutbox: 0,
			enqueuedWithoutJob: 0,
			outboxPublishedPendingExecution: 0,
			pendingOutboxRepublished: 0,
		};

		// ─── Check 1: PENDING executions without any outbox ─────────────
		const orphanPending = (await this.db.execute(sql`
			SELECT e.id FROM job_executions e
			LEFT JOIN job_outbox o ON o.job_execution_id = e.id
			WHERE e.status = 'PENDING'::job_execution_status
				AND o.id IS NULL
				AND e.created_at < NOW() - INTERVAL '5 minutes'
			LIMIT 50
		`)) as Record<string, unknown>[];

		result.pendingWithoutOutbox = orphanPending.length;

		if (orphanPending.length > 0) {
			await this.failureProbe.hit("reconciliation.after-detect", {
				component: "reconciliation-sweep",
				divergenceType: "PENDING_WITHOUT_OUTBOX" as const,
			});
			safeCall(() =>
				this.logger.warn("job.reconciliation.detected", {
					divergenceType: "PENDING_WITHOUT_OUTBOX",
					count: orphanPending.length,
				}),
			);
		}

		// Re-create outbox for these
		for (const row of orphanPending) {
			const execId = row.id as string;
			await this.failureProbe.hit("reconciliation.before-repair", {
				component: "reconciliation-sweep",
				executionId: execId,
				divergenceType: "PENDING_WITHOUT_OUTBOX" as const,
				repairType: "recreate-outbox",
			});

			const [exec] = (await this.db.execute(sql`
				SELECT queue_name, job_type, input_hash FROM job_executions
				WHERE id = ${execId}::uuid
			`)) as Record<string, unknown>[];

			if (exec) {
				await this.db.execute(sql`
					INSERT INTO job_outbox (job_execution_id, action, queue_name, job_type, payload)
					VALUES (
						${execId}::uuid,
						'ENQUEUE',
						${exec.queue_name as string},
						${exec.job_type as string},
						${sql`'{"reconciled":true}'::jsonb`}
					)
				`);
			}

			await this.failureProbe.hit("reconciliation.after-repair", {
				component: "reconciliation-sweep",
				executionId: execId,
				divergenceType: "PENDING_WITHOUT_OUTBOX" as const,
				repairType: "recreate-outbox",
			});
			this.emitRepair("PENDING_WITHOUT_OUTBOX", "recreate-outbox", execId);
		}

		// ─── Check 2: ENQUEUED but BullMQ job likely gone ─────────────
		// This is informational — the relay will re-enqueue via the outbox.
		// We detect by checking if bullmq_job_id is set.
		const enqueued = (await this.db.execute(sql`
			SELECT id, bullmq_job_id FROM job_executions
			WHERE status = 'ENQUEUED'::job_execution_status
				AND bullmq_job_id IS NOT NULL
				AND enqueued_at < NOW() - INTERVAL '1 hour'
			LIMIT 50
		`)) as Record<string, unknown>[];

		result.enqueuedWithoutJob = enqueued.length;

		// ─── Check 3: Outbox PUBLISHED but execution still PENDING ──────
		const publishedPending = (await this.db.execute(sql`
			SELECT o.id, o.job_execution_id
			FROM job_outbox o
			JOIN job_executions e ON e.id = o.job_execution_id
			WHERE o.status = 'PUBLISHED'
				AND e.status = 'PENDING'::job_execution_status
			LIMIT 50
		`)) as Record<string, unknown>[];

		result.outboxPublishedPendingExecution = publishedPending.length;

		if (publishedPending.length > 0) {
			await this.failureProbe.hit("reconciliation.after-detect", {
				component: "reconciliation-sweep",
				divergenceType: "PUBLISHED_EXECUTION_PENDING",
			});
		}

		// Fix: downgrade outbox back to PENDING to trigger re-enqueue
		for (const row of publishedPending) {
			const id = (row as Record<string, unknown>).id as string;

			await this.failureProbe.hit("reconciliation.before-repair", {
				component: "reconciliation-sweep",
				outboxId: id,
				divergenceType: "PUBLISHED_EXECUTION_PENDING",
				repairType: "downgrade-outbox",
			});

			await this.db.execute(sql`
				UPDATE job_outbox
				SET status = 'PENDING',
					published_at = NULL,
					available_at = NOW()
				WHERE id = ${id}::uuid
			`);

			await this.failureProbe.hit("reconciliation.after-repair", {
				component: "reconciliation-sweep",
				outboxId: id,
				divergenceType: "PUBLISHED_EXECUTION_PENDING",
				repairType: "downgrade-outbox",
			});
			this.emitRepair("PUBLISHED_EXECUTION_PENDING", "downgrade-outbox");
		}

		// ─── Check 4: Stale CLAIMED outbox events (relay crashed) ──────
		const staleClaims = (await this.db.execute(sql`
			UPDATE job_outbox
			SET status = 'PENDING',
				relay_token = NULL,
				claimed_at = NULL,
				claim_expires_at = NULL,
				last_error = 'RECONCILED: claim expired',
				available_at = NOW()
			WHERE status = 'CLAIMED'
				AND claim_expires_at < NOW()
			RETURNING id
		`)) as Record<string, unknown>[];

		result.pendingOutboxRepublished = staleClaims.length;

		// Probes for stale claim repair (inline UPDATE — repair already done)
		if (staleClaims.length > 0) {
			await this.failureProbe.hit("reconciliation.after-detect", {
				component: "reconciliation-sweep",
				divergenceType: "STALE_OUTBOX_CLAIM",
			});
			for (const row of staleClaims) {
				await this.failureProbe.hit("reconciliation.after-repair", {
					component: "reconciliation-sweep",
					outboxId: row.id as string,
					divergenceType: "STALE_OUTBOX_CLAIM",
					repairType: "release-claim",
				});
				this.emitRepair("STALE_OUTBOX_CLAIM", "release-claim");
			}
		}

		return result;
	}

	private emitRepair(
		divergenceType: string,
		repairType: string,
		executionId?: string,
	): void {
		safeCall(() => this.metrics.reconciliationRepair({ repairType }));
		safeCall(() =>
			this.logger.info("job.reconciliation.repaired", {
				divergenceType,
				repairType,
				...(executionId ? { executionId } : {}),
			}),
		);
	}
}
