import { DomainEvent } from "./DomainEvent";
export class InvoiceSentToSunat extends DomainEvent {
    invoiceId;
    sunatResponseCode;
    constructor(invoiceId, sunatResponseCode) {
        super();
        this.invoiceId = invoiceId;
        this.sunatResponseCode = sunatResponseCode;
    }
    get eventName() {
        return "invoice.sent_to_sunat";
    }
    getPayload() {
        return {
            invoiceId: this.invoiceId,
            sunatResponseCode: this.sunatResponseCode,
        };
    }
}
//# sourceMappingURL=InvoiceSentToSunat.js.map