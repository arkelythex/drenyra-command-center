/**
 * Banking Schema
 * Bank accounts, transactions, and reconciliations
 */

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

/**
 * Bank Accounts
 * @example
 * ```ts
 * console.log(bankAccounts);
 * ```
 */

export const bankAccounts = pgTable("bank_accounts", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),

	// Account details
	accountName: varchar("account_name", { length: 200 }).notNull(),
	accountNumber: varchar("account_number", { length: 50 }).notNull(),
	accountType: varchar("account_type", { length: 20 }).notNull(), // CHECKING, SAVINGS, CREDIT

	// Bank info
	bankName: varchar("bank_name", { length: 100 }).notNull(),
	bankCode: varchar("bank_code", { length: 10 }),
	branch: varchar("branch", { length: 100 }),

	// Balance
	currency: varchar("currency", { length: 3 }).notNull().default("PEN"),
	currentBalance: decimal("current_balance", { precision: 19, scale: 4 })
		.notNull()
		.default("0"),
	availableBalance: decimal("available_balance", { precision: 19, scale: 4 }),

	// Status
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),

	// Metadata
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Bank Transactions
 * @example
 * ```ts
 * console.log(bankTransactions);
 * ```
 */

export const bankTransactions = pgTable("bank_transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	accountId: uuid("account_id").notNull(),

	// Transaction details
	transactionDate: date("transaction_date").notNull(),
	description: text("description").notNull(),
	reference: varchar("reference", { length: 100 }),

	// Amounts
	type: varchar("type", { length: 10 }).notNull(), // DEBIT, CREDIT
	amount: decimal("amount", { precision: 19, scale: 4 }).notNull(),
	balance: decimal("balance", { precision: 19, scale: 4 }),

	// Categorization
	category: varchar("category", { length: 50 }),
	tags: text("tags"), // JSON array

	// Reconciliation
	isReconciled: boolean("is_reconciled").default(false),
	reconciledAt: timestamp("reconciled_at"),
	reconciledBy: uuid("reconciled_by"),

	// Linking
	invoiceId: uuid("invoice_id"),
	billId: uuid("bill_id"),
	paymentId: uuid("payment_id"),

	// Metadata
	createdAt: timestamp("created_at").defaultNow(),
	importedFrom: varchar("imported_from", { length: 50 }), // CSV, API, MANUAL
});

/**
 * Bank Reconciliations
 * @example
 * ```ts
 * console.log(bankReconciliations);
 * ```
 */

export const bankReconciliations = pgTable("bank_reconciliations", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: uuid("company_id").notNull(),
	accountId: uuid("account_id").notNull(),

	// Period
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),

	// Balances
	openingBalance: decimal("opening_balance", {
		precision: 19,
		scale: 4,
	}).notNull(),
	closingBalance: decimal("closing_balance", {
		precision: 19,
		scale: 4,
	}).notNull(),
	statementBalance: decimal("statement_balance", { precision: 19, scale: 4 }),

	// Reconciliation
	status: varchar("status", { length: 20 }).default("IN_PROGRESS"), // IN_PROGRESS, COMPLETED
	difference: decimal("difference", { precision: 19, scale: 4 }),
	notes: text("notes"),

	// Metadata
	createdAt: timestamp("created_at").defaultNow(),
	completedAt: timestamp("completed_at"),
	completedBy: uuid("completed_by"),
});

/**
 * Relations
 * @example
 * ```ts
 * console.log(bankAccountsRelations);
 * ```
 */

export const bankAccountsRelations = relations(bankAccounts, ({ many }) => ({
	transactions: many(bankTransactions),
	reconciliations: many(bankReconciliations),
}));

/**
 * bankTransactionsRelations const.
 *
 * @example
 * ```ts
 * console.log(bankTransactionsRelations);
 * ```
 */
export const bankTransactionsRelations = relations(
	bankTransactions,
	({ one }) => ({
		account: one(bankAccounts, {
			fields: [bankTransactions.accountId],
			references: [bankAccounts.id],
		}),
	}),
);

/**
 * bankReconciliationsRelations const.
 *
 * @example
 * ```ts
 * console.log(bankReconciliationsRelations);
 * ```
 */
export const bankReconciliationsRelations = relations(
	bankReconciliations,
	({ one }) => ({
		account: one(bankAccounts, {
			fields: [bankReconciliations.accountId],
			references: [bankAccounts.id],
		}),
	}),
);
