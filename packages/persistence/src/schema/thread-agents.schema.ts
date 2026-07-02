import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { threads } from "./threads.schema";

export const threadAgentRoles = [
	"PRIMARY",
	"SUPPORT",
	"REVIEWER",
	"OBSERVER",
] as const;

export type ThreadAgentRole = (typeof threadAgentRoles)[number];

export const threadAgents = pgTable(
	"thread_agents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		threadId: uuid("thread_id")
			.references(() => threads.id, { onDelete: "cascade" })
			.notNull(),

		agentId: uuid("agent_id").notNull(),
		agentName: text("agent_name").notNull(),
		role: varchar("role", { length: 20 })
			.$type<ThreadAgentRole>()
			.default("PRIMARY")
			.notNull(),

		assignedAt: timestamp("assigned_at").defaultNow().notNull(),
		unassignedAt: timestamp("unassigned_at"),
		isActive: boolean("is_active").default(true).notNull(),
	},
	(table) => ({
		threadIdIdx: index("idx_thread_agents_thread_id").on(table.threadId),
		agentIdIdx: index("idx_thread_agents_agent_id").on(table.agentId),
		activeIdx: index("idx_thread_agents_active").on(
			table.threadId,
			table.isActive,
		),
	}),
);

export const threadAgentsRelations = relations(threadAgents, ({ one }) => ({
	thread: one(threads, {
		fields: [threadAgents.threadId],
		references: [threads.id],
	}),
}));
