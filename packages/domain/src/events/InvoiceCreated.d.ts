import { DomainEvent } from "./DomainEvent";
export declare class InvoiceCreated extends DomainEvent {
    readonly invoiceId: string;
    readonly series: string;
    readonly number: number;
    readonly clientName: string;
    readonly totalAmount: number;
    readonly currency: string;
    constructor(invoiceId: string, series: string, number: number, clientName: string, totalAmount: number, currency: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=InvoiceCreated.d.ts.map