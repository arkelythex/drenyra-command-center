import {
	boolean,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
export const failedLoginAttempts = pgTable(
	"failed_login_attempts",
	{
		id: serial("id").primaryKey(),
		email: varchar("email", { length: 255 }).notNull(),
		ipAddress: varchar("ip_address", { length: 45 }).notNull(),
		userAgent: text("user_agent"),
		reason: varchar("reason", { length: 50 }).notNull(),
		attemptCount: integer("attempt_count").notNull().default(1),
		lockedUntil: timestamp("locked_until"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		emailIdx: index("idx_failed_login_email").on(table.email),
		ipIdx: index("idx_failed_login_ip").on(table.ipAddress),
	}),
);
export const accessLogs = pgTable(
	"access_logs",
	{
		id: serial("id").primaryKey(),
		userId: varchar("user_id", { length: 36 }),
		userEmail: varchar("user_email", { length: 255 }),
		action: varchar("action", { length: 100 }).notNull(),
		resource: varchar("resource", { length: 100 }).notNull(),
		result: varchar("result", { length: 20 }).notNull(),
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: text("user_agent"),
		details: text("details"),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index("idx_access_logs_user").on(table.userId),
		actionIdx: index("idx_access_logs_action").on(table.action),
		timestampIdx: index("idx_access_logs_timestamp").on(table.timestamp),
	}),
);
export const promptGuardAudit = pgTable(
	"prompt_guard_audit",
	{
		id: serial("id").primaryKey(),
		userId: varchar("user_id", { length: 36 }),
		action: varchar("action", { length: 100 }).notNull(),
		prompt: text("prompt"),
		allowed: boolean("allowed").notNull(),
		reason: text("reason"),
		blockedKeyword: varchar("blocked_keyword", { length: 50 }),
		requiresAdminOverride: boolean("requires_admin_override")
			.notNull()
			.default(false),
		timestamp: timestamp("timestamp").defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index("idx_prompt_guard_user").on(table.userId),
		allowedIdx: index("idx_prompt_guard_allowed").on(table.allowed),
	}),
);

