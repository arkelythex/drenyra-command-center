import { relations } from "drizzle-orm";
import { date, decimal, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar, } from "drizzle-orm/pg-core";
export const taxRules = pgTable("tax_rules", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    sunatResolution: varchar("sunat_resolution", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    categoryIdx: index("tax_rules_category_idx").on(table.category),
}));
export const taxRuleVersions = pgTable("tax_rule_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    ruleId: uuid("rule_id")
        .notNull()
        .references(() => taxRules.id, { onDelete: "cascade" }),
    rate: decimal("rate", { precision: 10, scale: 6 }),
    thresholdCents: integer("threshold_cents"),
    thresholdCurrency: varchar("threshold_currency", { length: 3 })
        .notNull()
        .default("PEN"),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
    ruleEffectiveFromIdx: index("tax_rule_versions_rule_effective_from_idx").on(table.ruleId, table.effectiveFrom),
    effectiveWindowIdx: index("tax_rule_versions_effective_window_idx").on(table.effectiveFrom, table.effectiveTo),
}));
export const taxRulesRelations = relations(taxRules, ({ many }) => ({
    versions: many(taxRuleVersions),
}));
export const taxRuleVersionsRelations = relations(taxRuleVersions, ({ one }) => ({
    rule: one(taxRules, {
        fields: [taxRuleVersions.ruleId],
        references: [taxRules.id],
    }),
}));
export const retenciones = pgTable("retenciones", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    billId: uuid("bill_id").notNull(),
    supplierRuc: varchar("supplier_ruc", { length: 11 }).notNull(),
    baseAmountCents: integer("base_amount_cents").notNull(),
    retentionAmountCents: integer("retention_amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("PEN"),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    declarationPeriod: varchar("declaration_period", { length: 7 }).notNull(),
    sunatDueDate: date("sunat_due_date").notNull(),
    pdtReference: varchar("pdt_reference", { length: 50 }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    declaredAt: timestamp("declared_at"),
    paidAt: timestamp("paid_at"),
    cancelledAt: timestamp("cancelled_at"),
}, (table) => ({
    companyStatusIdx: index("retenciones_company_status_idx").on(table.companyId, table.status),
    companyPeriodIdx: index("retenciones_company_period_idx").on(table.companyId, table.declarationPeriod),
    billIdx: index("retenciones_bill_idx").on(table.billId),
    dueDateIdx: index("retenciones_due_date_idx").on(table.sunatDueDate),
}));
export const percepciones = pgTable("percepciones", {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull(),
    billId: uuid("bill_id").notNull(),
    agentRuc: varchar("agent_ruc", { length: 11 }).notNull(),
    percepcionType: varchar("percepcion_type", { length: 20 }).notNull(),
    totalAmountCents: integer("total_amount_cents").notNull(),
    percepcionAmountCents: integer("percepcion_amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("PEN"),
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    declarationPeriod: varchar("declaration_period", { length: 7 }).notNull(),
    sunatDueDate: date("sunat_due_date").notNull(),
    pdtReference: varchar("pdt_reference", { length: 50 }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    declaredAt: timestamp("declared_at"),
    paidAt: timestamp("paid_at"),
    cancelledAt: timestamp("cancelled_at"),
}, (table) => ({
    companyStatusIdx: index("percepciones_company_status_idx").on(table.companyId, table.status),
    companyPeriodIdx: index("percepciones_company_period_idx").on(table.companyId, table.declarationPeriod),
    billIdx: index("percepciones_bill_idx").on(table.billId),
    dueDateIdx: index("percepciones_due_date_idx").on(table.sunatDueDate),
}));
//# sourceMappingURL=taxation.schema.js.map