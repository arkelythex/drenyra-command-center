/**
 * Batch Run Schema
 * Tablas para persistencia de ejecuciones batch de agentes
 *
 * @module persistence/schema/batch-run
 */

import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// --- BATCH RUNS ---
/**
 * batchRuns table.
 * Stores batch-level metadata for multi-run session orchestration.
 * Tracks overall status, progress counts, and error information.
 */
export const batchRuns = pgTable(
	"batch_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),
		status: text("status", {
			enum: ["pending", "running", "completed", "failed", "partial", "cancelled"],
		})
			.notNull()
			.default("pending"),
		total: integer("total").notNull().default(0),
		completed: integer("completed").notNull().default(0),
		failed: integer("failed").notNull().default(0),
		error: text("error"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => ({
		companyIdx: index("idx_batch_runs_company").on(table.companyId),
		statusIdx: index("idx_batch_runs_status").on(table.status),
	}),
);

// --- BATCH RUN ITEMS ---
/**
 * batchRunItems table.
 * Per-item tracking within a batch run.
 * Links to batch_runs via batchId FK with cascade delete.
 */
export const batchRunItems = pgTable(
	"batch_run_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		batchId: uuid("batch_id")
			.notNull()
			.references(() => batchRuns.id, { onDelete: "cascade" }),
		runId: text("run_id"),
		sessionId: text("session_id"),
		status: text("status", {
			enum: ["pending", "running", "completed", "failed", "cancelled"],
		})
			.notNull()
			.default("pending"),
		error: text("error"),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
	},
	(table) => ({
		batchIdx: index("idx_batch_items_batch").on(table.batchId),
		statusIdx: index("idx_batch_items_status").on(table.status),
	}),
);

// --- TYPES ---
export type BatchRun = typeof batchRuns.$inferSelect;
export type NewBatchRun = typeof batchRuns.$inferInsert;
export type BatchRunItem = typeof batchRunItems.$inferSelect;
export type NewBatchRunItem = typeof batchRunItems.$inferInsert;
