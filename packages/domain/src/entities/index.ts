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
export { Document, type DocumentProps } from "./Document";
export { Invoice, type InvoiceProps, type InvoiceStatus } from "./Invoice";
export {
	JournalEntry,
	type JournalEntryProps,
	type JournalEntryStatus,
} from "./JournalEntry";
export { Transaction, type TransactionProps } from "./Transaction";
export { CreditNote, type CreditNoteProps, type CreditNoteStatus, type CreditNoteType, type CreditNotePrimitiveData } from "./CreditNote";
export { DebitNote, type DebitNoteProps, type DebitNoteStatus, type DebitNotePrimitiveData } from "./DebitNote";

// Case entity — Multi-domain collaboration
export {
  Case,
  CaseId,
  CaseProjectionAttached,
  CaseProjectionUpdated,
  CaseCrossDomainQuery,
} from "./case";
export type {
  CaseIdentity,
  CaseStatus,
  DomainKey,
  CaseProjection,
  ProjectionMetadata,
  FiscalProjection,
  LegalProjection,
  ClinicalProjection,
  CaseRepository,
  CrossDomainQuery,
  CrossDomainResponse,
} from "./case";
