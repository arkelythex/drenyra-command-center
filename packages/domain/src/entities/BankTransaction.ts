/**
 * BankTransaction Entity
 *
 * Represents a bank transaction (movement) in the treasury system.
 *
 * Business Rules:
 * - Transactions must have a valid date
 * - Amount must be non-zero
 * - Once reconciled, cannot be modified
 * - Must be linked to a bank account
 */

import type { Money } from "../value-objects/Money";

/**
 * Supported bank transaction types.
 *
 * @example
 * ```ts
 * const t: BankTransactionType = "DEPOSIT";
 * ```
 */
export type BankTransactionType =
	| "DEPOSIT" // Depósito
	| "WITHDRAWAL" // Retiro
	| "TRANSFER_IN" // Transferencia recibida
	| "TRANSFER_OUT" // Transferencia enviada
	| "FEE" // Comisión bancaria
	| "INTEREST" // Intereses
	| "CHECK" // Cheque
	| "OTHER"; // Otro

/**
 * Supported currencies for bank transactions.
 *
 * @example
 * ```ts
 * const c: Currency = "USD";
 * ```
 */
export type Currency = import("../types/currency").Currency;

/**
 * Properties used to construct a {@link BankTransaction}.
 *
 * @example
 * ```ts
 * const props: BankTransactionProps = {
 *   id: 0,
 *   bankAccountId: 1,
 *   transactionDate: new Date(),
 *   description: "DEPÓSITO",
 *   type: "DEPOSIT",
 *   amount: {} as Money,
 *   isReconciled: false,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface BankTransactionProps {
	id: number;
	bankAccountId: number;
	transactionDate: Date;
	description: string;
	reference?: string;
	type: BankTransactionType;
	amount: Money;
	balanceAfter?: Money;
	isReconciled: boolean;
	reconciledAt?: Date;
	reconciliationId?: number;
	journalEntryId?: string;
	importBatch?: string;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Bank transaction aggregate root.
 *
 * @deprecated Use the Banking bounded context entity under `apps/api/src/features/banking/domain/entities`.
 *
 * @example
 * ```ts
 * const tx = BankTransaction.createNew({
 *   bankAccountId: 1,
 *   transactionDate: new Date(),
 *   description: "DEPÓSITO",
 *   type: "DEPOSIT",
 *   amount: {} as Money,
 * });
 * ```
 */
export class BankTransaction {
	private constructor(private readonly props: BankTransactionProps) {
		this.validateBusinessRules();
	}

	/**
	 * Create a BankTransaction from existing data
	 */
	static create(props: BankTransactionProps): BankTransaction {
		return new BankTransaction(props);
	}

	/**
	 * Create a new bank transaction
	 */
	static createNew(params: {
		bankAccountId: number;
		transactionDate: Date;
		description: string;
		type: BankTransactionType;
		amount: Money;
		reference?: string;
		balanceAfter?: Money;
		importBatch?: string;
	}): BankTransaction {
		const now = new Date();

		return new BankTransaction({
			id: 0, // Will be assigned by database
			bankAccountId: params.bankAccountId,
			transactionDate: params.transactionDate,
			description: params.description,
			reference: params.reference,
			type: params.type,
			amount: params.amount,
			balanceAfter: params.balanceAfter,
			isReconciled: false,
			importBatch: params.importBatch,
			createdAt: now,
			updatedAt: now,
		});
	}

	/**
	 * Validate business rules
	 */
	private validateBusinessRules(): void {
		// Rule 1: Bank account ID is required
		if (!this.props.bankAccountId) {
			throw new Error("La cuenta bancaria es requerida");
		}

		// Rule 2: Transaction date is required and cannot be in the future
		if (!this.props.transactionDate) {
			throw new Error("La fecha de transacción es requerida");
		}

		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (this.props.transactionDate > today) {
			throw new Error("La fecha de transacción no puede ser futura");
		}

		// Rule 3: Description is required
		if (!this.props.description || this.props.description.trim() === "") {
			throw new Error("La descripción es requerida");
		}

		// Rule 4: Amount cannot be zero
		if (this.props.amount.isZero()) {
			throw new Error("El monto no puede ser cero");
		}
	}

	/**
	 * Mark as reconciled
	 */
	reconcile(
		reconciliationId: number,
		journalEntryId?: string,
	): BankTransaction {
		if (this.props.isReconciled) {
			throw new Error("La transacción ya está conciliada");
		}

		return new BankTransaction({
			...this.props,
			isReconciled: true,
			reconciledAt: new Date(),
			reconciliationId,
			journalEntryId,
			updatedAt: new Date(),
		});
	}

	/**
	 * Unreconcile (undo reconciliation)
	 */
	unreconcile(): BankTransaction {
		if (!this.props.isReconciled) {
			throw new Error("La transacción no está conciliada");
		}

		return new BankTransaction({
			...this.props,
			isReconciled: false,
			reconciledAt: undefined,
			reconciliationId: undefined,
			journalEntryId: undefined,
			updatedAt: new Date(),
		});
	}

	/**
	 * Check if this is an inflow (money coming in)
	 */
	isInflow(): boolean {
		return ["DEPOSIT", "TRANSFER_IN", "INTEREST"].includes(this.props.type);
	}

	/**
	 * Check if this is an outflow (money going out)
	 */
	isOutflow(): boolean {
		return ["WITHDRAWAL", "TRANSFER_OUT", "FEE", "CHECK"].includes(
			this.props.type,
		);
	}

	/**
	 * Get signed amount (positive for inflows, negative for outflows)
	 */
	getSignedAmount(): number {
		const amount = this.props.amount.getAmount();
		return this.isInflow() ? amount : -amount;
	}

	/**
	 * Check if can be modified
	 */
	canBeModified(): boolean {
		return !this.props.isReconciled;
	}

	/**
	 * Check equality by ID
	 */
	equals(other: BankTransaction | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	// Getters
	get id(): number {
		return this.props.id;
	}

	get bankAccountId(): number {
		return this.props.bankAccountId;
	}

	get transactionDate(): Date {
		return this.props.transactionDate;
	}

	get description(): string {
		return this.props.description;
	}

	get reference(): string | undefined {
		return this.props.reference;
	}

	get type(): BankTransactionType {
		return this.props.type;
	}

	get amount(): Money {
		return this.props.amount;
	}

	get balanceAfter(): Money | undefined {
		return this.props.balanceAfter;
	}

	get isReconciled(): boolean {
		return this.props.isReconciled;
	}

	get reconciledAt(): Date | undefined {
		return this.props.reconciledAt;
	}

	get reconciliationId(): number | undefined {
		return this.props.reconciliationId;
	}

	get journalEntryId(): string | undefined {
		return this.props.journalEntryId;
	}

	get importBatch(): string | undefined {
		return this.props.importBatch;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	/**
	 * Serialize to JSON
	 */
	toJSON(): Record<string, unknown> {
		return {
			id: this.props.id,
			bankAccountId: this.props.bankAccountId,
			transactionDate: this.props.transactionDate.toISOString(),
			description: this.props.description,
			reference: this.props.reference,
			type: this.props.type,
			amount: this.props.amount.toJSON(),
			balanceAfter: this.props.balanceAfter?.toJSON(),
			isReconciled: this.props.isReconciled,
			reconciledAt: this.props.reconciledAt?.toISOString(),
			reconciliationId: this.props.reconciliationId,
			journalEntryId: this.props.journalEntryId,
			importBatch: this.props.importBatch,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
