/**
 * Inbox Messages Schema (W2-05 / ADR-009).
 *
 * Transactional inbox pattern for consumer deduplication.
 * Guarantees exactly-once processing per (consumer_name, producer, message_id)
 * regardless of broker guarantees.
 *
 * Design decisions:
 * - `producer` is NOT NULL: acts as namespace to prevent collisions between
 *   different message sources (SUNAT_CDR, BULLMQ_JOB, NATS_EVENT).
 * - `company_id` is NOT part of the dedup key: tenant is authorization context,
 *   not message identity.
 * - payload_hash enables detection of redelivery with different payload.
 * - processing_token fencing reuses the W2-03B.1 pattern.
 * - No TTL: inbox records are permanent dedup evidence.
 * - Large payloads should be stored externally; only payload_hash in the inbox.
 *
 * @see docs/adr/W2-05A-consumer-dedup-inventory.md
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

// ─── Enums ───────────────────────────────────────────────────────────────────

export const inboxStatusEnum = pgEnum("inbox_status", [
	"PROCESSING",
	"COMPLETED",
	"FAILED",
]);

export const inboxFailureClassEnum = pgEnum("inbox_failure_class", [
	"RETRYABLE",
	"TERMINAL",
]);

// ─── Types ───────────────────────────────────────────────────────────────────

export type InboxStatus = (typeof inboxStatusEnum.enumValues)[number];
export type InboxFailureClass =
	(typeof inboxFailureClassEnum.enumValues)[number];

// ─── Table ───────────────────────────────────────────────────────────────────

export const inboxMessages = pgTable(
	"inbox_messages",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// ─── Identity ──────────────────────────────────────────────────
		consumerName: varchar("consumer_name", { length: 100 }).notNull(),
		producer: varchar("producer", { length: 100 }).notNull(),
		messageId: varchar("message_id", { length: 255 }).notNull(),
		messageType: varchar("message_type", { length: 100 }).notNull(),

		// ─── Request fingerprint ───────────────────────────────────────
		payloadHash: varchar("payload_hash", { length: 64 }).notNull(),

		// ─── Tenant scope (authorization, NOT identity) ────────────────
		organizationId: uuid("organization_id"),
		companyId: uuid("company_id"),

		// ─── State machine ─────────────────────────────────────────────
		status: inboxStatusEnum("status").notNull().default("PROCESSING"),
		failureClass: inboxFailureClassEnum("failure_class"),
		failureCode: varchar("failure_code", { length: 100 }),
		attemptCount: integer("attempt_count").default(1).notNull(),

		// ─── Timing & recovery ─────────────────────────────────────────
		lastFailedAt: timestamp("last_failed_at"),
		nextRetryAt: timestamp("next_retry_at"),
		processingToken: uuid("processing_token"),
		processingStartedAt: timestamp("processing_started_at"),
		processingExpiresAt: timestamp("processing_expires_at"),
		completedAt: timestamp("completed_at"),

		// ─── Result ────────────────────────────────────────────────────
		resultMetadata: jsonb("result_metadata"),

		// ─── Lifecycle ─────────────────────────────────────────────────
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		naturalKey: unique("uq_inbox_messages_consumer_message").on(
			table.consumerName,
			table.producer,
			table.messageId,
		),
	}),
);
