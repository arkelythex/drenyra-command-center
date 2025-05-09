/**
 * Job Executions Schema (W2-06B).
 *
 * PostgreSQL-backed Job Uniqueness Registry.
 * Source of truth for whether a logical job should execute.
 *
 * @see docs/adr/W2-06A-job-uniqueness-inventory.md
 */

import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const jobUniquenessPolicyEnum = pgEnum("job_uniqueness_policy", [
	"PERMANENT",
	"PERMANENT_BY_INPUT",
	"ACTIVE_ONLY",
	"WINDOWED",
	"REPLACEABLE",
]);

export const jobExecutionStatusEnum = pgEnum("job_execution_status", [
	"PENDING",
	"ENQUEUED",
	"RUNNING",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
	"SUPERSEDED",
	"UNKNOWN",
]);

export const jobFailureClassEnum = pgEnum("job_failure_class", [
	"RETRYABLE",
	"TERMINAL",
]);

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobUniquenessPolicy =
	(typeof jobUniquenessPolicyEnum.enumValues)[number];
export type JobExecutionStatus =
	(typeof jobExecutionStatusEnum.enumValues)[number];
export type JobFailureClass = (typeof jobFailureClassEnum.enumValues)[number];

// ─── Table ───────────────────────────────────────────────────────────────────

/**
 * Sentinel UUID for COALESCE in partial unique indexes where company_id is NULL.
 * This is a compile-time constant, never stored as an actual company_id value.
 */
const NULL_COMPANY_SENTINEL = "00000000-0000-0000-0000-000000000000";

export const jobExecutions = pgTable(
	"job_executions",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// ─── Tenant scope ───────────────────────────────────────────
		organizationId: uuid("organization_id").notNull(),
		companyId: uuid("company_id"),

		// ─── Identity ───────────────────────────────────────────────
		queueName: varchar("queue_name", { length: 100 }).notNull(),
		jobType: varchar("job_type", { length: 100 }).notNull(),
		logicalKey: varchar("logical_key", { length: 512 }).notNull(),
		executionWindow: varchar("execution_window", { length: 100 }),
		uniquenessPolicy: jobUniquenessPolicyEnum("uniqueness_policy").notNull(),
		generation: integer("generation").notNull().default(1),

		// ─── State ──────────────────────────────────────────────────
		status: jobExecutionStatusEnum("status").notNull().default("PENDING"),
		failureClass: jobFailureClassEnum("failure_class"),
		failureCode: varchar("failure_code", { length: 100 }),
		attemptCount: integer("attempt_count").notNull().default(0),

		// ─── Ownership & fencing ────────────────────────────────────
		executionToken: uuid("execution_token"),
		leaseStartedAt: timestamp("lease_started_at", {
			withTimezone: true,
		}),
		leaseExpiresAt: timestamp("lease_expires_at", {
			withTimezone: true,
		}),

		// ─── Integration ─────────────────────────────────────────────
		bullmqJobId: varchar("bullmq_job_id", { length: 255 }),
		outboxEventId: uuid("outbox_event_id"),

		// ─── Supersession ────────────────────────────────────────────
		supersededById: uuid("superseded_by_id"),
		cancelRequestedAt: timestamp("cancel_requested_at", {
			withTimezone: true,
		}),

		// ─── Unknown state (external ambiguity) ──────────────────────
		unknownSince: timestamp("unknown_since", { withTimezone: true }),
		unknownReason: varchar("unknown_reason", { length: 255 }),
		externalOperationId: varchar("external_operation_id", { length: 255 }),
		reconciliationAttemptCount: integer("reconciliation_attempt_count")
			.notNull()
			.default(0),
		lastReconciledAt: timestamp("last_reconciled_at", { withTimezone: true }),
		nextReconciliationAt: timestamp("next_reconciliation_at", {
			withTimezone: true,
		}),
		resolvedAt: timestamp("resolved_at", { withTimezone: true }),

		// ─── Timing ─────────────────────────────────────────────────
		enqueuedAt: timestamp("enqueued_at", { withTimezone: true }),
		startedAt: timestamp("started_at", { withTimezone: true }),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		failedAt: timestamp("failed_at", { withTimezone: true }),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

		// ─── Payload fingerprint ─────────────────────────────────────
		inputHash: varchar("input_hash", { length: 64 }).notNull(),

		// ─── Result ─────────────────────────────────────────────────
		resultMetadata: jsonb("result_metadata"),

		// ─── Lifecycle ──────────────────────────────────────────────
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		// ─── Per-policy UNIQUE indexes ───────────────────────────────

		// ACTIVE_ONLY: blocks only while active (PENDING, ENQUEUED, RUNNING)
		activeOnlyIdx: uniqueIndex("uq_job_execution_active_only")
			.on(
				table.queueName,
				table.jobType,
				table.logicalKey,
				table.organizationId,
				sql`COALESCE(${table.companyId}, ${NULL_COMPANY_SENTINEL}::uuid)`,
			)
			.where(
				sql`uniqueness_policy = 'ACTIVE_ONLY'::job_uniqueness_policy
					AND status IN ('PENDING'::job_execution_status, 'ENQUEUED'::job_execution_status, 'RUNNING'::job_execution_status)`,
			),

		// PERMANENT and PERMANENT_BY_INPUT: locked even after COMPLETED/FAILED.
		// Only SUPERSEDED frees the identity.
		permanentIdx: uniqueIndex("uq_job_execution_permanent")
			.on(
				table.queueName,
				table.jobType,
				table.logicalKey,
				table.organizationId,
				sql`COALESCE(${table.companyId}, ${NULL_COMPANY_SENTINEL}::uuid)`,
			)
			.where(
				sql`uniqueness_policy IN ('PERMANENT'::job_uniqueness_policy, 'PERMANENT_BY_INPUT'::job_uniqueness_policy)
					AND status != 'SUPERSEDED'::job_execution_status`,
			),

		// WINDOWED: one identity per window.
		windowedIdx: uniqueIndex("uq_job_execution_windowed")
			.on(
				table.queueName,
				table.jobType,
				table.logicalKey,
				table.executionWindow,
				table.organizationId,
				sql`COALESCE(${table.companyId}, ${NULL_COMPANY_SENTINEL}::uuid)`,
			)
			.where(
				sql`uniqueness_policy = 'WINDOWED'::job_uniqueness_policy
					AND execution_window IS NOT NULL`,
			),

		// REPLACEABLE: blocks while not SUPERSEDED or CANCELLED.
		replaceableIdx: uniqueIndex("uq_job_execution_replaceable")
			.on(
				table.queueName,
				table.jobType,
				table.logicalKey,
				table.organizationId,
				sql`COALESCE(${table.companyId}, ${NULL_COMPANY_SENTINEL}::uuid)`,
			)
			.where(
				sql`uniqueness_policy = 'REPLACEABLE'::job_uniqueness_policy
					AND status NOT IN ('SUPERSEDED'::job_execution_status, 'CANCELLED'::job_execution_status)`,
			),
	}),
);

// ─── Outbox events table ────────────────────────────────────────────────────

// ─── Outbox events table (upgraded with relay ownership for W2-06C) ──────────

export const jobOutbox = pgTable(
	"job_outbox",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		jobExecutionId: uuid("job_execution_id")
			.notNull()
			.references(() => jobExecutions.id),
		action: varchar("action", { length: 50 }).notNull().default("ENQUEUE"),
		queueName: varchar("queue_name", { length: 100 }).notNull(),
		jobType: varchar("job_type", { length: 100 }).notNull(),
		payload: jsonb("payload").notNull(),

		// ─── Status & relay ownership ────────────────────────────────────
		status: varchar("status", { length: 20 }).notNull().default("PENDING"),
		relayToken: uuid("relay_token"),
		claimedAt: timestamp("claimed_at", { withTimezone: true }),
		claimExpiresAt: timestamp("claim_expires_at", { withTimezone: true }),
		attemptCount: integer("attempt_count").notNull().default(0),
		nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
		lastError: text("last_error"),
		availableAt: timestamp("available_at", { withTimezone: true })
			.defaultNow()
			.notNull(),

		// ─── Publication ─────────────────────────────────────────────────
		publishedAt: timestamp("published_at", { withTimezone: true }),
		discardedAt: timestamp("discarded_at", { withTimezone: true }),

		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		claimableIdx: index("idx_job_outbox_claimable").on(
			table.availableAt,
			table.createdAt,
		),
		staleClaimIdx: index("idx_job_outbox_stale_claim")
			.on(table.claimExpiresAt)
			.where(sql`status = 'CLAIMED'`),
	}),
);
