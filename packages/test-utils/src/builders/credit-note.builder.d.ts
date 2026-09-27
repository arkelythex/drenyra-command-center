import type { CreditNoteStatus, CreditNoteType, Currency } from "@drenyra/domain";
import { CreditNote, Money } from "@drenyra/domain";
import { BaseBuilder } from "./base.builder";
interface CreditNoteBuilderData {
    id: string;
    referenceInvoiceId: string;
    referenceInvoiceTotal?: number;
    creditNoteType: CreditNoteType;
    reason: string;
    series: string;
    number: number;
    totalAmount: Money;
    baseAmount: Money;
    igvAmount: Money;
    currency: Currency;
    status: CreditNoteStatus;
    issueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CreditNoteBuilder extends BaseBuilder<Partial<CreditNoteBuilderData>, CreditNote> {
    private referenceInvoiceTotal;
    constructor();
    withReferenceInvoice(invoiceId: string): this;
    withReason(reason: string): this;
    withCreditNoteType(type: CreditNoteType): this;
    withAmount(amount: number, currency?: Currency): this;
    withSeries(series: string): this;
    withNumber(num: number): this;
    withStatus(status: CreditNoteStatus): this;
    withReferenceInvoiceTotal(total: number): this;
    build(): CreditNote;
}
export {};
//# sourceMappingURL=credit-note.builder.d.ts.map