/**
 * Reconciliation Rules Schema
 *
 * Configurable matching rules for the auto-reconciliation engine.
 * Rules are evaluated in priority order at runtime.
 */

import { boolean, integer, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const reconciliationRules = pgTable("reconciliation_rules", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),

	// Rule definition
	name: varchar("name", { length: 200 }).notNull(),
	ruleType: varchar("rule_type", { length: 20 }).notNull(), // MATCH, EXCLUSION
	conditions: jsonb("conditions").notNull(), // JSON: { amountTolerance, dateTolerance, matchFields[], ... }
	priority: integer("priority").notNull().default(10),

	// Status
	isActive: boolean("is_active").default(true),

	// Metadata
	createdAt: timestamp("created_at").defaultNow(),
});
