/**
 * Job Execution Repository Types (W2-06B).
 *
 * Defines the input/output contracts for the Job Uniqueness Registry.
 */

import type { DbTransaction } from "../unit-of-work";

// ─── Enums (mirrors schema types without import dependency) ──────────────────

export type JobUniquenessPolicy =
	| "PERMANENT"
	| "PERMANENT_BY_INPUT"
	| "ACTIVE_ONLY"
	| "WINDOWED"
	| "REPLACEABLE";

export type JobExecutionStatus =
	| "PENDING"
	| "ENQUEUED"
	| "RUNNING"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED"
	| "SUPERSEDED"
	| "UNKNOWN";

export type JobFailureClass = "RETRYABLE" | "TERMINAL";

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateJobInput {
	organizationId: string;
	companyId?: string | null;
	queueName: string;
	jobType: string;
	logicalKey: string;
	executionWindow?: string | null;
	uniquenessPolicy: JobUniquenessPolicy;
	payload: unknown;
	inputHash: string;
}

export interface AcquireLeaseInput {
	executionId: string;
	executionToken: string;
	leaseDurationMs: number;
	expectedGeneration: number;
}

export interface CompleteInput {
	executionId: string;
	executionToken: string;
	expectedGeneration: number;
	resultMetadata?: unknown;
}

export interface FailInput {
	executionId: string;
	executionToken: string;
	expectedGeneration: number;
	failureClass: JobFailureClass;
	failureCode: string;
	retryable?: boolean;
}

export interface CancelInput {
	executionId: string;
	executionToken?: string;
}

// ─── UNKNOWN state input types ─────────────────────────────────

export interface MarkUnknownInput {
	executionId: string;
	executionToken: string;
	expectedGeneration: number;
	unknownReason: string;
	externalOperationId?: string;
}

export interface ResolveUnknownInput {
	executionId: string;
	generation: number;
	externalOperationId?: string;
	lastReconciledAt?: Date;
	nextReconciliationAt?: Date;
}

export type MarkUnknownResult =
	| { kind: "marked-unknown" }
	| { kind: "fencing-rejected" }
	| { kind: "wrong-generation" };

export type ResolveUnknownResult =
	| { kind: "resolved" }
	| { kind: "wrong-generation" }
	| { kind: "not-unknown" };

export interface ReplaceInput {
	previousExecutionId: string;
	previousExecutionToken: string;
	newExecutionId: string;
	newInput: CreateJobInput;
}

// ─── Output types ────────────────────────────────────────────────────────────

export interface JobExecution {
	id: string;
	organizationId: string;
	companyId: string | null;
	queueName: string;
	jobType: string;
	logicalKey: string;
	executionWindow: string | null;
	uniquenessPolicy: JobUniquenessPolicy;
	generation: number;
	status: JobExecutionStatus;
	failureClass: JobFailureClass | null;
	failureCode: string | null;
	attemptCount: number;
	executionToken: string | null;
	leaseExpiresAt: Date | null;
	bullmqJobId: string | null;
	unknownSince: Date | null;
	unknownReason: string | null;
	externalOperationId: string | null;
	reconciliationAttemptCount: number;
	lastReconciledAt: Date | null;
	nextReconciliationAt: Date | null;
	resolvedAt: Date | null;
	outboxEventId: string | null;
	supersededById: string | null;
	inputHash: string;
	createdAt: Date;
}

export type CreateJobResult =
	| { kind: "created"; execution: JobExecution }
	| { kind: "already-active"; execution: JobExecution }
	| { kind: "already-final"; execution: JobExecution }
	| { kind: "input-conflict"; execution: JobExecution };

export type AcquireLeaseResult =
	| { kind: "acquired" }
	| { kind: "already-running"; leaseExpiresAt: Date }
	| {
			kind: "wrong-generation";
			expectedGeneration: number;
			actualGeneration: number;
	  }
	| { kind: "invalid-state"; status: JobExecutionStatus };

export type CompleteResult =
	| { kind: "completed" }
	| { kind: "fencing-rejected" }
	| { kind: "wrong-generation" };

export type FailResult =
	| { kind: "failed" }
	| { kind: "fencing-rejected" }
	| { kind: "wrong-generation" };

export type ReplaceResult =
	| { kind: "replaced"; newExecution: JobExecution }
	| { kind: "fencing-rejected" };

// ─── Outbox input ────────────────────────────────────────────────────────────

export interface OutboxEvent {
	id: string;
	jobExecutionId: string;
	action: string;
	queueName: string;
	jobType: string;
	payload: unknown;
}

// ─── Repository interface ────────────────────────────────────────────────────

export interface JobExecutionRepository {
	/**
	 * Create a new job execution or resolve an existing one based on policy.
	 * Inserts job_execution + outbox_event in the same transaction.
	 */
	createOrResolve(
		tx: DbTransaction,
		input: CreateJobInput,
	): Promise<CreateJobResult>;

	/**
	 * Mark a PENDING execution as ENQUEUED (called by outbox relay).
	 */
	markEnqueued(
		tx: DbTransaction,
		executionId: string,
		bullmqJobId: string,
	): Promise<void>;

	/**
	 * Acquire lease for a PENDING/ENQUEUED execution.
	 * Sets status to RUNNING with execution_token + lease.
	 */
	acquireLease(
		tx: DbTransaction,
		input: AcquireLeaseInput,
	): Promise<AcquireLeaseResult>;

	/**
	 * Mark as COMPLETED with fencing token and generation check.
	 */
	complete(tx: DbTransaction, input: CompleteInput): Promise<CompleteResult>;

	/**
	 * Mark as FAILED with fencing token and generation check.
	 */
	fail(tx: DbTransaction, input: FailInput): Promise<FailResult>;

	/**
	 * Cancel an execution (for REPLACEABLE supersession or manual cancel).
	 */
	cancel(tx: DbTransaction, input: CancelInput): Promise<void>;

	/**
	 * REPLACEABLE supersession: creates new generation, marks old as SUPERSEDED.
	 * All in one transaction.
	 */
	replace(tx: DbTransaction, input: ReplaceInput): Promise<ReplaceResult>;

	/**
	 * Find execution by id (for recovery/verification).
	 */
	findById(tx: DbTransaction, id: string): Promise<JobExecution | null>;

	// ─── UNKNOWN state operations ───────────────────────────────

	/**
	 * Mark a RUNNING execution as UNKNOWN.
	 * Clears execution_token and lease. Requires fencing.
	 */
	markUnknown(
		tx: DbTransaction,
		input: MarkUnknownInput,
	): Promise<MarkUnknownResult>;

	/**
	 * Resolve UNKNOWN → COMPLETED (reconciler confirmed).
	 */
	resolveUnknownAsCompleted(
		tx: DbTransaction,
		input: ResolveUnknownInput & { resultMetadata?: unknown },
	): Promise<ResolveUnknownResult>;

	/**
	 * Resolve UNKNOWN → FAILED RETRYABLE (reconciler confirmed not applied).
	 */
	resolveUnknownAsRetryable(
		tx: DbTransaction,
		input: ResolveUnknownInput & { failureCode: string },
	): Promise<ResolveUnknownResult>;

	/**
	 * Resolve UNKNOWN → FAILED TERMINAL (unrecoverable).
	 */
	resolveUnknownAsTerminal(
		tx: DbTransaction,
		input: ResolveUnknownInput & { failureCode: string },
	): Promise<ResolveUnknownResult>;
}
