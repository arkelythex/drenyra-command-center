export declare abstract class DomainEvent {
    readonly occurredOn: Date;
    readonly eventId: string;
    constructor();
    abstract get eventName(): string;
    toPayload(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
    protected abstract getPayload(): Record<string, unknown>;
}
//# sourceMappingURL=DomainEvent.d.ts.map