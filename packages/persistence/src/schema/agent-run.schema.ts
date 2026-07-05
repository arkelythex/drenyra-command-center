/**
 * Agent Run Schema
 * Tablas para persistencia de estados y eventos de ejecución de agentes
 *
 * @module persistence/schema/agent-run
 */

import {
	index,
	jsonb,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { chatSessions } from "./chat.schema";

// --- AGENT RUN STATES ---
/**
 * agentRunStates table.
 * Stores the current state of each agent run for session persistence and recovery.
 */
export const agentRunStates = pgTable(
	"agent_run_states",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		runId: text("run_id").notNull().unique(),
		sessionId: uuid("session_id").references(() => chatSessions.id, {
			onDelete: "set null",
		}),
		workflowState: text("workflow_state"), // IDLE | EXTRACTING | PARSING | VALIDATING | COMPLETED | FAILED | MANUAL_REVIEW
		agentMetrics: jsonb("agent_metrics").$type<Record<string, unknown>>(),
		context: jsonb("context").$type<Record<string, unknown>>(),
		status: text("status").notNull().default("running"), // running | completed | failed | manual_review | degraded
		error: text("error"),
		companyId: uuid("company_id").notNull(),
		startedAt: timestamp("started_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		runIdIdx: uniqueIndex("agent_run_states_run_id_idx").on(table.runId),
		companyStatusIdx: index("agent_run_states_company_status_idx").on(
			table.companyId,
			table.status,
		),
		companyCreatedIdx: index("agent_run_states_company_created_idx").on(
			table.companyId,
			table.createdAt,
		),
		sessionIdx: index("agent_run_states_session_idx").on(table.sessionId),
	}),
);

// --- AGENT RUN EVENTS ---
/**
 * agentRunEvents table.
 * Append-only event log for agent run activity.
 */
export const agentRunEvents = pgTable(
	"agent_run_events",
	{
		id: serial("id").primaryKey(),
		runId: text("run_id").notNull(),
		eventType: text("event_type").notNull(),
		payload: jsonb("payload").$type<Record<string, unknown>>(),
		companyId: uuid("company_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		runIdx: index("agent_run_events_run_idx").on(table.runId),
		companyRunIdx: index("agent_run_events_company_run_idx").on(
			table.companyId,
			table.runId,
		),
	}),
);

// --- TYPES ---
export type AgentRunState = typeof agentRunStates.$inferSelect;
export type NewAgentRunState = typeof agentRunStates.$inferInsert;
export type AgentRunEvent = typeof agentRunEvents.$inferSelect;
export type NewAgentRunEvent = typeof agentRunEvents.$inferInsert;
// AgentRunInput table is in agent-run-inputs.schema.ts — re-exported from index.ts
