interface BusMessage {
    from?: string;
    to?: string;
    data: unknown;
    timestamp?: Date;
}
export declare class MessageBus {
    private subscribers;
    private eventEmitter;
    subscribe(agentId: string, handler: (message: BusMessage) => void): void;
    publish(topic: string, message: BusMessage): void;
    route(fromAgent: string, toAgent: string, message: unknown): Promise<void>;
}
export {};
//# sourceMappingURL=orchestrator-2026.message-bus.d.ts.map