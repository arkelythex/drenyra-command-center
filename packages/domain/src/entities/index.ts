/**
 * Domain Entities Index
 *
 * Core business entities following DDD principles.
 *
 * @example
 * import { Invoice, Account, FiscalCase } from '@arkelythex/domain/entities'
 */

// Export main entity classes
export { Account, type AccountProps, type AccountType } from "./Account";
export { AISettings, type AISettingsProps } from "./AISettings";
export {
	BankAccount,
	type BankAccountProps,
	type BankAccountType,
} from "./BankAccount";
export {
	BankReconciliation,
	type BankReconciliationProps,
	type ReconciliationStatus,
} from "./BankReconciliation";
export { BankTransaction, type BankTransactionProps } from "./BankTransaction";
export {
	CreditNote,
	type CreditNotePrimitiveData,
	type CreditNoteProps,
	type CreditNoteStatus,
	type CreditNoteType,
} from "./CreditNote";
export type {
	CaseIdentity,
	CaseProjection,
	CaseRepository,
	CaseStatus,
	ClinicalProjection,
	CrossDomainQuery,
	CrossDomainResponse,
	DomainKey,
	FiscalProjection,
	LegalProjection,
	ProjectionMetadata,
} from "./case";
// Case entity — Multi-domain collaboration
export {
	Case,
	CaseCrossDomainQuery,
	CaseId,
	CaseProjectionAttached,
	CaseProjectionUpdated,
} from "./case";
export type {
	AgentRunPrimitiveData,
	AgentRunProps,
	ApprovalRequestPrimitiveData,
	ApprovalRequestProps,
	AuditEventPrimitiveData,
	AuditEventProps,
	EvidenceItemPrimitiveData,
	EvidenceItemProps,
	FiscalCasePrimitiveData,
	FiscalCaseProps,
} from "./control-tower";
// Control Tower entities
export {
	AgentRun,
	ApprovalRequest,
	AuditEvent,
	EvidenceItem,
	FiscalCase,
} from "./control-tower";
export {
	DebitNote,
	type DebitNotePrimitiveData,
	type DebitNoteProps,
	type DebitNoteStatus,
} from "./DebitNote";
export { Document, type DocumentProps } from "./Document";
export { Invoice, type InvoiceProps, type InvoiceStatus } from "./Invoice";
export {
	JournalEntry,
	type JournalEntryProps,
	type JournalEntryStatus,
} from "./JournalEntry";
export {
	type CompanySummaryDTO,
	type FirmAlertDTO,
	type FirmDashboardDTO,
	type FirmMetrics,
	Organization,
	type OrganizationPrimitiveData,
	type OrganizationProps,
	type OrganizationSettings,
	type OrganizationStatus,
} from "./organization";
export { Transaction, type TransactionProps } from "./Transaction";
