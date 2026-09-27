import { DomainEvent } from "./DomainEvent";
export class InvoiceCreated extends DomainEvent {
    invoiceId;
    series;
    number;
    clientName;
    totalAmount;
    currency;
    constructor(invoiceId, series, number, clientName, totalAmount, currency) {
        super();
        this.invoiceId = invoiceId;
        this.series = series;
        this.number = number;
        this.clientName = clientName;
        this.totalAmount = totalAmount;
        this.currency = currency;
    }
    get eventName() {
        return "invoice.created";
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            series: this.series,
            number: this.number,
            clientName: this.clientName,
            totalAmount: this.totalAmount,
            currency: this.currency,
        };
    }
}
//# sourceMappingURL=InvoiceCreated.js.map