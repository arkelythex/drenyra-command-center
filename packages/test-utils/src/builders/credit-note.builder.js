import { CreditNote, DocumentSeries, Money } from "@drenyra/domain";
import { BaseBuilder } from "./base.builder";
const DEFAULT_CREDIT_NOTE_ID = "cn_test_001";
const DEFAULT_REFERENCE_INVOICE_ID = "inv_test_001";
const DEFAULT_REASON = "Anulación por error del cliente";
const DEFAULT_TYPE = "OTROS";
const DEFAULT_SERIES = "FC01";
const DEFAULT_NUMBER = 1;
const DEFAULT_AMOUNT = 1000;
const DEFAULT_CURRENCY = "PEN";
const DEFAULT_STATUS = "DRAFT";
export class CreditNoteBuilder extends BaseBuilder {
    referenceInvoiceTotal = null;
    constructor() {
        const today = new Date();
        today.setHours(today.getHours() - 1);
        const baseAmount = Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY);
        const igvAmount = baseAmount.multiply(0.18);
        const totalAmount = baseAmount.add(igvAmount);
        super({
            id: DEFAULT_CREDIT_NOTE_ID,
            referenceInvoiceId: DEFAULT_REFERENCE_INVOICE_ID,
            creditNoteType: DEFAULT_TYPE,
            reason: DEFAULT_REASON,
            series: DEFAULT_SERIES,
            number: DEFAULT_NUMBER,
            totalAmount,
            baseAmount,
            igvAmount,
            currency: DEFAULT_CURRENCY,
            status: DEFAULT_STATUS,
            issueDate: today,
            createdAt: today,
            updatedAt: today,
        });
    }
    withReferenceInvoice(invoiceId) {
        return this.set({ referenceInvoiceId: invoiceId });
    }
    withReason(reason) {
        return this.set({ reason });
    }
    withCreditNoteType(type) {
        return this.set({ creditNoteType: type });
    }
    withAmount(amount, currency = DEFAULT_CURRENCY) {
        const baseAmount = Money.fromAmount(amount / 1.18, currency);
        const igvAmount = baseAmount.multiply(0.18);
        const totalAmount = baseAmount.add(igvAmount);
        return this.set({
            totalAmount,
            baseAmount,
            igvAmount,
            currency,
        });
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
    withReferenceInvoiceTotal(total) {
        this.referenceInvoiceTotal = total;
        return this;
    }
    build() {
        const currentAmount = this.data.totalAmount?.getAmount() ?? DEFAULT_AMOUNT;
        if (this.referenceInvoiceTotal !== null &&
            currentAmount > this.referenceInvoiceTotal) {
            throw new Error(`El monto de la nota de crédito (${currentAmount}) no puede exceder el total de la factura referenciada (${this.referenceInvoiceTotal})`);
        }
        let creditNoteType = this.data.creditNoteType ?? DEFAULT_TYPE;
        if (this.referenceInvoiceTotal !== null &&
            Math.abs(currentAmount - this.referenceInvoiceTotal) < 0.001) {
            creditNoteType = "ANULACION";
        }
        const today = new Date();
        today.setHours(today.getHours() - 1);
        return CreditNote.create({
            id: this.data.id ?? DEFAULT_CREDIT_NOTE_ID,
            referenceInvoiceId: this.data.referenceInvoiceId ?? DEFAULT_REFERENCE_INVOICE_ID,
            referenceInvoiceTotal: this.referenceInvoiceTotal ?? undefined,
            creditNoteType,
            reason: this.data.reason ?? DEFAULT_REASON,
            series: DocumentSeries.create(this.data.series ?? DEFAULT_SERIES),
            number: this.data.number ?? DEFAULT_NUMBER,
            totalAmount: this.data.totalAmount ??
                Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY).add(Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY).multiply(0.18)),
            baseAmount: this.data.baseAmount ??
                Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY),
            igvAmount: this.data.igvAmount ??
                Money.fromAmount(DEFAULT_AMOUNT, DEFAULT_CURRENCY).multiply(0.18),
            currency: this.data.currency ?? DEFAULT_CURRENCY,
            status: this.data.status ?? DEFAULT_STATUS,
            issueDate: this.data.issueDate ?? today,
            createdAt: this.data.createdAt ?? today,
            updatedAt: this.data.updatedAt ?? today,
        });
    }
}
//# sourceMappingURL=credit-note.builder.js.map