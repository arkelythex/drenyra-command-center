import { relations } from "drizzle-orm";
import {
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * taxRules const.
 *
 * @example
 * ```ts
 * console.log(taxRules);
 * ```
 */
export const taxRules = pgTable(
	"tax_rules",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		code: varchar("code", { length: 50 }).notNull().unique(),
		name: varchar("name", { length: 200 }).notNull(),
		category: varchar("category", { length: 50 }).notNull(),
		sunatResolution: varchar("sunat_resolution", { length: 50 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		categoryIdx: index("tax_rules_category_idx").on(table.category),
	}),
);

/**
 * taxRuleVersions const.
 *
 * @example
 * ```ts
 * console.log(taxRuleVersions);
 * ```
 */
export const taxRuleVersions = pgTable(
	"tax_rule_versions",
	{
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
	},
	(table) => ({
		ruleEffectiveFromIdx: index("tax_rule_versions_rule_effective_from_idx").on(
			table.ruleId,
			table.effectiveFrom,
		),
		effectiveWindowIdx: index("tax_rule_versions_effective_window_idx").on(
			table.effectiveFrom,
			table.effectiveTo,
		),
	}),
);

/**
 * taxRulesRelations const.
 *
 * @example
 * ```ts
 * console.log(taxRulesRelations);
 * ```
 */
export const taxRulesRelations = relations(taxRules, ({ many }) => ({
	versions: many(taxRuleVersions),
}));

/**
 * taxRuleVersionsRelations const.
 *
 * @example
 * ```ts
 * console.log(taxRuleVersionsRelations);
 * ```
 */
export const taxRuleVersionsRelations = relations(taxRuleVersions, ({ one }) => ({
	rule: one(taxRules, {
		fields: [taxRuleVersions.ruleId],
		references: [taxRules.id],
	}),
}));

/**
 * retenciones table — IGV withholding records (RS 037-2002/SUNAT).
 *
 * Stores each 3% retention applied by an Agente de Retención to a supplier bill.
 * Amounts stored as integers (cents pattern) — never DECIMAL to avoid floating-point.
 *
 * Due date: always day 15 of the month following the bill payment (SUNAT rule).
 *
 * @example
 * ```ts
 * console.log(retenciones);
 * ```
 */
export const retenciones = pgTable(
	"retenciones",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),
		billId: uuid("bill_id").notNull(),

		// Supplier identification
		supplierRuc: varchar("supplier_ruc", { length: 11 }).notNull(),

		// Monetary amounts in cents (integer) — Money VO pattern
		baseAmountCents: integer("base_amount_cents").notNull(),
		retentionAmountCents: integer("retention_amount_cents").notNull(),
		currency: varchar("currency", { length: 3 }).notNull().default("PEN"),

		// SUNAT compliance fields
		status: varchar("status", { length: 20 }).notNull().default("PENDING"),
		declarationPeriod: varchar("declaration_period", { length: 7 }).notNull(), // 'YYYY-MM'
		sunatDueDate: date("sunat_due_date").notNull(), // Day 15 of following month
		pdtReference: varchar("pdt_reference", { length: 50 }),

		// Cancellation
		cancellationReason: text("cancellation_reason"),

		// Audit trail
		createdAt: timestamp("created_at").defaultNow().notNull(),
		declaredAt: timestamp("declared_at"),
		paidAt: timestamp("paid_at"),
		cancelledAt: timestamp("cancelled_at"),
	},
	(table) => ({
		// Fast lookup for pending obligations per company
		companyStatusIdx: index("retenciones_company_status_idx").on(
			table.companyId,
			table.status,
		),
		// PDT 626 totals by declaration period
		companyPeriodIdx: index("retenciones_company_period_idx").on(
			table.companyId,
			table.declarationPeriod,
		),
		// Cashflow projection JOIN with bills
		billIdx: index("retenciones_bill_idx").on(table.billId),
		// Overdue alerts (partial index: only PENDING/DECLARED rows)
		dueDateIdx: index("retenciones_due_date_idx").on(table.sunatDueDate),
	}),
);

/**
 * percepciones table — IGV perception records (DL N° 940).
 *
 * Stores each perception applied by an Agente de Percepción to a purchase bill.
 * Amounts stored as integers (cents pattern).
 * Rate varies by type: 2% (venta interna), 3.5% (importación), 1% (combustibles).
 *
 * Due date: always day 15 of the month following the transaction (SUNAT rule).
 *
 * @example
 * ```ts
 * const rows = await db.select().from(percepciones);
 * ```
 */
export const percepciones = pgTable(
	"percepciones",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),
		billId: uuid("bill_id").notNull(),

		// Agent identification
		agentRuc: varchar("agent_ruc", { length: 11 }).notNull(),

		// Percepción type (VENTA_INTERNA|IMPORTACION|COMBUSTIBLE)
		percepcionType: varchar("percepcion_type", { length: 20 }).notNull(),

		// Monetary amounts in cents (integer) — Money VO pattern
		totalAmountCents: integer("total_amount_cents").notNull(),
		percepcionAmountCents: integer("percepcion_amount_cents").notNull(),
		currency: varchar("currency", { length: 3 }).notNull().default("PEN"),

		// SUNAT compliance fields
		status: varchar("status", { length: 20 }).notNull().default("PENDING"),
		declarationPeriod: varchar("declaration_period", { length: 7 }).notNull(), // 'YYYY-MM'
		sunatDueDate: date("sunat_due_date").notNull(), // Day 15 of following month
		pdtReference: varchar("pdt_reference", { length: 50 }),

		// Cancellation
		cancellationReason: text("cancellation_reason"),

		// Audit trail
		createdAt: timestamp("created_at").defaultNow().notNull(),
		declaredAt: timestamp("declared_at"),
		paidAt: timestamp("paid_at"),
		cancelledAt: timestamp("cancelled_at"),
	},
	(table) => ({
		companyStatusIdx: index("percepciones_company_status_idx").on(
			table.companyId,
			table.status,
		),
		companyPeriodIdx: index("percepciones_company_period_idx").on(
			table.companyId,
			table.declarationPeriod,
		),
		billIdx: index("percepciones_bill_idx").on(table.billId),
		dueDateIdx: index("percepciones_due_date_idx").on(table.sunatDueDate),
	}),
);
