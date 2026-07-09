import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";
export const pcgeAccounts = pgTable(
	"pcge_accounts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		code: varchar("code", { length: 20 }).notNull(),
		name: varchar("name", { length: 255 }).notNull(),
		level: varchar("level", { length: 1 }).notNull(),
		type: varchar("type", { length: 50 }).$type().notNull(),
		parentId: uuid("parent_id"),
		isActive: varchar("is_active", { length: 1 })
			.$type()
			.default("S")
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyCodeIdx: index("pcge_company_code_idx").on(
			table.companyId,
			table.code,
		),
		parentIdx: index("pcge_parent_idx").on(table.parentId),
		levelIdx: index("pcge_level_idx").on(table.level),
	}),
);
export const accountingPeriods = pgTable(
	"accounting_periods",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		year: integer("year").notNull(),
		month: integer("month").notNull(),
		status: varchar("status", { length: 20 })
			.$type()
			.default("abierto")
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodIdx: index("accounting_periods_company_period_idx").on(
			table.companyId,
			table.year,
			table.month,
		),
		statusIdx: index("accounting_periods_status_idx").on(table.status),
	}),
);
export const exchangeRates = pgTable(
	"exchange_rates",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		date: timestamp("date").notNull(),
		currencyFrom: varchar("currency_from", { length: 3 }).notNull(),
		currencyTo: varchar("currency_to", { length: 3 }).notNull(),
		buyRate: integer("buy_rate").notNull(),
		sellRate: integer("sell_rate").notNull(),
		sunatReference: integer("sunat_reference"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		companyCurrencyIdx: index("exchange_rates_company_currency_idx").on(
			table.companyId,
			table.currencyFrom,
			table.currencyTo,
		),
		dateIdx: index("exchange_rates_date_idx").on(table.date),
	}),
);
export const cpeLog = pgTable(
	"cpe_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		invoiceId: uuid("invoice_id").notNull(),
		sunatStatus: varchar("sunat_status", { length: 20 })
			.$type()
			.default("pendiente")
			.notNull(),
		submittedAt: timestamp("submitted_at"),
		acceptedAt: timestamp("accepted_at"),
		rejectedAt: timestamp("rejected_at"),
		observedAt: timestamp("observed_at"),
		cancelledAt: timestamp("cancelled_at"),
		sunatTicket: varchar("sunat_ticket", { length: 255 }),
		cdrData: jsonb("cdr_data").$type(),
		hashValue: varchar("hash_value", { length: 128 }),
		hashAlgorithm: varchar("hash_algorithm", { length: 50 }).default("SHA-256"),
		errorMessage: text("error_message"),
		errorCode: varchar("error_code", { length: 50 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		companyInvoiceStatusIdx: index("cpe_log_company_invoice_status_idx").on(
			table.companyId,
			table.invoiceId,
			table.sunatStatus,
		),
		statusIdx: index("cpe_log_status_idx").on(table.sunatStatus),
	}),
);
export const detractions = pgTable(
	"detractions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		spotCode: varchar("spot_code", { length: 3 }).notNull(),
		percentage: integer("percentage").notNull(),
		amountCents: integer("amount_cents").notNull(),
		reference: varchar("reference", { length: 255 }).notNull(),
		status: varchar("status", { length: 20 })
			.$type()
			.default("pendiente")
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyStatusIdx: index("detractions_company_status_idx").on(
			table.companyId,
			table.status,
		),
		spotCodeIdx: index("detractions_spot_code_idx").on(table.spotCode),
	}),
);
export const journalEntries = pgTable(
	"journal_entries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id")
			.references(() => companies.id)
			.notNull(),
		entryNumber: varchar("entry_number", { length: 50 }).notNull(),
		periodKey: varchar("period_key", { length: 7 }).notNull(),
		date: timestamp("date").notNull(),
		gloss: text("gloss").notNull(),
		status: varchar("status", { length: 20 })
			.$type()
			.default("borrador")
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		companyPeriodIdx: index("journal_entries_company_period_idx").on(
			table.companyId,
			table.periodKey,
		),
		entryNumberIdx: index("journal_entries_entry_number_idx").on(
			table.entryNumber,
		),
		statusIdx: index("journal_entries_status_idx").on(table.status),
	}),
);
export const journalEntryLines = pgTable(
	"journal_entry_lines",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		journalEntryId: uuid("journal_entry_id")
			.references(() => journalEntries.id, { onDelete: "cascade" })
			.notNull(),
		accountCode: varchar("account_code", { length: 20 }).notNull(),
		description: text("description").notNull(),
		debitCents: integer("debit_cents").default(0).notNull(),
		creditCents: integer("credit_cents").default(0).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		entryIdx: index("journal_entry_lines_entry_idx").on(table.journalEntryId),
		accountIdx: index("journal_entry_lines_account_idx").on(table.accountCode),
	}),
);
export const pcgeAccountsRelations = relations(
	pcgeAccounts,
	({ one, many }) => ({
		company: one(companies, {
			fields: [pcgeAccounts.companyId],
			references: [companies.id],
		}),
		children: many(pcgeAccounts, { relationName: "pcgeParentChildren" }),
		parent: one(pcgeAccounts, {
			fields: [pcgeAccounts.parentId],
			references: [pcgeAccounts.id],
			relationName: "pcgeParentChildren",
		}),
	}),
);
export const accountingPeriodsRelations = relations(
	accountingPeriods,
	({ one }) => ({
		company: one(companies, {
			fields: [accountingPeriods.companyId],
			references: [companies.id],
		}),
	}),
);
export const exchangeRatesRelations = relations(exchangeRates, ({ one }) => ({
	company: one(companies, {
		fields: [exchangeRates.companyId],
		references: [companies.id],
	}),
}));
export const cpeLogRelations = relations(cpeLog, ({ one }) => ({
	company: one(companies, {
		fields: [cpeLog.companyId],
		references: [companies.id],
	}),
}));
export const detractionsRelations = relations(detractions, ({ one }) => ({
	company: one(companies, {
		fields: [detractions.companyId],
		references: [companies.id],
	}),
}));
export const journalEntriesRelations = relations(
	journalEntries,
	({ one, many }) => ({
		company: one(companies, {
			fields: [journalEntries.companyId],
			references: [companies.id],
		}),
		lines: many(journalEntryLines),
	}),
);
export const journalEntryLinesRelations = relations(
	journalEntryLines,
	({ one }) => ({
		journalEntry: one(journalEntries, {
			fields: [journalEntryLines.journalEntryId],
			references: [journalEntries.id],
		}),
	}),
);
