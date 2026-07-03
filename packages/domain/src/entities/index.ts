/**
 * Domain Entities Index
 *
 * Core business entities following DDD principles.
 *
 * @example
 * import { Invoice, Account } from '@arkelythex/domain/entities'
 */

// Export main entity classes
export { Account, type AccountProps, type AccountType } from "./Account";
export { AISettings, type AISettingsProps } from "./AISettings";
export {
	AccountingPr,
	type AccountingPrProps,
	type AccountingPrStatus,
	type PrSignature,
} from "./accounting-pr";
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
// Evidence entity
export {
	Evidence,
	type EvidenceProps,
	type EvidenceSource,
	type EvidenceStatus,
	type EvidenceType,
} from "./evidence";
export {
	Invoice,
	type FiscalStatus,
	type InvoiceProps,
	type InvoiceStatus,
} from "./Invoice";
export {
	JournalEntry,
	type JournalEntryProps,
	type JournalEntryStatus,
} from "./JournalEntry";
// Judgment Day — adversarial audit types
export type {
	AuditFinding,
	AuditFindingProps,
	AuditReview,
	AuditReviewProps,
	AuditReviewStatus,
	AuditRule,
	AuditRuleProps,
	AuditTargetType,
	FindingCategory,
	FindingSeverity,
	FindingStatus,
	JudgmentDayDashboard,
	JudgmentDayResult,
	RiskScoreInput,
} from "./judgment-day";
// Organization (firm) entity
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
