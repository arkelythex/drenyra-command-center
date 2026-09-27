import { DomainEvent } from "./DomainEvent";
export class TransactionPosted extends DomainEvent {
    transactionId;
    type;
    amount;
    currency;
    postedBy;
    constructor(transactionId, type, amount, currency, postedBy) {
        super();
        this.transactionId = transactionId;
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.postedBy = postedBy;
    }
    get eventName() {
        return "transaction.posted";
    }
    getPayload() {
        return {
            transactionId: this.transactionId,
            type: this.type,
            amount: this.amount,
            currency: this.currency,
            postedBy: this.postedBy,
        };
    }
}
//# sourceMappingURL=TransactionPosted.js.map