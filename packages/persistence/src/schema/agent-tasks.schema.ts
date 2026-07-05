/**
 * Agent Tasks Schema
 * Tablas para el sistema de agentes AI de Drenyra
 */

import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies, users } from "./index";

// --- ENUMS ---
/**
 * agentTaskStatusEnum const.
 *
 * @example
 * ```ts
 * console.log(agentTaskStatusEnum);
 * ```
 */
export const agentTaskStatusEnum = pgEnum("agent_task_status", [
	"idle",
	"running",
	"paused",
	"completed",
	"failed",
	"retrying",
]);

/**
 * agentTaskPriorityEnum const.
 *
 * @example
 * ```ts
 * console.log(agentTaskPriorityEnum);
 * ```
 */
export const agentTaskPriorityEnum = pgEnum("agent_task_priority", [
	"low",
	"medium",
	"high",
	"critical",
]);

// --- TABLES ---
/**
 * agentTasks const.
 *
 * @example
 * ```ts
 * console.log(agentTasks);
 * ```
 */
export const agentTasks = pgTable(
	"agent_tasks",
	{
		id: varchar("id", { length: 100 }).primaryKey(),

		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),

		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),

		// Agent & Skill Info
		agentId: varchar("agent_id", { length: 100 }).notNull(),
		agentName: varchar("agent_name", { length: 255 }).notNull(),
		skillId: varchar("skill_id", { length: 100 }).notNull(),
		skillName: varchar("skill_name", { length: 255 }).notNull(),

		// Task Data
		input: jsonb("input").notNull().default({}),
		result: jsonb("result"),
		logs: jsonb("logs").$type<string[]>(),

		// Status & Priority
		status: agentTaskStatusEnum("status").notNull().default("idle"),
		priority: agentTaskPriorityEnum("priority").notNull().default("medium"),

		// Retry Logic
		retryCount: integer("retry_count").notNull().default(0),
		maxRetries: integer("max_retries").notNull().default(3),

		// Parent/Child for multi-agent tasks
		parentTaskId: varchar("parent_task_id", { length: 100 }),

		// Error Info
		errorMessage: text("error_message"),
		errorStack: text("error_stack"),

		// Notifications
		notifiedChannels: jsonb("notified_channels").$type<string[]>(),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
		nextRetryAt: timestamp("next_retry_at"),
	},
	(table) => ({
		companyIdIdx: index("agent_task_company_id_idx").on(table.companyId),
		statusIdx: index("agent_task_status_idx").on(table.status),
		agentIdIdx: index("agent_task_agent_id_idx").on(table.agentId),
		parentIdx: index("agent_task_parent_idx").on(table.parentTaskId),
		createdAtIdx: index("agent_task_created_at_idx").on(table.createdAt),
	}),
);

// --- RELATIONS ---
/**
 * agentTasksRelations const.
 *
 * @example
 * ```ts
 * console.log(agentTasksRelations);
 * ```
 */
export const agentTasksRelations = relations(agentTasks, ({ one }) => ({
	company: one(companies, {
		fields: [agentTasks.companyId],
		references: [companies.id],
	}),
	user: one(users, {
		fields: [agentTasks.userId],
		references: [users.id],
	}),
}));

// --- TYPES ---
/**
 * AgentTask type.
 *
 * @example
 * ```ts
 * const value: AgentTask = {} as AgentTask;
 * console.log(value);
 * ```
 */
export type AgentTask = typeof agentTasks.$inferSelect;
/**
 * NewAgentTask type.
 *
 * @example
 * ```ts
 * const value: NewAgentTask = {} as NewAgentTask;
 * console.log(value);
 * ```
 */
export type NewAgentTask = typeof agentTasks.$inferInsert;
