export interface EventEnvelope {
	type: string;
	payload: unknown;
	timestamp: string;
}
export type EventHandler = (event: EventEnvelope) => void;
export declare class EventBus {
	private handlers;
	private onceHandlers;
	on(type: string, handler: EventHandler): void;
	once(type: string, handler: EventHandler): void;
	off(type: string, handler: EventHandler): void;
	emit(type: string, payload: unknown): void;
	removeAllListeners(type: string): void;
	private dispatch;
}
//# sourceMappingURL=event-bus.d.ts.map
