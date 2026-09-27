import type { TransactionEntry, TransactionProps, TransactionType } from "@drenyra/domain/entities/Transaction";
import { Transaction } from "@drenyra/domain/entities/Transaction";
import { type Currency } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
export declare class TransactionBuilder extends BaseBuilder<Partial<TransactionProps>, Transaction> {
    private entries;
    constructor();
    withId(id: string): this;
    withType(type: TransactionType): this;
    withDate(date: Date): this;
    withDescription(description: string): this;
    withReferenceNumber(ref: string): this;
    withStatus(status: TransactionProps["status"]): this;
    withEntry(accountCode: string, accountName: string, amount: number, side: "debit" | "credit", currency?: Currency): this;
    withEntries(entries: TransactionEntry[]): this;
    withPostedAt(date: Date, postedBy: string): this;
    build(): Transaction;
}
//# sourceMappingURL=transaction.builder.d.ts.map