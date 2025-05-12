/**
 * Idempotency Schema
 *
 * Generic idempotency records table for HTTP commands, message consumers,
 * and jobs. Follows ADR-009: Canonical Idempotency Contract.
 *
 * **Key design decisions:**
 * - `company_id` is NOT NULL: all idempotent operations in Drenyra are
 *   scoped to a company. No organization-level idempotency without
 *   company scope — product decision.
 * - `failure_class` is nullable because only FAILED records carry it.
 * - `request_hash` is SHA-256 hex (64 chars) of the normalized request payload.
 * - COMPLETED stores terminal results including business errors (409, 422).
 *   FAILED is reserved for technical/operational failures without a
 *   functional result to replay.
 * - `response_*` columns are nullable because PENDING/PROCESSING records
 *   don't have responses yet.
 *
 * @see {@link https://github.com/Drenyra/docs/adr/ADR-009-canonical-idempotency-contract.md}
 *
 * @example
 * ```ts
 * import { idempotencyRecords } from "@drenyra/persistence/schema";
 * ```
 */
import {
	integer,
	jsonb,
	pgEnum,
	pgTable,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * Idempotency record status enum.
 *
 * PENDING    → record created, operation not started
 * PROCESSING → operation in progress
 * COMPLETED  → definitive terminal result, cached for replay.
 *              Includes both success (2xx) and cacheable business errors
 *              (409 Conflict, 422 Unprocessable) — any result that occurred
 *              AFTER accepting the idempotent intent.
 * FAILED     → technical/operational failure WITHOUT a functional result.
 *              No response to replay. May be RETRYABLE or TERMINAL.
 */
export const idempotencyStatusEnum = pgEnum("idempotency_status", [
	"PENDING",
	"PROCESSING",
	"COMPLETED",
	"FAILED",
]);

/**
 * Failure class for FAILED records.
 *
 * RETRYABLE → transient failure (timeout, dependency down, deadlock).
 *             Can transition back to PROCESSING.
 * TERMINAL  → deterministic failure (business rule violation, forbidden
 *             operation, incompatible state). Cannot be retried.
 */
export const failureClassEnum = pgEnum("failure_class", [
	"RETRYABLE",
	"TERMINAL",
]);

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Idempotency records table.
 *
 * Generic storage for idempotency keys across all channels:
 * HTTP commands, message consumers, and jobs.
 *
 * **Business rules:**
 * - One record per (organization_id, company_id, operation, idempotency_key)
 * - request_hash is mandatory for payload mismatch detection
 * - COMPLETED status requires response_status and response_body
 * - FAILED requires failure_code
 * - FAILED + failure_class = TERMINAL cannot transition back to PROCESSING
 * - TTL-based expiration via expires_at; cleanup job removes EXPIRED records
 *
 * **Indexes:**
 * - Primary unique constraint covers tenant scope + operation + key
 * - Additional index on (expires_at) for cleanup queries
 * - Additional index on (status, locked_at) for orphan recovery
 */
export type IdempotencyStatus =
	(typeof idempotencyStatusEnum.enumValues)[number];
export type FailureClass = (typeof failureClassEnum.enumValues)[number];

export type IdempotencyRecord = InferSelectModel<typeof idempotencyRecords>;
export type NewIdempotencyRecord = InferInsertModel<typeof idempotencyRecords>;

export const idempotencyRecords = pgTable(
	"idempotency_records",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// --- Tenant scope ---
		organizationId: uuid("organization_id").notNull(),
		companyId: uuid("company_id").notNull(),
		operation: varchar("operation", { length: 100 }).notNull(),
		idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),

		// --- Request fingerprint ---
		requestHash: varchar("request_hash", { length: 64 }).notNull(),

		// --- State machine ---
		status: idempotencyStatusEnum("status").notNull().default("PENDING"),
		failureCode: varchar("failure_code", { length: 100 }),
		failureClass: failureClassEnum("failure_class"),
		attemptCount: integer("attempt_count").default(1).notNull(),

		// --- Timing & ownership ---
		lockedAt: timestamp("locked_at"),
		processingToken: uuid("processing_token"),
		completedAt: timestamp("completed_at"),
		failedAt: timestamp("failed_at"),

		// --- Terminal result (COMPLETED only; includes both success and
		// cacheable business errors like 409/422 for deterministic replay;
		// response_body nullable for 204 No Content and status-only responses) ---
		responseStatus: integer("response_status"),
		responseBody: jsonb("response_body"),
		responseHeaders: jsonb("response_headers"),

		// --- Lifecycle ---
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		unique("uq_idempotency_scope_key").on(
			table.organizationId,
			table.companyId,
			table.operation,
			table.idempotencyKey,
		),
	],
);
