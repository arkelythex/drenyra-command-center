/**
 * PostgresJobExecutionRepository (W2-06B).
 *
 * PostgreSQL implementation of JobExecutionRepository.
 *
 * All mutations are idempotent and safe for concurrent access through
 * PostgreSQL's unique partial indexes and row-level locking.
 */

import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type {
	AcquireLeaseInput,
	AcquireLeaseResult,
	CancelInput,
	CompleteInput,
	CompleteResult,
	CreateJobInput,
	CreateJobResult,
	FailInput,
	FailResult,
	JobExecution,
	JobExecutionRepository,
	ReplaceInput,
	ReplaceResult,
} from "./job-execution.types";

// ─── Error codes ─────────────────────────────────────────────────────────────

const PG_UNIQUE_VIOLATION = "23505";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToExecution(row: Record<string, unknown>): JobExecution {
	return {
		...rowIdentityFields(row),
		...rowOwnershipFields(row),
		...rowUnknownFields(row),
		id: row.id as string,
		status: row.status as JobExecution["status"],
		failureClass: (row.failure_class as JobExecution["failureClass"]) ?? null,
		failureCode: (row.failure_code as string) ?? null,
		attemptCount: Number(row.attempt_count),
		bullmqJobId: (row.bullmq_job_id as string) ?? null,
		outboxEventId: (row.outbox_event_id as string) ?? null,
		supersededById: (row.superseded_by_id as string) ?? null,
		inputHash: row.input_hash as string,
		createdAt: row.created_at as Date,
	};
}

function rowIdentityFields(
	row: Record<string, unknown>,
): Pick<
	JobExecution,
	| "organizationId"
	| "companyId"
	| "queueName"
	| "jobType"
	| "logicalKey"
	| "executionWindow"
	| "uniquenessPolicy"
	| "generation"
> {
	return {
		organizationId: row.organization_id as string,
		companyId: (row.company_id as string) ?? null,
		queueName: row.queue_name as string,
		jobType: row.job_type as string,
		logicalKey: row.logical_key as string,
		executionWindow: (row.execution_window as string) ?? null,
		uniquenessPolicy: row.uniqueness_policy as JobExecution["uniquenessPolicy"],
		generation: Number(row.generation),
	};
}

function rowOwnershipFields(
	row: Record<string, unknown>,
): Pick<JobExecution, "executionToken" | "leaseExpiresAt"> {
	return {
		executionToken: (row.execution_token as string) ?? null,
		leaseExpiresAt: (row.lease_expires_at as Date) ?? null,
	};
}

function rowUnknownFields(
	row: Record<string, unknown>,
): Pick<
	JobExecution,
	| "unknownSince"
	| "unknownReason"
	| "externalOperationId"
	| "reconciliationAttemptCount"
	| "lastReconciledAt"
	| "nextReconciliationAt"
	| "resolvedAt"
> {
	return {
		unknownSince: (row.unknown_since as Date) ?? null,
		unknownReason: (row.unknown_reason as string) ?? null,
		externalOperationId: (row.external_operation_id as string) ?? null,
		reconciliationAttemptCount: Number(row.reconciliation_attempt_count ?? 0),
		lastReconciledAt: (row.last_reconciled_at as Date) ?? null,
		nextReconciliationAt: (row.next_reconciliation_at as Date) ?? null,
		resolvedAt: (row.resolved_at as Date) ?? null,
	};
}

/**
 * Build SQL literal for company_id: either 'uuid_value' or NULL.
 */
// ─── Repository implementation ───────────────────────────────────────────────

export class PostgresJobExecutionRepository implements JobExecutionRepository {
	// ─── createOrResolve ───────────────────────────────────────────────

	async createOrResolve(
		tx: PostgresJsDatabase,
		input: CreateJobInput,
	): Promise<CreateJobResult> {
		// Step 1: Pre-check for existing execution.
		// For ACTIVE_ONLY, this catches COMPLETED/FAILED before any INSERT attempt.
		const existing = await this.findByLogicalKey(tx, input);

		if (existing) {
			const policyResult = this.routeByPolicy(existing, input);
			if (policyResult.kind !== "retry-insert") {
				return policyResult;
			}
		}

		// Step 2: Try INSERT (wrapped in SAVEPOINT for safe recovery).
		await tx.execute(sql`SAVEPOINT job_create`);

		try {
			const [row] = await tx.execute(buildInsertSql(input));

			if (row) {
				await tx.execute(
					buildOutboxInsertSql(
						(row as Record<string, unknown>).id as string,
						input,
					),
				);
				await tx.execute(sql`RELEASE SAVEPOINT job_create`);

				return {
					kind: "created",
					execution: rowToExecution(row as Record<string, unknown>),
				};
			}

			await tx.execute(sql`RELEASE SAVEPOINT job_create`);
			return {
				kind: "already-active",
				execution: null as unknown as JobExecution,
			};
		} catch (err: unknown) {
			await tx.execute(sql`ROLLBACK TO SAVEPOINT job_create`).catch(() => {});
			if (isPgError(err, PG_UNIQUE_VIOLATION)) {
				if (!existing) {
					const e2 = await this.findByLogicalKey(tx, input);
					if (e2) {
						return this.routeByPolicy(e2, input);
					}
				}
				return {
					kind: "already-active",
					execution: null as unknown as JobExecution,
				};
			}
			throw err;
		}
	}

	private async findByLogicalKey(
		tx: PostgresJsDatabase,
		input: CreateJobInput,
	): Promise<JobExecution | null> {
		const [row] = await tx.execute(buildFindByKeySql(input));
		return row ? rowToExecution(row as Record<string, unknown>) : null;
	}

	private routeByPolicy(
		execution: JobExecution,
		input: CreateJobInput,
	): CreateJobResult | { kind: "retry-insert" } {
		switch (execution.uniquenessPolicy) {
			case "PERMANENT":
			case "PERMANENT_BY_INPUT":
				return this.resolvePermanent(execution, input);
			case "ACTIVE_ONLY":
				return this.resolveActiveOnly(execution);
			case "WINDOWED":
				return this.resolveWindowed(execution);
			case "REPLACEABLE":
				return this.resolveReplaceable(execution);
			default:
				return { kind: "already-active", execution };
		}
	}

	private resolvePermanent(
		execution: JobExecution,
		input: CreateJobInput,
	): CreateJobResult {
		if (execution.status === "SUPERSEDED") {
			return { kind: "already-final", execution };
		}

		if (
			execution.uniquenessPolicy === "PERMANENT_BY_INPUT" &&
			execution.inputHash !== input.inputHash
		) {
			return { kind: "already-final", execution };
		}

		if (
			execution.status === "COMPLETED" ||
			(execution.status === "FAILED" && execution.failureClass === "TERMINAL")
		) {
			return { kind: "already-final", execution };
		}

		return { kind: "already-active", execution };
	}

	private resolveActiveOnly(execution: JobExecution): CreateJobResult {
		if (
			execution.status === "COMPLETED" ||
			execution.status === "FAILED" ||
			execution.status === "CANCELLED"
		) {
			return { kind: "already-final", execution };
		}

		return { kind: "already-active", execution };
	}

	private resolveWindowed(execution: JobExecution): CreateJobResult {
		if (
			execution.status === "COMPLETED" ||
			(execution.status === "FAILED" && execution.failureClass === "TERMINAL")
		) {
			return { kind: "already-final", execution };
		}

		return { kind: "already-active", execution };
	}

	private resolveReplaceable(execution: JobExecution): CreateJobResult {
		if (execution.status === "SUPERSEDED" || execution.status === "CANCELLED") {
			return { kind: "already-final", execution };
		}

		return { kind: "already-active", execution };
	}

	// ─── markEnqueued ─────────────────────────────────────────────────

	async markEnqueued(
		tx: PostgresJsDatabase,
		executionId: string,
		bullmqJobId: string,
	): Promise<void> {
		await tx.execute(sql`
			UPDATE job_executions
			SET status = 'ENQUEUED'::job_execution_status,
				bullmq_job_id = ${bullmqJobId},
				enqueued_at = NOW(),
				updated_at = NOW()
			WHERE id = ${executionId}::uuid
				AND status = 'PENDING'::job_execution_status
		`);
	}

	// ─── acquireLease ─────────────────────────────────────────────────

	async acquireLease(
		tx: PostgresJsDatabase,
		input: AcquireLeaseInput,
	): Promise<AcquireLeaseResult> {
		const leaseInterval = input.leaseDurationMs;
		const result = await tx.execute(sql`
			UPDATE job_executions
			SET status = 'RUNNING'::job_execution_status,
				execution_token = ${input.executionToken}::uuid,
				lease_started_at = NOW(),
				lease_expires_at = NOW() + ${leaseInterval} * interval '1 millisecond',
				started_at = COALESCE(started_at, NOW()),
				updated_at = NOW()
			WHERE id = ${input.executionId}::uuid
				AND status IN ('PENDING'::job_execution_status, 'ENQUEUED'::job_execution_status)
				AND generation = ${input.expectedGeneration}
			RETURNING id, execution_token, lease_expires_at, status, generation
		`);

		if (result.length === 1) {
			return { kind: "acquired" };
		}

		return this.checkAcquireFailure(tx, input);
	}

	private async checkAcquireFailure(
		tx: PostgresJsDatabase,
		input: AcquireLeaseInput,
	): Promise<AcquireLeaseResult> {
		const [current] = await tx.execute(sql`
			SELECT status, generation, lease_expires_at FROM job_executions
			WHERE id = ${input.executionId}::uuid
		`);

		if (!current) {
			return { kind: "invalid-state", status: "COMPLETED" as const };
		}

		const row = current as Record<string, unknown>;

		if (Number(row.generation) !== input.expectedGeneration) {
			return {
				kind: "wrong-generation",
				expectedGeneration: input.expectedGeneration,
				actualGeneration: Number(row.generation),
			};
		}

		if (row.status === "RUNNING") {
			return {
				kind: "already-running",
				leaseExpiresAt: row.lease_expires_at as Date,
			};
		}

		return {
			kind: "invalid-state",
			status: row.status as AcquireLeaseResult extends {
				kind: "invalid-state";
			}
				? string
				: never,
		};
	}

	// ─── complete ─────────────────────────────────────────────────────

	async complete(
		tx: PostgresJsDatabase,
		input: CompleteInput,
	): Promise<CompleteResult> {
		const result = await tx.execute(sql`
			UPDATE job_executions
			SET status = 'COMPLETED'::job_execution_status,
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL,
				completed_at = NOW(),
				result_metadata = ${input.resultMetadata ? sql`${JSON.stringify(input.resultMetadata)}::jsonb` : sql`NULL`},
				updated_at = NOW()
			WHERE id = ${input.executionId}::uuid
				AND status = 'RUNNING'::job_execution_status
				AND execution_token = ${input.executionToken}::uuid
				AND generation = ${input.expectedGeneration}
			RETURNING id
		`);

		if (result.length === 1) {
			return { kind: "completed" };
		}

		return this.checkFencingFailure(
			tx,
			input.executionId,
			input.expectedGeneration,
		);
	}

	// ─── fail ──────────────────────────────────────────────────────────

	async fail(tx: PostgresJsDatabase, input: FailInput): Promise<FailResult> {
		const failureClass = input.retryable === false ? "TERMINAL" : "RETRYABLE";

		const result = await tx.execute(sql`
			UPDATE job_executions
			SET status = 'FAILED'::job_execution_status,
				failure_class = ${failureClass}::job_failure_class,
				failure_code = ${input.failureCode},
				attempt_count = attempt_count + 1,
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL,
				failed_at = NOW(),
				updated_at = NOW()
			WHERE id = ${input.executionId}::uuid
				AND status = 'RUNNING'::job_execution_status
				AND execution_token = ${input.executionToken}::uuid
				AND generation = ${input.expectedGeneration}
			RETURNING id
		`);

		if (result.length === 1) {
			return { kind: "failed" };
		}

		return this.checkFencingFailure(
			tx,
			input.executionId,
			input.expectedGeneration,
		);
	}

	// ─── cancel ────────────────────────────────────────────────────────

	async cancel(tx: PostgresJsDatabase, input: CancelInput): Promise<void> {
		await tx.execute(sql`
			UPDATE job_executions
			SET status = 'CANCELLED'::job_execution_status,
				cancelled_at = NOW(),
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL,
				updated_at = NOW()
			WHERE id = ${input.executionId}::uuid
				AND status IN ('PENDING'::job_execution_status, 'ENQUEUED'::job_execution_status, 'RUNNING'::job_execution_status)
		`);
	}

	// ─── replace ───────────────────────────────────────────────────────

	async replace(
		tx: PostgresJsDatabase,
		input: ReplaceInput,
	): Promise<ReplaceResult> {
		const [current] = await tx.execute(sql`
			SELECT * FROM job_executions WHERE id = ${input.previousExecutionId}::uuid
		`);

		if (!current) {
			return { kind: "fencing-rejected" };
		}

		const currentRow = current as Record<string, unknown>;
		const currentGen = Number(currentRow.generation);

		if (
			currentRow.status === "RUNNING" &&
			currentRow.execution_token !== input.previousExecutionToken
		) {
			return { kind: "fencing-rejected" };
		}

		// Step 1: Pre-generate new execution ID.
		const newId = input.newExecutionId || randomUUID();

		// Step 2: INSERT new execution FIRST so the FK from the old row
		// (superseded_by_id -> job_executions.id) has a valid target.
		const [newRow] = await tx.execute(
			buildReplaceInsertSqlWithId(input.newInput, currentGen + 1, newId),
		);

		if (!newRow) {
			throw new Error("Replace: failed to insert new execution");
		}
		const newRowId = (newRow as Record<string, unknown>).id as string;

		// Step 3: Mark old execution as SUPERSEDED pointing to the new row.
		const superseded = await tx.execute(sql`
			UPDATE job_executions
			SET status = 'SUPERSEDED'::job_execution_status,
				superseded_by_id = ${newRowId}::uuid,
				cancel_requested_at = NOW(),
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL,
				updated_at = NOW()
			WHERE id = ${input.previousExecutionId}::uuid
			RETURNING id
		`);

		if (superseded.length !== 1) {
			// New row was inserted but old row couldn't be superseded.
			// This is an invariant violation — the old row should always be
			// in a supersedable state since we validated it exists and is
			// either RUNNING (with matching token) or a terminal state.
			throw new Error("Replace: failed to supersede previous execution");
		}

		// Step 4: Outbox for new execution.
		await tx.execute(buildOutboxInsertSql(newRowId, input.newInput));

		return {
			kind: "replaced",
			newExecution: rowToExecution(newRow as Record<string, unknown>),
		};
	}

	// ─── findById ──────────────────────────────────────────────────────

	async findById(
		tx: PostgresJsDatabase,
		id: string,
	): Promise<JobExecution | null> {
		const [row] = await tx.execute(sql`
			SELECT * FROM job_executions WHERE id = ${id}::uuid
		`);
		return row ? rowToExecution(row as Record<string, unknown>) : null;
	}

	// ─── UNKNOWN state operations ───────────────────────────────────────

	async markUnknown(
		tx: PostgresJsDatabase,
		input: MarkUnknownInput,
	): Promise<MarkUnknownResult> {
		const result = await tx.execute(sql`
			UPDATE job_executions
			SET status = 'UNKNOWN'::job_execution_status,
				unknown_since = NOW(),
				unknown_reason = ${input.unknownReason},
				external_operation_id = ${input.externalOperationId ?? null},
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL,
				updated_at = NOW()
			WHERE id = ${input.executionId}::uuid
				AND status = 'RUNNING'::job_execution_status
				AND execution_token = ${input.executionToken}::uuid
				AND generation = ${input.expectedGeneration}
			RETURNING id
		`);

		if (result.length === 1) {
			return { kind: "marked-unknown" };
		}

		return this.checkFencingFailure(
			tx,
			input.executionId,
			input.expectedGeneration,
		) as Promise<MarkUnknownResult>;
	}

	async resolveUnknownAsCompleted(
		tx: PostgresJsDatabase,
		input: ResolveUnknownInput & { resultMetadata?: unknown },
	): Promise<ResolveUnknownResult> {
		return this.resolveUnknown(tx, {
			...input,
			targetStatus: "COMPLETED" as const,
			setFailureFields: false,
		});
	}

	async resolveUnknownAsRetryable(
		tx: PostgresJsDatabase,
		input: ResolveUnknownInput & { failureCode: string },
	): Promise<ResolveUnknownResult> {
		return this.resolveUnknown(tx, {
			...input,
			targetStatus: "FAILED" as const,
			setFailureFields: true,
			failureClass: "RETRYABLE" as const,
			failureCode: input.failureCode,
		});
	}

	async resolveUnknownAsTerminal(
		tx: PostgresJsDatabase,
		input: ResolveUnknownInput & { failureCode: string },
	): Promise<ResolveUnknownResult> {
		return this.resolveUnknown(tx, {
			...input,
			targetStatus: "FAILED" as const,
			setFailureFields: true,
			failureClass: "TERMINAL" as const,
			failureCode: input.failureCode,
		});
	}

	private async resolveUnknown(
		tx: PostgresJsDatabase,
		input: ResolveUnknownInput & {
			targetStatus: "COMPLETED" | "FAILED";
			setFailureFields: boolean;
			failureClass?: "RETRYABLE" | "TERMINAL";
			failureCode?: string;
			resultMetadata?: unknown;
		},
	): Promise<ResolveUnknownResult> {
		const attemptCount = sql`reconciliation_attempt_count + 1`;
		const resolvedAt = sql`NOW()`;

		if (input.targetStatus === "COMPLETED") {
			const result = await tx.execute(sql`
				UPDATE job_executions
				SET status = 'COMPLETED'::job_execution_status,
					completed_at = COALESCE(completed_at, NOW()),
					resolved_at = ${resolvedAt},
					reconciliation_attempt_count = ${attemptCount},
					last_reconciled_at = NOW(),
					next_reconciliation_at = ${input.nextReconciliationAt ?? null},
					result_metadata = ${input.resultMetadata ? sql`${JSON.stringify(input.resultMetadata)}::jsonb` : sql`result_metadata`},
					updated_at = NOW()
				WHERE id = ${input.executionId}::uuid
					AND status = 'UNKNOWN'::job_execution_status
					AND generation = ${input.generation}
				RETURNING id
			`);
			return result.length === 1
				? { kind: "resolved" }
				: this.checkResolveFailure(tx, input.executionId, input.generation);
		}

		// FAILED resolution
		const fc = input.failureClass ?? "RETRYABLE";
		const result = await tx.execute(sql`
			UPDATE job_executions
			SET status = 'FAILED'::job_execution_status,
				failure_class = ${fc}::job_failure_class,
				failure_code = ${input.failureCode},
				failed_at = NOW(),
				resolved_at = ${resolvedAt},
				reconciliation_attempt_count = ${attemptCount},
				last_reconciled_at = NOW(),
				next_reconciliation_at = ${input.nextReconciliationAt ?? null},
				updated_at = NOW()
			WHERE id = ${input.executionId}::uuid
				AND status = 'UNKNOWN'::job_execution_status
				AND generation = ${input.generation}
			RETURNING id
		`);

		return result.length === 1
			? { kind: "resolved" }
			: this.checkResolveFailure(tx, input.executionId, input.generation);
	}

	private async checkResolveFailure(
		tx: PostgresJsDatabase,
		executionId: string,
		expectedGeneration: number,
	): Promise<ResolveUnknownResult> {
		const [current] = await tx.execute(sql`
			SELECT status, generation FROM job_executions WHERE id = ${executionId}::uuid
		`);

		if (!current) {
			return { kind: "not-unknown" };
		}

		const row = current as Record<string, unknown>;
		if (Number(row.generation) !== expectedGeneration) {
			return { kind: "wrong-generation" };
		}

		if (row.status !== "UNKNOWN") {
			return { kind: "not-unknown" };
		}

		// Same generation, still UNKNOWN — fencing-rejected (another reconciler won)
		return { kind: "not-unknown" };
	}

	// ─── Helpers ───────────────────────────────────────────────────────

	private async checkFencingFailure(
		tx: PostgresJsDatabase,
		executionId: string,
		expectedGeneration: number,
	): Promise<{ kind: "fencing-rejected" } | { kind: "wrong-generation" }> {
		const [current] = await tx.execute(sql`
			SELECT status, generation FROM job_executions WHERE id = ${executionId}::uuid
		`);

		if (!current) {
			return { kind: "fencing-rejected" };
		}

		const row = current as Record<string, unknown>;
		if (Number(row.generation) !== expectedGeneration) {
			return { kind: "wrong-generation" };
		}

		return { kind: "fencing-rejected" };
	}
}

// ════════════════════════════════════════════════════════════════════════════
// SQL builders (extracted to avoid nested template literal issues)
// ════════════════════════════════════════════════════════════════════════════

function buildInsertSql(input: CreateJobInput) {
	const companyId = input.companyId ? sql`${input.companyId}::uuid` : sql`NULL`;
	const windowValue = input.executionWindow ?? null;

	return sql`
		INSERT INTO job_executions (
			organization_id, company_id,
			queue_name, job_type, logical_key, execution_window,
			uniqueness_policy, generation, status,
			input_hash
		) VALUES (
			${input.organizationId}::uuid,
			${companyId},
			${input.queueName},
			${input.jobType},
			${input.logicalKey},
			${windowValue},
			${input.uniquenessPolicy}::job_uniqueness_policy,
			1,
			'PENDING'::job_execution_status,
			${input.inputHash}
		)
		RETURNING *
	`;
}

function buildReplaceInsertSqlWithId(
	input: CreateJobInput,
	generation: number,
	id: string,
) {
	const companyId = input.companyId ? sql`${input.companyId}::uuid` : sql`NULL`;
	const windowValue = input.executionWindow ?? null;

	return sql`
		INSERT INTO job_executions (
			id, organization_id, company_id,
			queue_name, job_type, logical_key, execution_window,
			uniqueness_policy, generation, status,
			input_hash
		) VALUES (
			${id}::uuid,
			${input.organizationId}::uuid,
			${companyId},
			${input.queueName},
			${input.jobType},
			${input.logicalKey},
			${windowValue},
			${input.uniquenessPolicy}::job_uniqueness_policy,
			${generation},
			'PENDING'::job_execution_status,
			${input.inputHash}
		)
		RETURNING *
	`;
}

function buildOutboxInsertSql(executionId: string, input: CreateJobInput) {
	return sql`
		INSERT INTO job_outbox (job_execution_id, action, queue_name, job_type, payload)
		VALUES (
			${executionId}::uuid,
			'ENQUEUE',
			${input.queueName},
			${input.jobType},
			${JSON.stringify(input.payload)}::jsonb
		)
	`;
}

function buildFindByKeySql(input: CreateJobInput) {
	const companyId = input.companyId
		? sql`company_id = ${input.companyId}::uuid`
		: sql`company_id IS NULL`;
	const windowCondition = input.executionWindow
		? sql`execution_window = ${input.executionWindow}`
		: sql`execution_window IS NULL`;

	return sql`
		SELECT * FROM job_executions
		WHERE queue_name = ${input.queueName}
			AND job_type = ${input.jobType}
			AND logical_key = ${input.logicalKey}
			AND organization_id = ${input.organizationId}::uuid
			AND ${companyId}
			AND ${windowCondition}
		ORDER BY created_at DESC
		LIMIT 1
	`;
}

/**
 * Check if an error is a Drizzle-wrapped PostgresError with the given code.
 */
function isPgError(err: unknown, code: string): boolean {
	return (
		err !== null &&
		typeof err === "object" &&
		"cause" in err &&
		err.cause !== null &&
		typeof err.cause === "object" &&
		"code" in err.cause &&
		(err.cause as { code: string }).code === code
	);
}
