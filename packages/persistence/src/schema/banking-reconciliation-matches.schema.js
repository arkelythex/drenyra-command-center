import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgEnum,
	pgTable,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { bankTransactions } from "./banking.schema";
export const transactionReconciliationMatches = pgTable(
	"transaction_reconciliation_matches",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		transactionId: uuid("transaction_id").notNull(),
		documentId: uuid("document_id").notNull(),
		documentType: varchar("document_type", { length: 20 }).notNull(),
		matchScore: integer("match_score").notNull(),
		matchCriteria: varchar("match_criteria", { length: 50 }).notNull(),
		isPartial: boolean("is_partial").default(false),
		partialSequence: integer("partial_sequence"),
		isConfirmed: boolean("is_confirmed").default(false),
		confirmedAt: timestamp("confirmed_at"),
		confirmedBy: uuid("confirmed_by"),
		isRejected: boolean("is_rejected").default(false),
		rejectedAt: timestamp("rejected_at"),
		rejectedBy: uuid("rejected_by"),
		createdAt: timestamp("created_at").defaultNow(),
	},
);
export const partialPayments = pgTable("partial_payments", {
	id: uuid("id").primaryKey().defaultRandom(),
	invoiceId: uuid("invoice_id").notNull(),
	totalPaid: varchar("total_paid", { length: 30 }).notNull(),
	totalDue: varchar("total_due", { length: 30 }).notNull(),
	currency: varchar("currency", { length: 3 }).notNull().default("PEN"),
	status: varchar("status", { length: 20 }).notNull().default("PARTIAL"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
	completedAt: timestamp("completed_at"),
});
export const partialPaymentTransactions = pgTable(
	"partial_payment_transactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		partialPaymentId: uuid("partial_payment_id").notNull(),
		transactionId: uuid("transaction_id").notNull(),
		amount: varchar("amount", { length: 30 }).notNull(),
		sequence: integer("sequence").notNull(),
		createdAt: timestamp("created_at").defaultNow(),
	},
);
export const reconciliationShadowRunStatusEnum = pgEnum(
	"reconciliation_shadow_run_status",
	["SUCCESS", "FAILED"],
);
export const reconciliationShadowRuns = pgTable(
	"reconciliation_shadow_runs",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		companyId: uuid("company_id").notNull(),
		accountId: uuid("account_id").notNull(),
		status: reconciliationShadowRunStatusEnum("status").notNull(),
		localMatchedCount: integer("local_matched_count").notNull().default(0),
		goMatchedCount: integer("go_matched_count").notNull().default(0),
		discrepancyCount: integer("discrepancy_count").notNull().default(0),
		toleranceCents: integer("tolerance_cents").notNull().default(0),
		errorMessage: varchar("error_message", { length: 500 }),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at").defaultNow().notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => ({
		companyIdx: index("reconciliation_shadow_runs_company_idx").on(
			table.companyId,
		),
		companyCreatedIdx: index(
			"reconciliation_shadow_runs_company_created_idx",
		).on(table.companyId, table.createdAt),
	}),
);
export const transactionReconciliationMatchesRelations = relations(
	transactionReconciliationMatches,
	({ one }) => ({
		transaction: one(bankTransactions, {
			fields: [transactionReconciliationMatches.transactionId],
			references: [bankTransactions.id],
		}),
	}),
);
export const partialPaymentsRelations = relations(
	partialPayments,
	({ many }) => ({
		transactions: many(partialPaymentTransactions),
	}),
);
export const partialPaymentTransactionsRelations = relations(
	partialPaymentTransactions,
	({ one }) => ({
		partialPayment: one(partialPayments, {
			fields: [partialPaymentTransactions.partialPaymentId],
			references: [partialPayments.id],
		}),
		transaction: one(bankTransactions, {
			fields: [partialPaymentTransactions.transactionId],
			references: [bankTransactions.id],
		}),
	}),
);

