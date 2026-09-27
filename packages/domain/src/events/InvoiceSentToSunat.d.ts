import { DomainEvent } from "./DomainEvent";
export declare class InvoiceSentToSunat extends DomainEvent {
    readonly invoiceId: string;
    readonly sunatResponseCode: string;
    constructor(invoiceId: string, sunatResponseCode: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=InvoiceSentToSunat.d.ts.map