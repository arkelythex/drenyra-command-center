/**
 * Builder pattern for BankTransaction test data.
 *
 * Creates valid BankTransaction domain entities for banking tests.
 *
 * @example
 * ```ts
 * const tx = new BankTransactionBuilder()
 *   .withType('DEPOSIT')
 *   .withAmount(5000)
 *   .build();
 * ```
 */
import type {
	BankTransactionProps,
	BankTransactionType,
} from "@drenyra/domain/entities/BankTransaction";
import { BankTransaction } from "@drenyra/domain/entities/BankTransaction";
import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";

const DEFAULT_BANK_ACCOUNT_ID = 1;
const DEFAULT_AMOUNT = 1000;
const DEFAULT_CURRENCY: Currency = "PEN";
const DEFAULT_TYPE: BankTransactionType = "DEPOSIT";

export class BankTransactionBuilder extends BaseBuilder<
	Partial<BankTransactionProps>,
	BankTransaction
> {
	private static nextId = 1;

	constructor() {
		const today = new Date();
		const amount = Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY);
		const id = BankTransactionBuilder.nextId++;

		super({
			id,
			bankAccountId: DEFAULT_BANK_ACCOUNT_ID,
			transactionDate: today,
			description: "Transacción de prueba",
			type: DEFAULT_TYPE,
			amount,
			isReconciled: false,
			createdAt: today,
			updatedAt: today,
		});
	}

	/**
	 * Set the transaction ID.
	 */
	withId(id: number): this {
		return this.set({ id });
	}

	/**
	 * Set the bank account ID.
	 */
	withBankAccountId(bankAccountId: number): this {
		return this.set({ bankAccountId });
	}

	/**
	 * Set the transaction date.
	 */
	withTransactionDate(date: Date): this {
		return this.set({ transactionDate: date });
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
	withReference(reference: string): this {
		return this.set({ reference });
	}

	/**
	 * Set the transaction type.
	 */
	withType(type: BankTransactionType): this {
		return this.set({ type });
	}

	/**
	 * Set the amount.
	 */
	withAmount(amount: number, currency: Currency = DEFAULT_CURRENCY): this {
		return this.set({ amount: Money.fromAmount(amount, currency) });
	}

	/**
	 * Set the balance after this transaction.
	 */
	withBalanceAfter(
		amount: number,
		currency: Currency = DEFAULT_CURRENCY,
	): this {
		return this.set({ balanceAfter: Money.fromAmount(amount, currency) });
	}

	/**
	 * Mark as reconciled.
	 */
	asReconciled(): this {
		return this.set({
			isReconciled: true,
			reconciledAt: new Date(),
		});
	}

	/**
	 * Set the reconciliation ID.
	 */
	withReconciliationId(reconciliationId: number): this {
		return this.set({ reconciliationId });
	}

	/**
	 * Set the journal entry ID.
	 */
	withJournalEntryId(journalEntryId: string): this {
		return this.set({ journalEntryId });
	}

	/**
	 * Set the import batch identifier.
	 */
	withImportBatch(batch: string): this {
		return this.set({ importBatch: batch });
	}

	/**
	 * Build the BankTransaction domain entity.
	 */
	build(): BankTransaction {
		const today = new Date();
		const props = {
			id: this.data.id ?? BankTransactionBuilder.nextId++,
			bankAccountId: this.data.bankAccountId ?? DEFAULT_BANK_ACCOUNT_ID,
			transactionDate: this.data.transactionDate ?? today,
			description: this.data.description ?? "Transacción de prueba",
			type: this.data.type ?? DEFAULT_TYPE,
			amount:
				this.data.amount ?? Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY),
			isReconciled: this.data.isReconciled ?? false,
			createdAt: this.data.createdAt ?? today,
			updatedAt: this.data.updatedAt ?? today,
			reference: this.data.reference,
			balanceAfter: this.data.balanceAfter,
			reconciledAt: this.data.reconciledAt,
			reconciliationId: this.data.reconciliationId,
			journalEntryId: this.data.journalEntryId,
			importBatch: this.data.importBatch,
		} as BankTransactionProps;

		return BankTransaction.create(props);
	}
}
