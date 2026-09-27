import type { Currency, DebitNoteStatus } from "@drenyra/domain";
import { DebitNote, Money } from "@drenyra/domain";
import { BaseBuilder } from "./base.builder";
interface DebitNoteBuilderData {
    id: string;
    referenceInvoiceId: string;
    additionalAmount: Money;
    totalAmount: Money;
    baseAmount: Money;
    igvAmount: Money;
    currency: Currency;
    reason: string;
    series: string;
    number: number;
    status: DebitNoteStatus;
    issueDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class DebitNoteBuilder extends BaseBuilder<Partial<DebitNoteBuilderData>, DebitNote> {
    constructor();
    withReferenceInvoice(invoiceId: string): this;
    withAdditionalAmount(amount: number, currency?: Currency): this;
    withReason(reason: string): this;
    withSeries(series: string): this;
    withNumber(num: number): this;
    withStatus(status: DebitNoteStatus): this;
    build(): DebitNote;
}
export {};
//# sourceMappingURL=debit-note.builder.d.ts.map