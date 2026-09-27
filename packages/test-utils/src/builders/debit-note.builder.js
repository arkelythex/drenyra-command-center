import { DebitNote, DocumentSeries, Money } from "@drenyra/domain";
import { BaseBuilder } from "./base.builder";
const DEFAULT_DEBIT_NOTE_ID = "dn_test_001";
const DEFAULT_REFERENCE_INVOICE_ID = "inv_test_001";
const DEFAULT_REASON = "Aumento del monto por error en facturación";
const DEFAULT_SERIES = "FD01";
const DEFAULT_NUMBER = 1;
const DEFAULT_ADDITIONAL_AMOUNT = 200;
const DEFAULT_CURRENCY = "PEN";
const DEFAULT_STATUS = "DRAFT";
export class DebitNoteBuilder extends BaseBuilder {
    constructor() {
        const today = new Date();
        today.setHours(today.getHours() - 1);
        const additionalAmount = Money.fromAmount(DEFAULT_ADDITIONAL_AMOUNT, DEFAULT_CURRENCY);
        const baseAmount = additionalAmount;
        const igvAmount = additionalAmount.multiply(0.18);
        const totalAmount = additionalAmount.add(igvAmount);
        super({
            id: DEFAULT_DEBIT_NOTE_ID,
            referenceInvoiceId: DEFAULT_REFERENCE_INVOICE_ID,
            additionalAmount,
            totalAmount,
            baseAmount,
            igvAmount,
            currency: DEFAULT_CURRENCY,
            reason: DEFAULT_REASON,
            series: DEFAULT_SERIES,
            number: DEFAULT_NUMBER,
            status: DEFAULT_STATUS,
            issueDate: today,
            createdAt: today,
            updatedAt: today,
        });
    }
    withReferenceInvoice(invoiceId) {
        return this.set({ referenceInvoiceId: invoiceId });
    }
    withAdditionalAmount(amount, currency = DEFAULT_CURRENCY) {
        const additionalAmount = Money.fromAmount(amount, currency);
        const igvAmount = additionalAmount.multiply(0.18);
        const totalAmount = additionalAmount.add(igvAmount);
        return this.set({
            additionalAmount,
            baseAmount: additionalAmount,
            igvAmount,
            totalAmount,
            currency,
        });
    }
    withReason(reason) {
        return this.set({ reason });
    }
    withSeries(series) {
        return this.set({ series });
    }
    withNumber(num) {
        return this.set({ number: num });
    }
    withStatus(status) {
        return this.set({ status });
    }
    build() {
        const today = new Date();
        today.setHours(today.getHours() - 1);
        const additionalAmount = this.data.additionalAmount ??
            Money.fromAmount(DEFAULT_ADDITIONAL_AMOUNT, DEFAULT_CURRENCY);
        const igvAmount = additionalAmount.multiply(0.18);
        const totalAmount = additionalAmount.add(igvAmount);
        return DebitNote.create({
            id: this.data.id ?? DEFAULT_DEBIT_NOTE_ID,
            referenceInvoiceId: this.data.referenceInvoiceId ?? DEFAULT_REFERENCE_INVOICE_ID,
            additionalAmount,
            totalAmount,
            baseAmount: additionalAmount,
            igvAmount,
            currency: this.data.currency ?? DEFAULT_CURRENCY,
            reason: this.data.reason ?? DEFAULT_REASON,
            series: DocumentSeries.create(this.data.series ?? DEFAULT_SERIES),
            number: this.data.number ?? DEFAULT_NUMBER,
            status: this.data.status ?? DEFAULT_STATUS,
            issueDate: this.data.issueDate ?? today,
            createdAt: this.data.createdAt ?? today,
            updatedAt: this.data.updatedAt ?? today,
        });
    }
}
//# sourceMappingURL=debit-note.builder.js.map