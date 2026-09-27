import { BankTransaction } from "@drenyra/domain/entities/BankTransaction";
import { Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
const DEFAULT_BANK_ACCOUNT_ID = 1;
const DEFAULT_AMOUNT = 1000;
const DEFAULT_CURRENCY = "PEN";
const DEFAULT_TYPE = "DEPOSIT";
export class BankTransactionBuilder extends BaseBuilder {
    static nextId = 1;
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
    withId(id) {
        return this.set({ id });
    }
    withBankAccountId(bankAccountId) {
        return this.set({ bankAccountId });
    }
    withTransactionDate(date) {
        return this.set({ transactionDate: date });
    }
    withDescription(description) {
        return this.set({ description });
    }
    withReference(reference) {
        return this.set({ reference });
    }
    withType(type) {
        return this.set({ type });
    }
    withAmount(amount, currency = DEFAULT_CURRENCY) {
        return this.set({ amount: Money.fromAmount(amount, currency) });
    }
    withBalanceAfter(amount, currency = DEFAULT_CURRENCY) {
        return this.set({ balanceAfter: Money.fromAmount(amount, currency) });
    }
    asReconciled() {
        return this.set({
            isReconciled: true,
            reconciledAt: new Date(),
        });
    }
    withReconciliationId(reconciliationId) {
        return this.set({ reconciliationId });
    }
    withJournalEntryId(journalEntryId) {
        return this.set({ journalEntryId });
    }
    withImportBatch(batch) {
        return this.set({ importBatch: batch });
    }
    build() {
        const today = new Date();
        const props = {
            id: this.data.id ?? BankTransactionBuilder.nextId++,
            bankAccountId: this.data.bankAccountId ?? DEFAULT_BANK_ACCOUNT_ID,
            transactionDate: this.data.transactionDate ?? today,
            description: this.data.description ?? "Transacción de prueba",
            type: this.data.type ?? DEFAULT_TYPE,
            amount: this.data.amount ?? Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY),
            isReconciled: this.data.isReconciled ?? false,
            createdAt: this.data.createdAt ?? today,
            updatedAt: this.data.updatedAt ?? today,
            reference: this.data.reference,
            balanceAfter: this.data.balanceAfter,
            reconciledAt: this.data.reconciledAt,
            reconciliationId: this.data.reconciliationId,
            journalEntryId: this.data.journalEntryId,
            importBatch: this.data.importBatch,
        };
        return BankTransaction.create(props);
    }
}
//# sourceMappingURL=bank-transaction.builder.js.map