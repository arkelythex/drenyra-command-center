export {
	accountingPeriods,
	accountingPeriodsRelations,
	cpeLog,
	cpeLogRelations,
	detractions,
	detractionsRelations,
	exchangeRates,
	exchangeRatesRelations,
	journalEntries,
	journalEntriesRelations,
	journalEntryLines,
	journalEntryLinesRelations,
	pcgeAccounts,
	pcgeAccountsRelations,
} from "./accounting.schema";
export { agentRunEvents, agentRunStates } from "./agent-run.schema";
export {
	agentTaskPriorityEnum,
	agentTaskStatusEnum,
	agentTasks,
	agentTasksRelations,
} from "./agent-tasks.schema";
export { aiAgents, aiTools, aiTraceEvidence } from "./ai-control-plane.schema";
export { userAISettings } from "./ai-settings.schema";
export {
	aiWorkerQueues,
	aiWorkerQueuesRelations,
	workerTaskPriorityEnum,
	workerTaskStatusEnum,
} from "./ai-worker-queues.schema";
export {
	authAccounts,
	authAccountsRelations,
	authAuditLogs,
	authAuditLogsRelations,
	authSessions,
	authSessionsRelations,
	authUserCompanies,
	authUserCompaniesRelations,
	authUsers,
	authUsersRelations,
	authVerifications,
} from "./auth.schema";
export {
	aiCostEvents,
	alertStatusEnum,
	anomalyAlerts,
	anomalySeverityEnum,
	sunatKnowledgeChunks,
} from "./auxiliary.schema";
export {
	bankAccounts,
	bankAccountsRelations,
	bankReconciliations,
	bankReconciliationsRelations,
	bankTransactions,
	bankTransactionsRelations,
} from "./banking.schema";
export { accounts, categories } from "./banking-core.schema";
export {
	partialPayments,
	partialPaymentsRelations,
	partialPaymentTransactions,
	partialPaymentTransactionsRelations,
	reconciliationShadowRunStatusEnum,
	reconciliationShadowRuns,
	transactionReconciliationMatches,
	transactionReconciliationMatchesRelations,
} from "./banking-reconciliation-matches.schema";
export {
	businessPartners,
	customerProfiles,
	vendorProfiles,
} from "./business-partners.schema";
export {
	chatSessions,
	chatSessionsRelations,
	messages,
	messagesRelations,
} from "./chat.schema";
export {
	accountingJobRuns,
	companies,
	organizations,
	sessions,
	users,
} from "./core.schema";
export { documents } from "./documents.schema";
export {
	drenyraAgentRuns,
	drenyraApprovalRequests,
	drenyraAuditEvents,
	drenyraEvidenceItems,
	drenyraFiscalCases,
} from "./drenyra-command-center.schema";
export {
	economicGroups,
	economicGroupsRelations,
	firmModelLearnings,
	firmModelLearningsRelations,
	firmModels,
	firmModelsRelations,
	interCompanyTransactions,
	interCompanyTransactionsRelations,
} from "./economic-groups.schema";
export {
	accountingJobRunStatusEnum,
	currencyEnum,
	documentTypeEnum,
	invoiceStatusEnum,
	sunatStatusEnum,
	taxTypeEnum,
	transactionTypeEnum,
} from "./enums";
export {
	evidenceEdges,
	evidenceEdgesRelations,
	evidenceNodes,
	fiscalReplayCheckpoints,
	fiscalTruthEvents,
	fiscalTruthEventsRelations,
} from "./fiscal-truth.schema";
export {
	inventory,
	inventoryMovements,
	inventoryMovementsRelations,
	inventoryRelations,
	warehouses,
} from "./inventory.schema";
export {
	billItems,
	billItemsRelations,
	bills,
	billsRelations,
	invoiceItems,
	invoiceItemsRelations,
	invoices,
	invoicesRelations,
	payments,
	paymentsRelations,
} from "./invoicing.schema";
export { platformMcpAuditEvents } from "./platform-mcp.schema";
export { products, productsRelations } from "./products.schema";
export {
	accessLogs,
	failedLoginAttempts,
	promptGuardAudit,
} from "./security.schema";
export {
	sireJobs,
	sireJobsRelations,
	sireRateLimits,
	sireSubmissions,
	sireSubmissionsRelations,
} from "./sire.schema";
export {
	percepciones,
	retenciones,
	taxRules,
	taxRulesRelations,
	taxRuleVersions,
	taxRuleVersionsRelations,
} from "./taxation.schema";
export { frontendTelemetryEvents } from "./telemetry.schema";
export { transactions, transactionsRelations } from "./transactions.schema";
export const customers = businessPartners;
export const vendors = businessPartners;

import { relations } from "drizzle-orm";
import { accounts, categories } from "./banking-core.schema";
import {
	businessPartners,
	customerProfiles,
	vendorProfiles,
} from "./business-partners.schema";
import { chatSessions } from "./chat.schema";
import { companies, sessions, users } from "./core.schema";
import { bills, invoices } from "./invoicing.schema";
import { products } from "./products.schema";
import { transactions } from "./transactions.schema";
export const usersRelations = relations(users, ({ many }) => ({
	companies: many(companies),
	authSessions: many(sessions),
	chatSessions: many(chatSessions),
}));
export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));
export const companiesRelations = relations(companies, ({ one, many }) => ({
	owner: one(users, { fields: [companies.ownerId], references: [users.id] }),
	accounts: many(accounts),
	categories: many(categories),
	partners: many(businessPartners),
	transactions: many(transactions),
	products: many(products),
	invoices: many(invoices),
}));
export const accountsRelations = relations(accounts, ({ one, many }) => ({
	company: one(companies, {
		fields: [accounts.companyId],
		references: [companies.id],
	}),
	transactions: many(transactions),
}));
export const categoriesRelations = relations(categories, ({ one, many }) => ({
	company: one(companies, {
		fields: [categories.companyId],
		references: [companies.id],
	}),
	transactions: many(transactions),
}));
export const businessPartnersRelations = relations(
	businessPartners,
	({ one, many }) => ({
		company: one(companies, {
			fields: [businessPartners.companyId],
			references: [companies.id],
		}),
		transactions: many(transactions),
		invoices: many(invoices),
		bills: many(bills),
		vendorProfile: one(vendorProfiles, {
			fields: [businessPartners.id],
			references: [vendorProfiles.id],
		}),
		customerProfile: one(customerProfiles, {
			fields: [businessPartners.id],
			references: [customerProfiles.id],
		}),
	}),
);
export const vendorProfilesRelations = relations(vendorProfiles, ({ one }) => ({
	vendor: one(businessPartners, {
		fields: [vendorProfiles.id],
		references: [businessPartners.id],
	}),
}));
export const customerProfilesRelations = relations(
	customerProfiles,
	({ one }) => ({
		customer: one(businessPartners, {
			fields: [customerProfiles.id],
			references: [businessPartners.id],
		}),
	}),
);
export { fiscalMemories, fiscalMemoryRevisions } from "./fiscal-memory.schema";
//# sourceMappingURL=index.js.map
