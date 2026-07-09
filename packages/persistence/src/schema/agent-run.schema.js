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
export const agentRunStates = pgTable(
	"agent_run_states",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		runId: text("run_id").notNull().unique(),
		sessionId: uuid("session_id").references(() => chatSessions.id, {
			onDelete: "set null",
		}),
		workflowState: text("workflow_state"),
		agentMetrics: jsonb("agent_metrics").$type(),
		context: jsonb("context").$type(),
		status: text("status").notNull().default("running"),
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
export const agentRunEvents = pgTable(
	"agent_run_events",
	{
		id: serial("id").primaryKey(),
		runId: text("run_id").notNull(),
		eventType: text("event_type").notNull(),
		payload: jsonb("payload").$type(),
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

