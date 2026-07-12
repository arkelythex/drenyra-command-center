import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
export const bankAccounts = pgTable("bank_accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	accountName: varchar("account_name", { length: 200 }).notNull(),
	accountNumber: varchar("account_number", { length: 50 }).notNull(),
	accountType: varchar("account_type", { length: 20 }).notNull(),
	bankName: varchar("bank_name", { length: 100 }).notNull(),
	bankCode: varchar("bank_code", { length: 10 }),
	branch: varchar("branch", { length: 100 }),
	currency: varchar("currency", { length: 3 }).notNull().default("PEN"),
	currentBalance: decimal("current_balance", { precision: 19, scale: 4 })
		.notNull()
		.default("0"),
	availableBalance: decimal("available_balance", { precision: 19, scale: 4 }),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});
export const bankTransactions = pgTable("bank_transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	accountId: uuid("account_id").notNull(),
	transactionDate: date("transaction_date").notNull(),
	description: text("description").notNull(),
	reference: varchar("reference", { length: 100 }),
	type: varchar("type", { length: 10 }).notNull(),
	amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
	balance: decimal("balance", { precision: 19, scale: 4 }),
	category: varchar("category", { length: 50 }),
	tags: text("tags"),
	isReconciled: boolean("is_reconciled").default(false),
	reconciledAt: timestamp("reconciled_at"),
	reconciledBy: uuid("reconciled_by"),
	invoiceId: uuid("invoice_id"),
	billId: uuid("bill_id"),
	paymentId: uuid("payment_id"),
	createdAt: timestamp("created_at").defaultNow(),
	importedFrom: varchar("imported_from", { length: 50 }),
});
export const bankReconciliations = pgTable("bank_reconciliations", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	accountId: uuid("account_id").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	openingBalance: decimal("opening_balance", {
		precision: 19,
		scale: 4,
	}).notNull(),
	closingBalance: decimal("closing_balance", {
		precision: 19,
		scale: 4,
	}).notNull(),
	statementBalance: decimal("statement_balance", { precision: 19, scale: 4 }),
	status: varchar("status", { length: 20 }).default("IN_PROGRESS"),
	difference: decimal("difference", { precision: 19, scale: 4 }),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow(),
	completedAt: timestamp("completed_at"),
	completedBy: uuid("completed_by"),
});
export const bankAccountsRelations = relations(bankAccounts, ({ many }) => ({
	transactions: many(bankTransactions),
	reconciliations: many(bankReconciliations),
}));
export const bankTransactionsRelations = relations(
	bankTransactions,
	({ one }) => ({
		account: one(bankAccounts, {
			fields: [bankTransactions.accountId],
			references: [bankAccounts.id],
		}),
	}),
);
export const bankReconciliationsRelations = relations(
	bankReconciliations,
	({ one }) => ({
		account: one(bankAccounts, {
			fields: [bankReconciliations.accountId],
			references: [bankAccounts.id],
		}),
	}),
);
