/**
 * Agent Run Inputs Schema (separated to avoid Vite SSR ESM circular dependency)
 * Stores input data for agent runs to enable session recovery.
 *
 * @module persistence/schema/agent-run-inputs
 */

import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { agentRunStates } from "./agent-run.schema";

// --- AGENT RUN INPUTS ---
/**
 * agentRunInputs table.
 * Stores input data for agent runs to enable session recovery.
 * Separated from agentRunStates to keep state rows lean for frequent status queries.
 */
export const agentRunInputs = pgTable(
	"agent_run_inputs",
	{
		runId: text("run_id")
			.notNull()
			.primaryKey()
			.references(() => agentRunStates.runId, { onDelete: "cascade" }),
		inputType: text("input_type").notNull(),
		inputData: text("input_data").notNull(),
		checksum: text("checksum").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		runIdIdx: uniqueIndex("agent_run_inputs_run_id_idx").on(table.runId),
	}),
);

// --- TYPES ---
export type AgentRunInput = typeof agentRunInputs.$inferSelect;
export type NewAgentRunInput = typeof agentRunInputs.$inferInsert;
