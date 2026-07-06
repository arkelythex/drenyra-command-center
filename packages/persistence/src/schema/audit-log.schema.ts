/**
 * Audit Log Schema — Drenyra
 *
 * Append-only log for business-critical operations across fiscal features.
 * Each entry records WHO did WHAT to WHICH entity, for WHICH company,
 * and WHEN it happened. Immutable by design — no UPDATE, no DELETE.
 *
 * ## Logged operations (by feature)
 *
 * | Feature           | Actions                                          |
 * |-------------------|--------------------------------------------------|
 * | accounting-prs    | create, submit, approve, reject, post            |
 * | judgment-day      | run_review, acknowledge, resolve                 |
 * | monthly-close     | gate_override, checklist_complete                |
 * | evidence          | upload, delete, classify                         |
 * | sire-comparison   | resolve_discrepancy, generate_report             |
 *
 * @module persistence/schema/audit-log
 */
import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * Audit log table — append-only, immutable entries.
 *
 * Partitioned by companyId for tenant isolation. Each row records
 * a single auditable operation with enough context to reconstruct
 * the event, trace it back to the actor, and correlate it across
 * features.
 */
export const auditLogs = pgTable(
	"audit_logs",
	{
		/** Auto-generated UUID primary key */
		id: uuid("id").defaultRandom().primaryKey(),

		/** Tenant (company) identifier — all queries MUST scope by this */
		companyId: uuid("company_id").notNull(),

		/** Feature/entity name, e.g. "accounting-prs", "judgment-day" */
		feature: varchar("feature", { length: 64 }).notNull(),

		/** Action performed, e.g. "approve", "reject", "upload" */
		action: varchar("action", { length: 64 }).notNull(),

		/** Target entity ID (UUID of the PR, review, evidence, etc.) */
		targetId: uuid("target_id"),

		/** User who performed the action */
		actorId: uuid("actor_id").notNull(),

		/** Human-readable actor identifier (email or name) for quick lookup */
		actorLabel: varchar("actor_label", { length: 255 }),

		/** Previous status/value before the action (for state transitions) */
		previousValue: text("previous_value"),

		/** New status/value after the action */
		newValue: text("new_value"),

		/** Arbitrary JSON metadata for feature-specific context */
		metadata: text("metadata"),

		/** When the action occurred (server time) */
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		/** Fast lookup by company — the most common query pattern */
		companyIdx: index("audit_logs_company_idx").on(table.companyId),

		/** Filter by feature within a company */
		featureIdx: index("audit_logs_feature_idx").on(
			table.companyId,
			table.feature,
		),

		/** Find all changes to a specific entity */
		targetIdx: index("audit_logs_target_idx").on(table.targetId),
	}),
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
