import type { BankTransactionProps, BankTransactionType } from "@drenyra/domain/entities/BankTransaction";
import { BankTransaction } from "@drenyra/domain/entities/BankTransaction";
import { type Currency } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
export declare class BankTransactionBuilder extends BaseBuilder<Partial<BankTransactionProps>, BankTransaction> {
    private static nextId;
    constructor();
    withId(id: number): this;
    withBankAccountId(bankAccountId: number): this;
    withTransactionDate(date: Date): this;
    withDescription(description: string): this;
    withReference(reference: string): this;
    withType(type: BankTransactionType): this;
    withAmount(amount: number, currency?: Currency): this;
    withBalanceAfter(amount: number, currency?: Currency): this;
    asReconciled(): this;
    withReconciliationId(reconciliationId: number): this;
    withJournalEntryId(journalEntryId: string): this;
    withImportBatch(batch: string): this;
    build(): BankTransaction;
}
//# sourceMappingURL=bank-transaction.builder.d.ts.map