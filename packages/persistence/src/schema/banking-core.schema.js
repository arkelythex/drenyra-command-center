import {
	decimal,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { companies } from "./core.schema";
import { currencyEnum, transactionTypeEnum } from "./enums";
export const accounts = pgTable("accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id")
		.references(() => companies.id)
		.notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	type: varchar("type", { length: 50 }).notNull(),
	currency: currencyEnum("currency").notNull(),
	bankName: varchar("bank_name", { length: 100 }),
	accountNumber: varchar("account_number", { length: 50 }),
	currentBalance: decimal("current_balance", { precision: 12, scale: 2 })
		.default("0")
		.notNull(),
	lastRefreshed: timestamp("last_refreshed"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const categories = pgTable("categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id")
		.references(() => companies.id)
		.notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	type: transactionTypeEnum("type").notNull(),
	color: varchar("color", { length: 20 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

