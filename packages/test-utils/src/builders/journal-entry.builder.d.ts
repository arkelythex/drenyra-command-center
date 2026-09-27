import { JournalEntry, type JournalEntryProps, type JournalEntryStatus } from "@drenyra/domain/entities/JournalEntry";
import { type Currency } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
export interface JournalEntryLineData {
    accountCode: string;
    accountName?: string;
    description?: string;
    amount: number;
    currency: Currency;
    type: "debit" | "credit";
}
export declare class JournalEntryBuilder extends BaseBuilder<Partial<JournalEntryProps>, JournalEntry> {
    private linesData;
    private lineCounter;
    constructor();
    withDebit(accountCode: string, amount: number, currency?: Currency): this;
    withCredit(accountCode: string, amount: number, currency?: Currency): this;
    withDate(date: Date): this;
    withDescription(description: string): this;
    withReference(reference: string): this;
    withOrganizationId(orgId: number): this;
    withStatus(status: JournalEntryStatus): this;
    withAccountName(accountCode: string, name: string): this;
    build(): JournalEntry;
}
//# sourceMappingURL=journal-entry.builder.d.ts.map