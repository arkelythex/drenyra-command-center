/**
 * Domain Entities Index
 *
 * Core business entities following DDD principles.
 *
 * @example
 * import { Invoice, Account } from '@drenyra/domain/entities'
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
export type { TransactionSource } from "./BankTransaction";
export {
	ReconciliationBatch,
	type ReconciliationBatchProps,
	type ReconciliationBatchStatus,
	type ReconciliationMode,
} from "./ReconciliationBatch";
export {
	ReconciliationRule,
	type ReconciliationRuleConditions,
	type ReconciliationRuleProps,
	type ReconciliationRuleType,
} from "./ReconciliationRule";
export {
	CreditNote,
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
export type {
	AccountingDiffProps,
	DiffChange,
	DiffId,
	DiffImpact,
	DiffStatus,
	DiffType,
} from "./diff";
export { AccountingDiff, createDiffId } from "./diff";
// Evidence entity
export {
	Evidence,
	type EvidenceProps,
	type EvidenceSource,
	type EvidenceStatus,
	type EvidenceType,
} from "./evidence";
export {
	type FiscalStatus,
	Invoice,
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
export type {
	QueuePriority,
	QueueStatus,
	ReviewDecision,
	ReviewQueueItem,
} from "./review";
export type {
	InstallationStatus,
	SkillCapability,
	SkillCategory,
	SkillId,
	SkillInstallationProps,
	SkillProps,
	SkillStatus,
} from "./skill";
// Skill entities
export {
	createSkillId,
	INSTALLATION_STATUSES,
	SKILL_CATEGORIES,
	SKILL_CATEGORY_LABELS,
	SKILL_STATUSES,
	Skill,
	SkillInstallation,
	skillIdFromString,
} from "./skill";
export { Transaction, type TransactionProps } from "./Transaction";
// Thread entity
export {
	type AgentRole,
	assertThreadCanActivate,
	assertThreadCanSubmitForReview,
	assertThreadNotClosed,
	assertValidDate,
	assertValidThreadProps,
	assertValidTransition,
	type TaskStatus,
	Thread,
	type ThreadAgentAssignmentProps,
	type ThreadEnvironment,
	type ThreadPriority,
	type ThreadProps,
	type ThreadStatus,
	type ThreadTaskProps,
} from "./thread";
