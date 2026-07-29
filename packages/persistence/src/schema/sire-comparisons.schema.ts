import {
	jsonb,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * Persisted SIRE three-way comparison artifacts by company and tax period.
 */
export const sireComparisons = pgTable(
	"sire_comparisons",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),
		period: varchar("period", { length: 7 }).notNull(),
		rows: jsonb("rows").$type<unknown[]>().notNull(),
		summary: jsonb("summary").$type<unknown>().notNull(),
		generatedAt: timestamp("generated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodUnique: unique("sire_comparisons_company_period_unique").on(
			table.companyId,
			table.period,
		),
	}),
);

/**
 * Accountant resolution state for a discrepancy in a persisted SIRE comparison.
 */
export const sireDiscrepancyResolutions = pgTable(
	"sire_discrepancy_resolutions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),
		period: varchar("period", { length: 7 }).notNull(),
		discrepancyId: varchar("discrepancy_id", { length: 255 }).notNull(),
		status: varchar("status", { length: 20 }).notNull(),
		notes: text("notes"),
		resolutionData: jsonb("resolution_data").$type<unknown>().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodDiscrepancyUnique: unique(
			"sire_discrepancy_resolutions_company_period_discrepancy_unique",
		).on(table.companyId, table.period, table.discrepancyId),
	}),
);
