import type { Currency } from "../types/currency";
import { DocumentSeries } from "../value-objects/DocumentSeries";
import { Money } from "../value-objects/Money";
export type CreditNoteType = "ANULACION" | "DESCUENTO" | "DEVOLUCION" | "OTROS";
export type CreditNoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
export interface CreditNoteProps {
    id: string;
    referenceInvoiceId: string;
    referenceInvoiceTotal?: number;
    creditNoteType: CreditNoteType;
    reason: string;
    series: DocumentSeries;
    number: number;
    totalAmount: Money;
    baseAmount: Money;
    igvAmount: Money;
    currency: Currency;
    status: CreditNoteStatus;
    sunatResponseCode?: string;
    sentToSunatAt?: Date;
    issueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreditNotePrimitiveData {
    id: string;
    referenceInvoiceId: string;
    referenceInvoiceTotal?: number;
    creditNoteType: string;
    reason: string;
    series: string;
    number: number;
    totalAmount: number;
    baseAmount: number;
    igvAmount: number;
    currency: string;
    status: string;
    sunatResponseCode?: string;
    sentToSunatAt?: string | Date;
    issueDate: string | Date;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}
export declare class CreditNote {
    private props;
    private constructor();
    static create(props: CreditNoteProps): CreditNote;
    static fromPrimitives(data: CreditNotePrimitiveData): CreditNote;
    private validateBusinessRules;
    markAsSent(sunatResponseCode: string): CreditNote;
    markAsAccepted(): CreditNote;
    markAsRejected(reason: string): CreditNote;
    isFullCancellation(): boolean;
    canBeModified(): boolean;
    equals(other: CreditNote | null | undefined): boolean;
    getFullNumber(): string;
    get id(): string;
    get referenceInvoiceId(): string;
    get referenceInvoiceTotal(): number | undefined;
    get creditNoteType(): CreditNoteType;
    get reason(): string;
    get series(): DocumentSeries;
    get number(): number;
    get totalAmount(): Money;
    get baseAmount(): Money;
    get igvAmount(): Money;
    get currency(): Currency;
    get status(): CreditNoteStatus;
    get sunatResponseCode(): string | undefined;
    get sentToSunatAt(): Date | undefined;
    get issueDate(): Date;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=CreditNote.d.ts.map