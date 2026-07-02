import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { threads } from "./threads.schema";

export const threadTaskStatuses = [
	"PENDING",
	"ASSIGNED",
	"IN_PROGRESS",
	"COMPLETED",
	"FAILED",
	"SKIPPED",
] as const;

export type ThreadTaskStatus = (typeof threadTaskStatuses)[number];

export const threadTasks = pgTable(
	"thread_tasks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		threadId: uuid("thread_id")
			.references(() => threads.id, { onDelete: "cascade" })
			.notNull(),

		title: text("title").notNull(),
		description: text("description"),

		status: varchar("status", { length: 20 })
			.$type<ThreadTaskStatus>()
			.default("PENDING")
			.notNull(),
		agentId: uuid("agent_id"),
		assignedAt: timestamp("assigned_at"),
		completedAt: timestamp("completed_at"),
		completedById: uuid("completed_by_id"),
		resultSummary: text("result_summary"),
		evidenceIds: jsonb("evidence_ids").$type<string[]>().default([]).notNull(),

		sortOrder: integer("sort_order").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		threadIdIdx: index("idx_thread_tasks_thread_id").on(table.threadId),
		statusIdx: index("idx_thread_tasks_status").on(table.status),
		agentIdIdx: index("idx_thread_tasks_agent_id").on(table.agentId),
	}),
);

export const threadTasksRelations = relations(threadTasks, ({ one }) => ({
	thread: one(threads, {
		fields: [threadTasks.threadId],
		references: [threads.id],
	}),
}));
