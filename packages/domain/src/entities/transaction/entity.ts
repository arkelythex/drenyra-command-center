/**
 * Transaction Entity
 * Represents a financial transaction in the accounting system
 *
 * Business Rules:
 * - Every transaction must balance (debits = credits)
 * - Cannot be modified after being posted
 * - Must have a valid date (not in future)
 * - Must reference a source document (invoice, payment, etc.)
 */

import { Money } from "../../value-objects/Money";
import type {
	TransactionEntry,
	TransactionProps,
	TransactionStatus,
	TransactionType,
} from "./types";

/**
 * Accounting transaction aggregate (double-entry bookkeeping).
 *
 * @example
 * ```ts
 * const tx = Transaction.create({} as TransactionProps);
 * tx.canBeModified();
 * ```
 */
export class Transaction {
	private constructor(private props: TransactionProps) {
		this.validateBusinessRules();
		Object.freeze(this);
	}

	/**
	 * Create a new Transaction
	 */
	static create(props: TransactionProps): Transaction {
		return new Transaction(props);
	}

	/**
	 * Validate business rules
	 */
	private validateBusinessRules(): void {
		// Rule 1: Must have at least 2 entries (double-entry bookkeeping)
		if (this.props.entries.length < 2) {
			throw new Error(
				"Una transacción debe tener al menos 2 asientos (partida doble)",
			);
		}

		// Rule 2: Transaction date cannot be in the future
		if (this.props.date > new Date()) {
			throw new Error("La fecha de la transacción no puede ser futura");
		}

		// Rule 3: Each entry must have either debit or credit (not both non-zero)
		for (const entry of this.props.entries) {
			const hasDebit = entry.debit.isPositive();
			const hasCredit = entry.credit.isPositive();

			if (hasDebit && hasCredit) {
				throw new Error(
					`El asiento ${entry.id} no puede tener débito y crédito simultáneamente`,
				);
			}

			if (!hasDebit && !hasCredit) {
				throw new Error(`El asiento ${entry.id} debe tener débito o crédito`);
			}
		}

		// Rule 4: All entries must use the same currency
		if (this.props.entries.length > 0) {
			const firstCurrency =
				this.props.entries[0]?.debit.getCurrency() ??
				this.props.entries[0]?.credit.getCurrency();
			for (const entry of this.props.entries) {
				if (
					entry.debit.getCurrency() !== firstCurrency ||
					entry.credit.getCurrency() !== firstCurrency
				) {
					throw new Error("Todos los asientos deben usar la misma moneda");
				}
			}
		}

		// Rule 5: Debits must equal credits (checked last after currency validation)
		const totalDebits = this.calculateTotalDebits();
		const totalCredits = this.calculateTotalCredits();

		if (!totalDebits.equals(totalCredits)) {
			throw new Error(
				`Los débitos (${totalDebits.getAmount()}) deben ser iguales a los créditos (${totalCredits.getAmount()})`,
			);
		}
	}

	/**
	 * Calculate total debits
	 */
	private calculateTotalDebits(): Money {
		if (this.props.entries.length === 0) {
			return Money.zero("PEN");
		}
		return this.props.entries.reduce(
			(acc, entry) => acc.add(entry.debit),
			Money.zero(this.props.entries[0]?.debit.getCurrency() ?? "PEN"),
		);
	}

	/**
	 * Calculate total credits
	 */
	private calculateTotalCredits(): Money {
		if (this.props.entries.length === 0) {
			return Money.zero("PEN");
		}
		return this.props.entries.reduce(
			(acc, entry) => acc.add(entry.credit),
			Money.zero(this.props.entries[0]?.credit.getCurrency() ?? "PEN"),
		);
	}

	/**
	 * Post the transaction (make it permanent)
	 */
	post(postedBy: string): Transaction {
		if (this.props.status !== "DRAFT") {
			throw new Error("Solo se pueden contabilizar transacciones en borrador");
		}

		return new Transaction({
			...this.props,
			status: "POSTED",
			postedAt: new Date(),
			postedBy,
			updatedAt: new Date(),
		});
	}

	/**
	 * Void the transaction
	 */
	void(voidedBy: string, reason: string): Transaction {
		if (this.props.status !== "POSTED") {
			throw new Error("Solo se pueden anular transacciones contabilizadas");
		}

		return new Transaction({
			...this.props,
			status: "VOIDED",
			voidedAt: new Date(),
			voidedBy,
			voidReason: reason,
			updatedAt: new Date(),
		});
	}

	/**
	 * Check if transaction can be modified
	 */
	canBeModified(): boolean {
		return this.props.status === "DRAFT";
	}

	/**
	 * Check if transaction is balanced
	 */
	isBalanced(): boolean {
		const totalDebits = this.calculateTotalDebits();
		const totalCredits = this.calculateTotalCredits();
		return totalDebits.equals(totalCredits);
	}

	/**
	 * Get transaction total amount
	 */
	getTotalAmount(): Money {
		return this.calculateTotalDebits();
	}

	/**
	 * Check equality by ID
	 */
	equals(other: Transaction | null | undefined): boolean {
		if (!other) {
			return false;
		}
		return this.props.id === other.props.id;
	}

	// Getters
	get id(): string {
		return this.props.id;
	}

	get type(): TransactionType {
		return this.props.type;
	}

	get date(): Date {
		return this.props.date;
	}

	get description(): string {
		return this.props.description;
	}

	get referenceNumber(): string | undefined {
		return this.props.referenceNumber;
	}

	get entries(): readonly TransactionEntry[] {
		return this.props.entries;
	}

	get status(): TransactionStatus {
		return this.props.status;
	}

	get postedAt(): Date | undefined {
		return this.props.postedAt;
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
			type: this.props.type,
			date: this.props.date.toISOString(),
			description: this.props.description,
			referenceNumber: this.props.referenceNumber,
			entries: this.props.entries.map((entry) => ({
				...entry,
				debit: entry.debit.toJSON(),
				credit: entry.credit.toJSON(),
			})),
			status: this.props.status,
			postedAt: this.props.postedAt?.toISOString(),
			postedBy: this.props.postedBy,
			voidedAt: this.props.voidedAt?.toISOString(),
			voidedBy: this.props.voidedBy,
			voidReason: this.props.voidReason,
			createdAt: this.props.createdAt.toISOString(),
			updatedAt: this.props.updatedAt.toISOString(),
		};
	}
}
