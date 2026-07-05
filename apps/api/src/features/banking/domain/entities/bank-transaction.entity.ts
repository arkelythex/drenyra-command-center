/**
 * Bank Transaction Entity
 * Rich domain model for bank transaction management with reconciliation logic
 *
 * @example
 * ```ts
 * const tx = BankTransaction.create(
 *   {
 *     id: 'tx_123',
 *     companyId: 'cmp_123',
 *     accountId: 'acc_123',
 *     transactionDate: new Date(),
 *     description: 'Pago factura',
 *     type: 'DEBIT',
 *     amount: '150.00',
 *     isReconciled: false,
 *     importedFrom: 'MANUAL',
 *     createdAt: new Date(),
 *   } as BankTransactionProps,
 *   'PEN'
 * );
 * ```
 */

import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
import type {
	BankTransactionProps,
	DocumentType,
	ImportSource,
	TransactionType,
} from "../types";
import type { MatchScore } from "../value-objects/match-score.vo";
import { TransactionReference } from "../value-objects/transaction-reference.vo";

/**
 * Bank transaction aggregate root for the Banking domain.
 *
 * @example
 * ```ts
 * const tx = BankTransaction.create({ id: 'tx_123' } as BankTransactionProps, 'PEN');
 * ```
 */
export class BankTransaction {
	private readonly _isReconciled: boolean;
	private readonly _reconciledAt: Date | undefined;
	private readonly _reconciledBy: string | undefined;
	private readonly _invoiceId: string | undefined;
	private readonly _billId: string | undefined;
	private readonly _matchScore: MatchScore | undefined;

	private constructor(
		public readonly id: string,
		public readonly companyId: string,
		public readonly accountId: string,
		public readonly transactionDate: Date,
		public readonly description: string,
		private readonly _reference: TransactionReference | undefined,
		public readonly type: TransactionType,
		private readonly _amount: Money,
		private readonly _balance: Money | undefined,
		public readonly category: string | undefined,
		public readonly tags: string[],
		isReconciled: boolean,
		reconciledAt: Date | undefined,
		reconciledBy: string | undefined,
		invoiceId: string | undefined,
		billId: string | undefined,
		public readonly importedFrom: ImportSource,
		public readonly createdAt: Date,
		matchScore?: MatchScore,
	) {
		this._isReconciled = isReconciled;
		this._reconciledAt = reconciledAt;
		this._reconciledBy = reconciledBy;
		this._invoiceId = invoiceId;
		this._billId = billId;
		this._matchScore = matchScore;
	}

	static create(
		props: BankTransactionProps,
		currency: Currency,
	): BankTransaction {
		const reference = props.reference
			? TransactionReference.create(props.reference)
			: undefined;

		const amount = Money.fromAmount(parseFloat(props.amount), currency);
		const balance = props.balance
			? Money.fromAmount(parseFloat(props.balance), currency)
			: undefined;

		return new BankTransaction(
			props.id,
			props.companyId,
			props.accountId,
			props.transactionDate,
			props.description,
			reference,
			props.type,
			amount,
			balance,
			props.category,
			props.tags ?? [],
			props.isReconciled,
			props.reconciledAt,
			props.reconciledBy,
			props.invoiceId,
			props.billId,
			props.importedFrom,
			props.createdAt,
		);
	}

	get amount(): Money {
		return this._amount;
	}

	get balance(): Money | undefined {
		return this._balance;
	}

	get reference(): string | undefined {
		return this._reference?.getValue();
	}

	get normalizedReference(): string | undefined {
		return this._reference?.getNormalized();
	}

	get isReconciled(): boolean {
		return this._isReconciled;
	}

	get reconciledAt(): Date | undefined {
		return this._reconciledAt;
	}

	get reconciledBy(): string | undefined {
		return this._reconciledBy;
	}

	get invoiceId(): string | undefined {
		return this._invoiceId;
	}

	get billId(): string | undefined {
		return this._billId;
	}

	get linkedDocumentId(): string | undefined {
		return this._invoiceId ?? this._billId;
	}

	get linkedDocumentType(): DocumentType | undefined {
		if (this._invoiceId) return "INVOICE";
		if (this._billId) return "BILL";
		return undefined;
	}

	get matchScore(): MatchScore | undefined {
		return this._matchScore;
	}

	hasReference(): boolean {
		return this._reference !== undefined;
	}

	isCredit(): boolean {
		return this.type === "CREDIT";
	}

	isDebit(): boolean {
		return this.type === "DEBIT";
	}

	isPending(): boolean {
		return !this._isReconciled;
	}

	matchesReference(documentNumber: string): boolean {
		if (!this._reference) return false;

		const docRef = TransactionReference.create(documentNumber);
		return this._reference.matches(docRef);
	}

	matchesAmount(documentAmount: Money): boolean {
		return this._amount.equals(documentAmount);
	}

	descriptionContains(text: string): boolean {
		return this.description.toUpperCase().includes(text.toUpperCase());
	}

	/**
	 * Returns a new reconciled instance. Does NOT mutate the current transaction.
	 *
	 * @example
	 * ```ts
	 * const reconciled = tx.reconcile('user_123');
	 * ```
	 */
	reconcile(userId: string): BankTransaction {
		if (this._isReconciled) {
			throw new Error("Transaction is already reconciled");
		}

		return new BankTransaction(
			this.id,
			this.companyId,
			this.accountId,
			this.transactionDate,
			this.description,
			this._reference,
			this.type,
			this._amount,
			this._balance,
			this.category,
			this.tags,
			true,
			new Date(),
			userId,
			this._invoiceId,
			this._billId,
			this.importedFrom,
			this.createdAt,
			this._matchScore,
		);
	}

	/**
	 * Returns a new instance linked to an invoice. Does NOT mutate.
	 *
	 * @example
	 * ```ts
	 * const linked = tx.linkToInvoice('inv_123', matchScore);
	 * ```
	 */
	linkToInvoice(invoiceId: string, matchScore: MatchScore): BankTransaction {
		if (this.type !== "CREDIT") {
			throw new Error("Only CREDIT transactions can be linked to invoices");
		}

		return new BankTransaction(
			this.id,
			this.companyId,
			this.accountId,
			this.transactionDate,
			this.description,
			this._reference,
			this.type,
			this._amount,
			this._balance,
			this.category,
			this.tags,
			this._isReconciled,
			this._reconciledAt,
			this._reconciledBy,
			invoiceId,
			this._billId,
			this.importedFrom,
			this.createdAt,
			matchScore,
		);
	}

	/**
	 * Returns a new instance linked to a bill. Does NOT mutate.
	 *
	 * @example
	 * ```ts
	 * const linked = tx.linkToBill('bill_123', matchScore);
	 * ```
	 */
	linkToBill(billId: string, matchScore: MatchScore): BankTransaction {
		if (this.type !== "DEBIT") {
			throw new Error("Only DEBIT transactions can be linked to bills");
		}

		return new BankTransaction(
			this.id,
			this.companyId,
			this.accountId,
			this.transactionDate,
			this.description,
			this._reference,
			this.type,
			this._amount,
			this._balance,
			this.category,
			this.tags,
			this._isReconciled,
			this._reconciledAt,
			this._reconciledBy,
			this._invoiceId,
			billId,
			this.importedFrom,
			this.createdAt,
			matchScore,
		);
	}

	/**
	 * Returns a new instance linked to either an invoice or a bill.
	 *
	 * @example
	 * ```ts
	 * const linked = tx.linkToDocument('doc_123', 'INVOICE', matchScore);
	 * ```
	 */
	linkToDocument(
		documentId: string,
		documentType: DocumentType,
		matchScore: MatchScore,
	): BankTransaction {
		if (documentType === "INVOICE") {
			return this.linkToInvoice(documentId, matchScore);
		}
		return this.linkToBill(documentId, matchScore);
	}

	/**
	 * Returns a new unlinked instance with reconciliation cleared. Does NOT mutate.
	 *
	 * @example
	 * ```ts
	 * const unlinked = tx.unlink();
	 * ```
	 */
	unlink(): BankTransaction {
		return new BankTransaction(
			this.id,
			this.companyId,
			this.accountId,
			this.transactionDate,
			this.description,
			this._reference,
			this.type,
			this._amount,
			this._balance,
			this.category,
			this.tags,
			false,
			undefined,
			undefined,
			undefined,
			undefined,
			this.importedFrom,
			this.createdAt,
		);
	}

	isWithinDateRange(targetDate: Date, windowDays: number): boolean {
		const diff = Math.abs(
			this.transactionDate.getTime() - targetDate.getTime(),
		);
		const daysDiff = diff / (1000 * 60 * 60 * 24);
		return daysDiff <= windowDays;
	}

	toProps(): BankTransactionProps {
		return {
			id: this.id,
			companyId: this.companyId,
			accountId: this.accountId,
			transactionDate: this.transactionDate,
			description: this.description,
			reference: this._reference?.getValue(),
			type: this.type,
			amount: this._amount.getAmount().toFixed(2),
			balance: this._balance?.getAmount().toFixed(2),
			category: this.category,
			tags: this.tags,
			isReconciled: this._isReconciled,
			reconciledAt: this._reconciledAt,
			reconciledBy: this._reconciledBy,
			invoiceId: this._invoiceId,
			billId: this._billId,
			importedFrom: this.importedFrom,
			createdAt: this.createdAt,
		};
	}
}
