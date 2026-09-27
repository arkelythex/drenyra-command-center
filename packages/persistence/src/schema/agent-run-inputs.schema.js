import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { agentRunStates } from "./agent-run.schema";
export const agentRunInputs = pgTable("agent_run_inputs", {
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
}, (table) => ({
    runIdIdx: uniqueIndex("agent_run_inputs_run_id_idx").on(table.runId),
}));
//# sourceMappingURL=agent-run-inputs.schema.js.map