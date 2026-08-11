import { relations } from "drizzle-orm";
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";

export const threadStatuses = [
	"DRAFT",
	"ACTIVE",
	"BLOCKED",
	"PENDING_REVIEW",
	"AWAITING_INFO",
	"REVIEWED",
	"CLOSED",
] as const;

export type ThreadStatus = (typeof threadStatuses)[number];

export const threadEnvironments = ["local", "sandbox", "cloud"] as const;
export type ThreadEnvironment = (typeof threadEnvironments)[number];

export const threadPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type ThreadPriority = (typeof threadPriorities)[number];

export const threads = pgTable(
	"threads",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),

		title: text("title").notNull(),
		description: text("description"),

		status: varchar("status", { length: 20 })
			.$type<ThreadStatus>()
			.default("DRAFT")
			.notNull(),
		environment: varchar("environment", { length: 10 })
			.$type<ThreadEnvironment>()
			.default("local")
			.notNull(),
		period: varchar("period", { length: 7 }),
		priority: varchar("priority", { length: 10 })
			.$type<ThreadPriority>()
			.default("MEDIUM")
			.notNull(),
		tags: jsonb("tags").$type<string[]>().default([]).notNull(),

		createdById: uuid("created_by_id"),
		closedById: uuid("closed_by_id"),
		closeNote: text("close_note"),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		closedAt: timestamp("closed_at"),
	},
	(table) => ({
		companyIdIdx: index("idx_threads_company_id").on(table.companyId),
		statusIdx: index("idx_threads_status").on(table.status),
		companyStatusIdx: index("idx_threads_company_status").on(
			table.companyId,
			table.status,
		),
		periodIdx: index("idx_threads_period").on(table.period),
		priorityIdx: index("idx_threads_priority").on(table.priority),
		createdAtIdx: index("idx_threads_created_at").on(table.createdAt),
	}),
);

export const threadsRelations = relations(threads, ({ one }) => ({
	company: one(companies, {
		fields: [threads.companyId],
		references: [companies.id],
	}),
}));
