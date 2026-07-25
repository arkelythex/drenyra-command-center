/**
 * Job Recovery — W2-06C
 *
 * Periodically recovers stale RUNNING executions with expired leases.
 *
 * Recovery rules by policy:
 *   PERMANENT/PERMANENT_BY_INPUT/WINDOWED/ACTIVE_ONLY → FAILED RETRYABLE
 *   REPLACEABLE → only if generation is still current
 *   SUPERSEDED/CANCELLED/FAILED TERMINAL → never recover
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

export interface RecoveryResult {
	recovered: number;
}

export interface RecoverySweepDependencies {
	failureProbe?: FailureProbe;
	metrics?: JobExecutionMetrics;
	logger?: StructuredLogger;
}

// ─── RecoverySweep ───────────────────────────────────────────────────────────

export class RecoverySweep {
	private readonly db: PostgresJsDatabase;
	private readonly batchSize: number;
	private readonly failureProbe: FailureProbe;
	private readonly metrics: JobExecutionMetrics;
	private readonly logger: StructuredLogger;

	constructor(
		db: PostgresJsDatabase,
		batchSize?: number,
		deps?: RecoverySweepDependencies,
	) {
		this.db = db;
		this.batchSize = batchSize ?? 50;
		this.failureProbe = deps?.failureProbe ?? new NoopFailureProbe();
		this.metrics = deps?.metrics ?? new NoopJobExecutionMetrics();
		this.logger = deps?.logger ?? new NoopLogger();
	}

	/**
	 * Run one recovery cycle. Finds ALL expired RUNNING executions
	 * and marks them as FAILED RETRYABLE (or checks REPLACEABLE).
	 */
	async runCycle(): Promise<RecoveryResult> {
		await this.failureProbe.hit("recovery.before-claim");

		// Step 1: Find expired RUNNING executions (non-REPLACEABLE)
		const expired = (await this.db.execute(sql`
			SELECT id, generation, uniqueness_policy
			FROM job_executions
			WHERE status = 'RUNNING'::job_execution_status
				AND lease_expires_at < NOW()
				AND uniqueness_policy != 'REPLACEABLE'::job_uniqueness_policy
			ORDER BY lease_expires_at ASC
			LIMIT ${this.batchSize}
			FOR UPDATE SKIP LOCKED
		`)) as Record<string, unknown>[];

		if (expired.length > 0 && expired[0]) {
			const first = expired[0];
			await this.failureProbe.hit("recovery.after-claim", {
				component: "recovery-sweep",
				executionId: first.id as string,
				generation: first.generation as number,
			});
		}

		// Step 2: Mark as FAILED RETRYABLE (lease expired)
		for (const row of expired) {
			await this.failureProbe.hit("recovery.before-transition", {
				component: "recovery-sweep",
				executionId: row.id as string,
				generation: row.generation as number,
			});
			await this.markExpired(row.id as string);
			await this.failureProbe.hit("recovery.after-transition", {
				component: "recovery-sweep",
				executionId: row.id as string,
			});
			this.emitRecovery(row);
		}

		// Step 3: Find REPLACEABLE with expired lease and current generation
		const replaceable = (await this.db.execute(sql`
			WITH current_gen AS (
				SELECT logical_key, queue_name, job_type, organization_id, company_id,
					MAX(generation) as max_gen
				FROM job_executions
				WHERE status NOT IN ('SUPERSEDED'::job_execution_status, 'CANCELLED'::job_execution_status)
				GROUP BY logical_key, queue_name, job_type, organization_id, company_id
			)
			SELECT e.id, e.generation
			FROM job_executions e
			JOIN current_gen cg ON e.logical_key = cg.logical_key
				AND e.queue_name = cg.queue_name
				AND e.job_type = cg.job_type
				AND e.organization_id = cg.organization_id
				AND (e.company_id IS NOT DISTINCT FROM cg.company_id)
			WHERE e.status = 'RUNNING'::job_execution_status
				AND e.lease_expires_at < NOW()
				AND e.uniqueness_policy = 'REPLACEABLE'::job_uniqueness_policy
				AND e.generation = cg.max_gen
			ORDER BY e.lease_expires_at ASC
			LIMIT ${this.batchSize}
			FOR UPDATE SKIP LOCKED
		`)) as Record<string, unknown>[];

		for (const row of replaceable) {
			await this.failureProbe.hit("recovery.before-transition", {
				component: "recovery-sweep",
				executionId: row.id as string,
				generation: row.generation as number,
			});
			await this.markExpired(row.id as string);
			await this.failureProbe.hit("recovery.after-transition", {
				component: "recovery-sweep",
				executionId: row.id as string,
			});
		}

		return { recovered: expired.length + replaceable.length };
	}

	/**
	 * Find and mark a specific execution as FAILED RETRYABLE.
	 * Only marks RUNNING with expired lease.
	 */
	async recoverExecution(executionId: string): Promise<boolean> {
		const result = await this.db.execute(sql`
			UPDATE job_executions
			SET status = 'FAILED'::job_execution_status,
				failure_class = 'RETRYABLE'::job_failure_class,
				failure_code = 'LEASE_EXPIRED',
				attempt_count = attempt_count + 1,
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL,
				failed_at = NOW(),
				updated_at = NOW()
			WHERE id = ${executionId}::uuid
				AND status = 'RUNNING'::job_execution_status
				AND lease_expires_at < NOW()
			RETURNING id
		`);

		return result.length === 1;
	}

	private emitRecovery(row: Record<string, unknown>): void {
		const qn = row.queue_name as string | undefined;
		const jt = row.job_type as string | undefined;
		safeCall(() =>
			this.metrics.recoveryPerformed({
				...(qn !== undefined ? { queueName: qn } : {}),
				...(jt !== undefined ? { jobType: jt } : {}),
			}),
		);
		safeCall(() =>
			this.logger.info("job.recovery.performed", {
				executionId: row.id as string,
				generation: row.generation as number,
			}),
		);
	}

	private async markExpired(executionId: string): Promise<void> {
		await this.db.execute(markExpiredSql(executionId));
	}
}

function markExpiredSql(executionId: string) {
	return sql`
		UPDATE job_executions
		SET status = 'FAILED'::job_execution_status,
			failure_class = 'RETRYABLE'::job_failure_class,
			failure_code = 'LEASE_EXPIRED',
			attempt_count = attempt_count + 1,
			execution_token = NULL,
			lease_started_at = NULL,
			lease_expires_at = NULL,
			failed_at = NOW(),
			updated_at = NOW()
		WHERE id = ${executionId}::uuid
			AND status = 'RUNNING'::job_execution_status
		RETURNING id
	`;
}
