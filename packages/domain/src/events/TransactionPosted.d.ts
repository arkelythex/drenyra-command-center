import { DomainEvent } from "./DomainEvent";
export declare class TransactionPosted extends DomainEvent {
    readonly transactionId: string;
    readonly type: string;
    readonly amount: number;
    readonly currency: string;
    readonly postedBy: string;
    constructor(transactionId: string, type: string, amount: number, currency: string, postedBy: string);
    get eventName(): string;
    protected getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=TransactionPosted.d.ts.map