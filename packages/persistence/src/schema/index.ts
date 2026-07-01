/**
 * Drizzle ORM schema barrel file.
 * Re-exports all schema modules for backward compatibility.
 *
 * Schema organization (by domain):
 * - enums.ts — All pgEnum definitions
 * - core.schema.ts — users, companies, sessions, accountingJobRuns
 * - banking-core.schema.ts — accounts, categories
 * - business-partners.schema.ts — businessPartners, vendorProfiles, customerProfiles
 * - transactions.schema.ts — transactions + relations
 * - products.schema.ts — products + relations
 * - invoicing.schema.ts — invoices, invoiceItems, bills, billItems, payments + relations
 * - chat.schema.ts — chatSessions, messages + relations
 * - telemetry.schema.ts — frontendTelemetryEvents
 * - auth.schema.ts — Better Auth tables (external file)
 * - banking.schema.ts — Extended banking tables (external file)
 * - banking-reconciliation-matches.schema.ts — Reconciliation matches (external file)
 * - documents.schema.ts — Documents (external file)
 * - economic-groups.schema.ts — Economic groups, firm models (external file)
 * - inventory.schema.ts — Inventory, warehouses (external file)
 * - sire.schema.ts — SIRE jobs, submissions (external file)
 * - taxation.schema.ts — Tax rules, retenciones (external file)
 * - agent-tasks.schema.ts — Agent tasks (external file)
 * - ai-worker-queues.schema.ts — AI worker queues (external file)
 * - auxiliary.schema.ts — AI cost events, anomaly alerts, SUNAT knowledge (external file)
 */

// --- ACCOUNTING ---
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
// --- AI AGENT RUN ---
export {
	type AgentRunEvent,
	type AgentRunState,
	agentRunEvents,
	agentRunStates,
	type NewAgentRunEvent,
	type NewAgentRunState,
} from "./agent-run.schema";
export {
	type AgentRunInput,
	agentRunInputs,
	type NewAgentRunInput,
} from "./agent-run-inputs.schema";
// --- EXTERNAL SCHEMA FILES ---
export {
	type AgentTask,
	agentTaskPriorityEnum,
	agentTaskStatusEnum,
	agentTasks,
	agentTasksRelations,
	type NewAgentTask,
} from "./agent-tasks.schema";
// --- AI CONTROL PLANE ---
export {
	type AiAgent,
	type AiTool,
	type AiToolPermission,
	type AiTraceEvidence,
	aiAgents,
	aiToolPermissions,
	aiTools,
	aiTraceEvidence,
	type NewAiAgent,
	type NewAiTool,
	type NewAiToolPermission,
	type NewAiTraceEvidence,
} from "./ai-control-plane.schema";
export {
	type AiLatencyEvent,
	aiLatencyEvents,
	type NewAiLatencyEvent,
} from "./ai-latency.schema";
export {
	type NewUserAISettings,
	type UserAISettings,
	userAISettings,
} from "./ai-settings.schema";
export type {
	AIWorkerTask,
	NewAIWorkerTask,
} from "./ai-worker-queues.schema";
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
	type AiCostEvent,
	type AnomalyAlert,
	aiCostEvents,
	alertStatusEnum,
	anomalyAlerts,
	anomalySeverityEnum,
	type NewAiCostEvent,
	type NewAnomalyAlert,
	type NewSunatKnowledgeChunk,
	type SunatKnowledgeChunk,
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
// --- BANKING CORE ---
export {
	accounts,
	categories,
} from "./banking-core.schema";
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
// --- AGENT BATCH RUNS ---
export {
	type BatchRun,
	type BatchRunItem,
	batchRunItems,
	batchRuns,
	type NewBatchRun,
	type NewBatchRunItem,
} from "./batch-run.schema";
// --- BUSINESS PARTNERS ---
export {
	businessPartners,
	customerProfiles,
	vendorProfiles,
} from "./business-partners.schema";
// --- CHAT ---
export {
	chatSessions,
	chatSessionsRelations,
	messages,
	messagesRelations,
} from "./chat.schema";
// --- CORE ---
export {
	accountingJobRuns,
	companies,
	organizationMetrics,
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
// --- ENUMS ---
export {
	accountingJobRunStatusEnum,
	currencyEnum,
	documentTypeEnum,
	invoiceStatusEnum,
	sunatStatusEnum,
	taxTypeEnum,
	transactionTypeEnum,
} from "./enums";
// Evidence Vault
export {
	evidence,
	evidenceAuditTrail,
	evidenceAuditTrailRelations,
	evidenceRelations,
	evidenceSourceEnum,
	evidenceStatusEnum,
	evidenceTypeEnum,
} from "./evidence.schema";
export {
	evidenceEdges,
	evidenceEdgesRelations,
	evidenceNodes,
	fiscalReplayCheckpoints,
	fiscalTruthEvents,
	fiscalTruthEventsRelations,
} from "./fiscal-truth.schema";
export {
	evidenceEdges,
	evidenceEdgesRelations,
	evidenceNodes,
	fiscalReplayCheckpoints,
	fiscalTruthEvents,
	fiscalTruthEventsRelations,
} from "./fiscal-truth.schema";
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
// --- INVOICING ---
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
// --- MODEL ROUTER ---
export {
	capabilityRoutingRules,
	modelRegistrations,
	routingAuditLog,
	routingAuditLogRelations,
} from "./model-router.schema";
export { platformMcpAuditEvents } from "./platform-mcp.schema";
// --- PRODUCTS ---
export {
	products,
	productsRelations,
} from "./products.schema";
// --- SECURITY ---
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
// --- TELEMETRY ---
export { frontendTelemetryEvents } from "./telemetry.schema";
// --- TRANSACTIONS ---
export {
	transactions,
	transactionsRelations,
} from "./transactions.schema";

// --- ALIASES (backward compatibility) ---
/** @deprecated Use `businessPartners` instead */
export const customers = businessPartners;
/** @deprecated Use `businessPartners` instead */
export const vendors = businessPartners;

// --- RELATIONS (core tables that reference each other) ---
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

// --- ERROR RECOVERY ---
export {
	type CircuitBreakerState,
	circuitBreakerStates,
	type FailedAgentItem,
	failedAgentItems,
	type NewCircuitBreakerState,
	type NewFailedAgentItem,
} from "./error-recovery.schema";

// --- FISCAL MEMORY ---
export {
	type FiscalMemoryRevisionRow,
	type FiscalMemoryRow,
	fiscalMemories,
	fiscalMemoryRevisions,
	type NewFiscalMemoryRevisionRow,
	type NewFiscalMemoryRow,
} from "./fiscal-memory.schema";
