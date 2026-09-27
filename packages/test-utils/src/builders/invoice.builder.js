import { Invoice } from "@drenyra/domain/entities/Invoice";
import { DNI } from "@drenyra/domain/value-objects/DNI";
import { DocumentSeries } from "@drenyra/domain/value-objects/DocumentSeries";
import { Money } from "@drenyra/domain/value-objects/Money";
import { RUC } from "@drenyra/domain/value-objects/RUC";
import { BaseBuilder } from "./base.builder";
const DEFAULT_INVOICE_ID = "inv_test_001";
const DEFAULT_CLIENT_NAME = "Cliente Test SAC";
const DEFAULT_RUC = "20546296564";
const DEFAULT_SERIES = "F001";
const DEFAULT_NUMBER = 1;
const DEFAULT_CURRENCY = "PEN";
export class InvoiceBuilder extends BaseBuilder {
    itemCount = 0;
    constructor() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const baseAmount = Money.fromAmount(1000, DEFAULT_CURRENCY);
        const igvAmount = baseAmount.multiply(0.18);
        const taxAmount = igvAmount;
        const totalAmount = baseAmount.add(igvAmount);
        const buyerRuc = RUC.create(DEFAULT_RUC);
        super({
            id: DEFAULT_INVOICE_ID,
            series: DocumentSeries.create(DEFAULT_SERIES),
            number: DEFAULT_NUMBER,
            issueDate: yesterday,
            clientName: DEFAULT_CLIENT_NAME,
            buyerTaxId: buyerRuc,
            clientRUC: buyerRuc,
            baseAmount,
            taxAmount,
            igvAmount,
            totalAmount,
            status: "DRAFT",
            fiscalStatus: "DRAFT",
            items: [],
            createdAt: yesterday,
            updatedAt: yesterday,
        });
    }
    withId(id) {
        return this.set({ id });
    }
    withBuyerTaxId(taxId) {
        const updates = { buyerTaxId: taxId };
        if (taxId.type === "RUC") {
            updates.clientRUC = taxId;
        }
        else if (taxId.type === "DNI") {
            updates.clientDNI = taxId;
        }
        return this.set(updates);
    }
    withClientRUC(ruc) {
        const rucObj = RUC.create(ruc);
        return this.set({ clientRUC: rucObj, buyerTaxId: rucObj });
    }
    withClientDNI(dni) {
        const dniObj = DNI.create(dni);
        return this.set({ clientDNI: dniObj, buyerTaxId: dniObj });
    }
    withClientName(name) {
        return this.set({ clientName: name });
    }
    withSeries(series) {
        return this.set({ series: DocumentSeries.create(series) });
    }
    withNumber(number) {
        return this.set({ number });
    }
    withIssueDate(date) {
        return this.set({ issueDate: date });
    }
    withDueDate(date) {
        return this.set({ dueDate: date });
    }
    withStatus(status) {
        const fiscalStatusMap = {
            DRAFT: "DRAFT",
            PENDING: "PENDING_REVIEW",
            SENT: "SUBMITTED",
            ACCEPTED: "ACCEPTED",
            REJECTED: "REJECTED",
            CANCELLED: "CANCELLED",
        };
        return this.set({
            status,
            fiscalStatus: fiscalStatusMap[status] ?? "DRAFT",
        });
    }
    withFiscalStatus(fiscalStatus) {
        return this.set({ fiscalStatus });
    }
    withBaseAmount(amount, currency = DEFAULT_CURRENCY) {
        const baseAmount = Money.fromAmount(amount, currency);
        const igvAmount = baseAmount.multiply(0.18);
        const totalAmount = baseAmount.add(igvAmount);
        return this.set({
            baseAmount,
            igvAmount,
            taxAmount: igvAmount,
            totalAmount,
        });
    }
    withTaxAmount(amount) {
        return this.set({ taxAmount: amount });
    }
    withCurrency(currency) {
        return this.withBaseAmount(this.data.baseAmount?.getAmount() ?? 1000, currency);
    }
    withItem(item) {
        const currency = item.currency ?? DEFAULT_CURRENCY;
        const unitPrice = Money.fromAmount(item.unitPrice, currency);
        const subtotal = unitPrice.multiply(item.quantity);
        const igv = subtotal.multiply(0.18);
        const total = subtotal.add(igv);
        this.itemCount++;
        const newItem = {
            id: `item_test_${this.itemCount}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice,
            subtotal,
            igv,
            total,
        };
        const currentItems = this.data.items ?? [];
        return this.set({ items: [...currentItems, newItem] });
    }
    withItems(items) {
        return this.set({ items });
    }
    withNotes(notes) {
        return this.set({ notes });
    }
    withSunatResponseCode(code) {
        return this.set({ sunatResponseCode: code });
    }
    withSentToSunatAt(date) {
        return this.set({ sentToSunatAt: date });
    }
    build() {
        const items = this.data.items ?? [];
        if (items.length === 0) {
            this.withItem({
                description: "Servicio de prueba",
                quantity: 1,
                unitPrice: 1000,
            });
        }
        const now = new Date();
        const props = {
            ...this.data,
            createdAt: this.data.createdAt ?? now,
            updatedAt: this.data.updatedAt ?? now,
        };
        return Invoice.create(props);
    }
}
//# sourceMappingURL=invoice.builder.js.map