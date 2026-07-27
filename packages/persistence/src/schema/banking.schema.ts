/**
 * Banking Schema
 * Bank accounts, transactions, and reconciliations
 */

import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	integer,
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

	// Provider
	providerId: uuid("provider_id"),
	lastSyncAt: timestamp("last_sync_at"),

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

	// Source tracking
	source: varchar("source", { length: 20 }).default("MANUAL"), // MANUAL, CSV_IMPORT, API_FEED
	externalId: varchar("external_id", { length: 100 }),

	// Reconciliation
	isReconciled: boolean("is_reconciled").default(false),
	reconciledAt: timestamp("reconciled_at"),
	reconciledBy: uuid("reconciled_by"),

	// Linking
	invoiceId: uuid("invoice_id"),
	billId: uuid("bill_id"),
	paymentId: uuid("payment_id"),
	reconciliationBatchId: uuid("reconciliation_batch_id"),

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

	// Batch tracking (Phase 0)
	batchReference: varchar("batch_reference", { length: 50 }),
	mode: varchar("mode", { length: 10 }).default("MANUAL"), // MANUAL, AUTO
	matchedCount: integer("matched_count").default(0),
	unmatchedCount: integer("unmatched_count").default(0),
	discrepancyAmount: decimal("discrepancy_amount", { precision: 19, scale: 4 }),
	closedAt: timestamp("closed_at"),
	closedBy: uuid("closed_by"),

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
