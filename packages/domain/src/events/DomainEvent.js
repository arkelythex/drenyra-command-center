export class DomainEvent {
    occurredOn;
    eventId;
    constructor() {
        this.occurredOn = new Date();
        this.eventId = crypto.randomUUID();
    }
    toPayload() {
        return this.getPayload();
    }
    toJSON() {
        return {
            eventId: this.eventId,
            eventName: this.eventName,
            occurredOn: this.occurredOn.toISOString(),
            ...this.getPayload(),
        };
    }
}
//# sourceMappingURL=DomainEvent.js.map