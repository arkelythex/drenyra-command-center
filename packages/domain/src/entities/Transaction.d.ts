import { Money } from "../value-objects/Money";
import type { AccountingTransactionType } from "../value-objects/TransactionType";
export type TransactionType = AccountingTransactionType;
export type TransactionStatus = "DRAFT" | "POSTED" | "VOIDED";
export interface TransactionEntry {
    id: string;
    accountCode: string;
    accountName: string;
    debit: Money;
    credit: Money;
    description?: string;
}
export interface TransactionProps {
    id: string;
    type: TransactionType;
    date: Date;
    description: string;
    referenceNumber?: string;
    entries: TransactionEntry[];
    status: TransactionStatus;
    postedAt?: Date;
    postedBy?: string;
    voidedAt?: Date;
    voidedBy?: string;
    voidReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Transaction {
    private props;
    private constructor();
    static create(props: TransactionProps): Transaction;
    private validateBusinessRules;
    private calculateTotalDebits;
    private calculateTotalCredits;
    post(postedBy: string): Transaction;
    void(voidedBy: string, reason: string): Transaction;
    canBeModified(): boolean;
    isBalanced(): boolean;
    getTotalAmount(): Money;
    equals(other: Transaction | null | undefined): boolean;
    get id(): string;
    get type(): TransactionType;
    get date(): Date;
    get description(): string;
    get referenceNumber(): string | undefined;
    get entries(): readonly TransactionEntry[];
    get status(): TransactionStatus;
    get postedAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=Transaction.d.ts.map