/**
 * Doctor Mode schema: system health checks and monitoring history.
 */
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const checkCategoryEnum = pgEnum("check_category", [
	"database",
	"ai_api",
	"sunat",
	"redis",
	"storage",
	"external",
]);

export const checkStatusEnum = pgEnum("check_status", [
	"healthy",
	"degraded",
	"down",
	"unknown",
]);

export const systemChecks = pgTable(
	"system_checks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		category: checkCategoryEnum("category").notNull(),
		status: checkStatusEnum("status").notNull().default("unknown"),
		lastRunAt: timestamp("last_run_at", { withTimezone: true }),
		lastDuration: integer("last_duration"),
		lastError: text("last_error"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => ({
		categoryIdx: index("idx_system_checks_category").on(table.category),
		statusIdx: index("idx_system_checks_status").on(table.status),
	}),
);

export const checkHistory = pgTable(
	"check_history",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		checkId: uuid("check_id")
			.references(() => systemChecks.id, { onDelete: "cascade" })
			.notNull(),
		status: checkStatusEnum("status").notNull(),
		duration: integer("duration"),
		error: text("error"),
		runAt: timestamp("run_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		checkIdIdx: index("idx_check_history_check_id").on(table.checkId),
		runAtIdx: index("idx_check_history_run_at").on(table.runAt),
	}),
);

export type SystemCheck = typeof systemChecks.$inferSelect;
export type NewSystemCheck = typeof systemChecks.$inferInsert;

export type CheckHistoryEntry = typeof checkHistory.$inferSelect;
export type NewCheckHistoryEntry = typeof checkHistory.$inferInsert;
