import { Money } from "../value-objects/Money";
export type JournalEntryStatus = "borrador" | "mayorizado" | "declarado";
export interface JournalLineProps {
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    description: string;
    debit: Money;
    credit: Money;
    documentType?: string;
    documentNumber?: string;
    dueDate?: Date;
}
export declare class JournalLine {
    private props;
    private constructor();
    static create(props: JournalLineProps): JournalLine;
    private validate;
    isDebit(): boolean;
    isCredit(): boolean;
    getAmount(): Money;
    get id(): string;
    get accountId(): string;
    get accountCode(): string;
    get accountName(): string;
    get description(): string;
    get debit(): Money;
    get credit(): Money;
    get documentType(): string | undefined;
    get documentNumber(): string | undefined;
    get dueDate(): Date | undefined;
    toJSON(): Record<string, unknown>;
}
export interface JournalEntryProps {
    id: string;
    organizationId: number;
    entryNumber: string;
    date: Date;
    gloss: string;
    status: JournalEntryStatus;
    lines: JournalLine[];
    postedBy?: string;
    postedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class JournalEntry {
    private props;
    private constructor();
    static create(props: JournalEntryProps): JournalEntry;
    private validateBusinessRules;
    isBalanced(): boolean;
    getTotalDebit(): Money;
    getTotalCredit(): Money;
    canBeModified(): boolean;
    canBeDeleted(): boolean;
    canBePosted(): boolean;
    canBeDeclared(): boolean;
    markAsPosted(userId: string): JournalEntry;
    markAsDeclared(): JournalEntry;
    update(data: {
        date?: Date;
        gloss?: string;
        lines?: JournalLine[];
    }): JournalEntry;
    equals(other: JournalEntry | null | undefined): boolean;
    get id(): string;
    get organizationId(): number;
    get entryNumber(): string;
    get date(): Date;
    get gloss(): string;
    get status(): JournalEntryStatus;
    get lines(): readonly JournalLine[];
    get postedBy(): string | undefined;
    get postedAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=JournalEntry.d.ts.map