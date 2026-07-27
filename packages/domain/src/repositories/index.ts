/***
 * Domain Repository Interfaces Index
 *
 * Repository interfaces (ports) for dependency inversion.
 *
 * Import directly from specific files for full type access.
 */

export type { AccountRepository } from "./account.repository";
export type { AccountingPeriodRepository } from "./accounting-period.repository";
export type {
	AccountingPrFilters,
	AccountingPrRepository,
} from "./accounting-pr.repository";
export type { AISettingsRepository } from "./ai-settings.repository";
export type { BankAccountRepository } from "./bank-account.repository";
export type { BankReconciliationRepository } from "./bank-reconciliation.repository";
export type { BankTransactionRepository } from "./bank-transaction.repository";
export type { ReconciliationBatchRepository } from "./reconciliation-batch.repository";
export type { ReconciliationRuleRepository } from "./reconciliation-rule.repository";
export type { ClientRepository } from "./client.repository";
export type { CloseChecklistRepository } from "./close-checklist.repository";
export type {
	ControlTowerAuditEventFilters,
	ControlTowerRepository,
	ControlTowerScopeGuard,
} from "./control-tower.repository";
export type { CpeLogRepository } from "./cpe-log.repository";
export type { DetractionRepository } from "./detraction.repository";
export type { DocumentRepository } from "./document.repository";
export type { EvidenceRepository } from "./evidence.repository";
export type { ExchangeRateRepository } from "./exchange-rate.repository";
export type { FiscalMemoryRepository } from "./fiscal-memory.repository";
export type { InvoiceRepository } from "./invoice.repository";
export type { JournalEntryRepository } from "./journal-entry.repository";
// --- MODEL ROUTER ---
export type {
	CapabilityRoutingRuleRepository,
	CapabilityScoringParams,
	ModelFilters,
	ModelRegistrationRepository,
	RoutingAuditLogRepository,
} from "./model-registration.repository";
export type {
	OrganizationFilters,
	OrganizationRepository,
} from "./organization.repository";
export type { ProviderRepository } from "./provider.repository";
export type { TenantScopedRepository } from "./tenant-scoped.repository";
export type {
	PaginatedResult,
	PaginationOptions,
	TransactionRepository,
} from "./transaction.repository";
