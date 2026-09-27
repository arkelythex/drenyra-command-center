import { boolean, integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
export const reconciliationRules = pgTable("reconciliation_rules", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    ruleType: varchar("rule_type", { length: 20 }).notNull(),
    conditions: jsonb("conditions").notNull(),
    priority: integer("priority").notNull().default(10),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
//# sourceMappingURL=reconciliation-rules.schema.js.map