import type { TaxIdentifier } from "@drenyra/domain";
import { Invoice, type InvoiceProps } from "@drenyra/domain/entities/Invoice";
import { type Currency, Money } from "@drenyra/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";
export declare class InvoiceBuilder extends BaseBuilder<InvoiceProps, Invoice> {
    private itemCount;
    constructor();
    withId(id: string): this;
    withBuyerTaxId(taxId: TaxIdentifier): this;
    withClientRUC(ruc: string): this;
    withClientDNI(dni: string): this;
    withClientName(name: string): this;
    withSeries(series: string): this;
    withNumber(number: number): this;
    withIssueDate(date: Date): this;
    withDueDate(date: Date): this;
    withStatus(status: InvoiceProps["status"]): this;
    withFiscalStatus(fiscalStatus: NonNullable<InvoiceProps["fiscalStatus"]>): this;
    withBaseAmount(amount: number, currency?: Currency): this;
    withTaxAmount(amount: Money): this;
    withCurrency(currency: Currency): this;
    withItem(item: {
        description: string;
        quantity: number;
        unitPrice: number;
        currency?: "PEN" | "USD";
    }): this;
    withItems(items: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: Money;
        subtotal: Money;
        igv: Money;
        total: Money;
    }>): this;
    withNotes(notes: string): this;
    withSunatResponseCode(code: string): this;
    withSentToSunatAt(date: Date): this;
    build(): Invoice;
}
//# sourceMappingURL=invoice.builder.d.ts.map