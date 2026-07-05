/**
 * Builder pattern for Transaction (accounting) test data.
 *
 * Creates valid Transaction domain entities with balanced double-entry
 * bookkeeping for accounting tests.
 *
 * @example
 * ```ts
 * const tx = new TransactionBuilder()
 *   .withType('SALE')
 *   .withEntry('1041', 'Caja', 1000, 'debit')
 *   .withEntry('7011', 'Ventas', 1000, 'credit')
 *   .build();
 * ```
 */
import type {
	TransactionProps,
	TransactionType,
	TransactionEntry,
} from "@drenyra/domain/entities/Transaction";
import { Money, type Currency } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
import { Transaction } from "@drenyra/domain/entities/Transaction";

const DEFAULT_TRANSACTION_ID = "tx_test_001";
const DEFAULT_TYPE: TransactionType = "SALE";
const DEFAULT_CURRENCY: Currency = "PEN";

export class TransactionBuilder extends BaseBuilder<
	Partial<TransactionProps>,
	Transaction
> {
	private entries: TransactionEntry[] = [];

	constructor() {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		super({
			id: DEFAULT_TRANSACTION_ID,
			type: DEFAULT_TYPE,
			date: yesterday,
			description: "Transacción contable de prueba",
			status: "DRAFT",
			entries: [],
			createdAt: yesterday,
			updatedAt: yesterday,
		});
	}

	/**
	 * Set the transaction ID.
	 */
	withId(id: string): this {
		return this.set({ id });
	}

	/**
	 * Set the transaction type.
	 */
	withType(type: TransactionType): this {
		return this.set({ type });
	}

	/**
	 * Set the transaction date.
	 */
	withDate(date: Date): this {
		return this.set({ date });
	}

	/**
	 * Set the description.
	 */
	withDescription(description: string): this {
		return this.set({ description });
	}

	/**
	 * Set the reference number.
	 */
	withReferenceNumber(ref: string): this {
		return this.set({ referenceNumber: ref });
	}

	/**
	 * Set the status.
	 */
	withStatus(status: TransactionProps["status"]): this {
		return this.set({ status });
	}

	/**
	 * Add a double-entry line to the transaction.
	 *
	 * @param accountCode - PCGE account code
	 * @param accountName - Account display name
	 * @param amount - Amount in the account's currency
	 * @param side - 'debit' or 'credit'
	 * @param currency - Currency for the amount
	 */
	withEntry(
		accountCode: string,
		accountName: string,
		amount: number,
		side: "debit" | "credit",
		currency: Currency = DEFAULT_CURRENCY,
	): this {
		const moneyAmount = Money.fromAmount(amount, currency);
		const entry: TransactionEntry = {
			id: `entry_test_${this.entries.length + 1}`,
			accountCode,
			accountName,
			debit: side === "debit" ? moneyAmount : Money.zero(currency),
			credit: side === "credit" ? moneyAmount : Money.zero(currency),
			description: `Asiento ${this.entries.length + 1}`,
		};

		this.entries.push(entry);
		return this.set({ entries: this.entries });
	}

	/**
	 * Set entries directly (replaces all existing entries).
	 */
	withEntries(entries: TransactionEntry[]): this {
		this.entries = entries;
		return this.set({ entries });
	}

	/**
	 * Set the posted timestamp and user.
	 */
	withPostedAt(date: Date, postedBy: string): this {
		return this.set({ postedAt: date, postedBy });
	}

	/**
	 * Build the Transaction domain entity.
	 * If no entries were added, creates a default balanced pair.
	 */
	build(): Transaction {
		if (this.entries.length === 0) {
			this.withEntry("1041", "Caja Soles", 1000, "debit");
			this.withEntry("7011", "Ventas", 1000, "credit");
		}

		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		const props = {
			id: this.data.id ?? DEFAULT_TRANSACTION_ID,
			type: this.data.type ?? DEFAULT_TYPE,
			date: this.data.date ?? yesterday,
			description: this.data.description ?? "Transacción contable de prueba",
			status: this.data.status ?? "DRAFT",
			entries: this.entries,
			createdAt: this.data.createdAt ?? yesterday,
			updatedAt: this.data.updatedAt ?? yesterday,
			referenceNumber: this.data.referenceNumber,
			postedAt: this.data.postedAt,
			postedBy: this.data.postedBy,
		} as TransactionProps;

		return Transaction.create(props);
	}
}
