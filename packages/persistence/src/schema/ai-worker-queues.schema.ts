/**
 * AI Worker Queues Schema
 * Tablas para el sistema de cola de workers AI de Arkelythex
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
 * workerTaskStatusEnum const.
 * Estados para tareas en la cola de workers AI
 *
 * @example
 * ```ts
 * console.log(workerTaskStatusEnum);
 * ```
 */
export const workerTaskStatusEnum = pgEnum("worker_task_status", [
	"pending",
	"processing",
	"completed",
	"failed",
]);

/**
 * workerTaskPriorityEnum const.
 * Prioridades para tareas en la cola
 *
 * @example
 * ```ts
 * console.log(workerTaskPriorityEnum);
 * ```
 */
export const workerTaskPriorityEnum = pgEnum("worker_task_priority", [
	"low",
	"medium",
	"high",
	"critical",
]);

// --- TABLES ---
/**
 * aiWorkerQueues const.
 * Tabla de cola de workers AI para procesamiento asíncrono
 *
 * @example
 * ```ts
 * console.log(aiWorkerQueues);
 * ```
 */
export const aiWorkerQueues = pgTable(
	"ai_worker_queues",
	{
		id: varchar("id", { length: 100 }).primaryKey(),

		companyId: uuid("company_id")
			.notNull()
			.references(() => companies.id, { onDelete: "cascade" }),

		userId: uuid("user_id")
			.notNull()
			.references(() => users.id),

		// Task Info
		type: varchar("type", { length: 100 }).notNull(),
		payload: jsonb("payload").notNull().default({}),
		result: jsonb("result"),

		// Status & Priority
		status: workerTaskStatusEnum("status").notNull().default("pending"),
		priority: workerTaskPriorityEnum("priority").notNull().default("medium"),

		// Retry Logic
		retryCount: integer("retry_count").notNull().default(0),
		maxRetries: integer("max_retries").notNull().default(3),
		nextRetryAt: timestamp("next_retry_at"),

		// Error Info
		error: text("error"),
		errorStack: text("error_stack"),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
		startedAt: timestamp("started_at"),
		completedAt: timestamp("completed_at"),
	},
	(table) => ({
		statusCreatedAtIdx: index("ai_worker_queue_status_created_idx").on(
			table.status,
			table.createdAt,
		),
		companyStatusIdx: index("ai_worker_queue_company_status_idx").on(
			table.companyId,
			table.status,
		),
		nextRetryAtIdx: index("ai_worker_queue_next_retry_idx").on(
			table.nextRetryAt,
		),
	}),
);

// --- RELATIONS ---
/**
 * aiWorkerQueuesRelations const.
 *
 * @example
 * ```ts
 * console.log(aiWorkerQueuesRelations);
 * ```
 */
export const aiWorkerQueuesRelations = relations(aiWorkerQueues, ({ one }) => ({
	company: one(companies, {
		fields: [aiWorkerQueues.companyId],
		references: [companies.id],
	}),
	user: one(users, {
		fields: [aiWorkerQueues.userId],
		references: [users.id],
	}),
}));

// --- TYPES ---
/**
 * AIWorkerTask type.
 *
 * @example
 * ```ts
 * const value: AIWorkerTask = {} as AIWorkerTask;
 * console.log(value);
 * ```
 */
export type AIWorkerTask = typeof aiWorkerQueues.$inferSelect;
/**
 * NewAIWorkerTask type.
 *
 * @example
 * ```ts
 * const value: NewAIWorkerTask = {} as NewAIWorkerTask;
 * console.log(value);
 * ```
 */
export type NewAIWorkerTask = typeof aiWorkerQueues.$inferInsert;
