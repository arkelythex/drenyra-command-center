import type { Currency } from "../types/currency";
import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
export type DebitNoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
export interface DebitNoteProps {
    id: string;
    referenceInvoiceId: string;
    additionalAmount: Money;
    totalAmount: Money;
    baseAmount: Money;
    igvAmount: Money;
    currency: Currency;
    reason: string;
    series: DocumentSeries;
    number: number;
    status: DebitNoteStatus;
    sunatResponseCode?: string;
    sentToSunatAt?: Date;
    issueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface DebitNotePrimitiveData {
    id: string;
    referenceInvoiceId: string;
    additionalAmount: number;
    totalAmount: number;
    baseAmount: number;
    igvAmount: number;
    currency: string;
    reason: string;
    series: string;
    number: number;
    status: string;
    sunatResponseCode?: string;
    sentToSunatAt?: string | Date;
    issueDate: string | Date;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
export declare class DebitNote {
    private props;
    private constructor();
    static create(props: DebitNoteProps): DebitNote;
    static fromPrimitives(data: DebitNotePrimitiveData): DebitNote;
    private validateBusinessRules;
    markAsSent(sunatResponseCode: string): DebitNote;
    markAsAccepted(): DebitNote;
    markAsRejected(reason: string): DebitNote;
    canBeModified(): boolean;
    equals(other: DebitNote | null | undefined): boolean;
    getFullNumber(): string;
    get id(): string;
    get referenceInvoiceId(): string;
    get additionalAmount(): Money;
    get totalAmount(): Money;
    get baseAmount(): Money;
    get igvAmount(): Money;
    get currency(): Currency;
    get reason(): string;
    get series(): DocumentSeries;
    get number(): number;
    get status(): DebitNoteStatus;
    get sunatResponseCode(): string | undefined;
    get sentToSunatAt(): Date | undefined;
    get issueDate(): Date;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=DebitNote.d.ts.map