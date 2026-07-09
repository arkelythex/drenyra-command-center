import { relations } from "drizzle-orm";
import {
	boolean,
	decimal,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { accounts, categories } from "./banking-core.schema";
import { businessPartners } from "./business-partners.schema";
import { companies } from "./core.schema";
import {
	currencyEnum,
	documentTypeEnum,
	sunatStatusEnum,
	transactionTypeEnum,
} from "./enums";
export const transactions = pgTable("transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id")
		.references(() => companies.id)
		.notNull(),
	partnerId: uuid("partner_id").references(() => businessPartners.id),
	accountId: uuid("account_id").references(() => accounts.id),
	categoryId: uuid("category_id").references(() => categories.id),
	type: transactionTypeEnum("type").notNull(),
	documentType: documentTypeEnum("document_type").notNull(),
	series: varchar("series", { length: 10 }),
	number: varchar("number", { length: 20 }),
	issueDate: timestamp("issue_date").notNull(),
	dueDate: timestamp("due_date"),
	currency: currencyEnum("currency").default("PEN").notNull(),
	exchangeRate: decimal("exchange_rate", { precision: 10, scale: 3 })
		.default("1.000")
		.notNull(),
	subtotal: decimal("subtotal", { precision: 12, scale: 2 })
		.default("0")
		.notNull(),
	igvAmount: decimal("igv_amount", { precision: 12, scale: 2 })
		.default("0")
		.notNull(),
	totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
		.default("0")
		.notNull(),
	isDetraction: boolean("is_detraction").default(false),
	detractionAmount: decimal("detraction_amount", { precision: 12, scale: 2 }),
	status: sunatStatusEnum("status").default("DRAFT"),
	notes: text("notes"),
	tags: jsonb("tags"),
	xmlUrl: text("xml_url"),
	cdrUrl: text("cdr_url"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const transactionsRelations = relations(transactions, ({ one }) => ({
	company: one(companies, {
		fields: [transactions.companyId],
		references: [companies.id],
	}),
	partner: one(businessPartners, {
		fields: [transactions.partnerId],
		references: [businessPartners.id],
	}),
	account: one(accounts, {
		fields: [transactions.accountId],
		references: [accounts.id],
	}),
	category: one(categories, {
		fields: [transactions.categoryId],
		references: [categories.id],
	}),
}));
