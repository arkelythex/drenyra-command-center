import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	foreignKey,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
export const economicGroups = pgTable("economic_groups", {
	id: uuid("id").primaryKey().defaultRandom(),
	ownerId: uuid("owner_id").notNull(),
	groupName: varchar("group_name", { length: 255 }).notNull(),
	groupCode: varchar("group_code", { length: 50 }).notNull().unique(),
	subscriptionTier: varchar("subscription_tier", { length: 50 }).default(
		"PROFESSIONAL",
	),
	monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).default(
		"350.00",
	),
	maxCompanies: integer("max_companies").default(-1),
	defaultCurrency: varchar("default_currency", { length: 3 }).default("PEN"),
	timezone: varchar("timezone", { length: 50 }).default("America/Lima"),
	isActive: boolean("is_active").default(true),
	trialEndsAt: timestamp("trial_ends_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const firmModels = pgTable("firm_models", {
	id: uuid("id").primaryKey().defaultRandom(),
	economicGroupId: uuid("economic_group_id")
		.references(() => economicGroups.id)
		.notNull(),
	modelName: varchar("model_name", { length: 255 }).notNull(),
	modelType: varchar("model_type", { length: 50 }).notNull(),
	baseModel: varchar("base_model", { length: 100 }).default("gemini-2.0-flash"),
	temperature: decimal("temperature", { precision: 3, scale: 2 }).default(
		"0.10",
	),
	trainingExamples: text("training_examples").notNull(),
	accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
	lastTrainedAt: timestamp("last_trained_at"),
	customRules: text("custom_rules"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const firmModelLearnings = pgTable("firm_model_learnings", {
	id: uuid("id").primaryKey().defaultRandom(),
	firmModelId: uuid("firm_model_id")
		.references(() => firmModels.id)
		.notNull(),
	transactionId: uuid("transaction_id"),
	proposedClassification: text("proposed_classification").notNull(),
	actualClassification: text("actual_classification"),
	wasApproved: boolean("was_approved").default(false),
	correctionReason: text("correction_reason"),
	confidence: decimal("confidence", { precision: 5, scale: 2 }),
	processingTime: integer("processing_time"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const interCompanyTransactions = pgTable(
	"inter_company_transactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		economicGroupId: uuid("economic_group_id").notNull(),
		fromCompanyId: uuid("from_company_id").notNull(),
		fromTransactionId: uuid("from_transaction_id"),
		toCompanyId: uuid("to_company_id").notNull(),
		toTransactionId: uuid("to_transaction_id"),
		concept: varchar("concept", { length: 500 }).notNull(),
		amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
		currency: varchar("currency", { length: 3 }).default("PEN"),
		taxType: varchar("tax_type", { length: 50 }).default("GRAVADO"),
		igvAmount: decimal("igv_amount", { precision: 12, scale: 2 }),
		detractionAmount: decimal("detraction_amount", { precision: 12, scale: 2 }),
		detractionRate: decimal("detraction_rate", { precision: 5, scale: 2 }),
		detractionProfile: varchar("detraction_profile", { length: 30 }),
		detractionRuleCode: varchar("detraction_rule_code", { length: 80 }),
		status: varchar("status", { length: 50 }).default("PENDING"),
		reconciledAt: timestamp("reconciled_at"),
		spotPdfUrl: text("spot_pdf_url"),
		spotReferenceNumber: varchar("spot_reference_number", { length: 50 }),
		notes: text("notes"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		economicGroupFk: foreignKey({
			name: "ict_economic_group_fk",
			columns: [table.economicGroupId],
			foreignColumns: [economicGroups.id],
		}),
		groupProfileIdx: index("inter_company_transactions_group_profile_idx").on(
			table.economicGroupId,
			table.detractionProfile,
		),
		groupRuleIdx: index("inter_company_transactions_group_rule_idx").on(
			table.economicGroupId,
			table.detractionRuleCode,
		),
		groupCreatedAtIdx: index(
			"inter_company_transactions_group_created_at_idx",
		).on(table.economicGroupId, table.createdAt),
	}),
);
export const economicGroupsRelations = relations(
	economicGroups,
	({ many }) => ({
		firmModels: many(firmModels),
		interCompanyTransactions: many(interCompanyTransactions),
	}),
);
export const firmModelsRelations = relations(firmModels, ({ one, many }) => ({
	economicGroup: one(economicGroups, {
		fields: [firmModels.economicGroupId],
		references: [economicGroups.id],
	}),
	learnings: many(firmModelLearnings),
}));
export const firmModelLearningsRelations = relations(
	firmModelLearnings,
	({ one }) => ({
		firmModel: one(firmModels, {
			fields: [firmModelLearnings.firmModelId],
			references: [firmModels.id],
		}),
	}),
);
export const interCompanyTransactionsRelations = relations(
	interCompanyTransactions,
	({ one }) => ({
		economicGroup: one(economicGroups, {
			fields: [interCompanyTransactions.economicGroupId],
			references: [economicGroups.id],
		}),
	}),
);
//# sourceMappingURL=economic-groups.schema.js.map
