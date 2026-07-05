import { EventEmitter } from "events";
import {
	type EventBusPort,
	type DomainEvent,
	type EventType,
	type EventHandler,
	type SubscriptionOptions,
	type EventMetadata,
	EVENT_SCHEMA_VERSION,
} from "./event.port";

export type { EventBusPort, EventType, EventHandler, DomainEvent };
import { nanoid } from "nanoid";

export class InMemoryEventBus implements EventBusPort {
	private emitter = new EventEmitter();
	private handlers = new Map<string, Set<EventHandler>>();
	private connected = false;

	async connect(): Promise<void> {
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.handlers.clear();
		this.emitter.removeAllListeners();
		this.connected = false;
	}

	async publish<T>(
		eventType: EventType,
		payload: T,
		metadata?: Partial<EventMetadata>,
	): Promise<void> {
		const event: DomainEvent<T> = {
			metadata: {
				eventId: metadata?.eventId ?? nanoid(),
				eventType,
				timestamp: new Date(),
				version: EVENT_SCHEMA_VERSION,
				source: metadata?.source ?? "drenyra",
				correlationId: metadata?.correlationId ?? nanoid(),
				causationId: metadata?.causationId,
			},
			payload,
		};
		this.emitter.emit(eventType, event);
	}

	async subscribe<T>(
		eventType: EventType,
		handler: EventHandler<T>,
		options?: SubscriptionOptions,
	): Promise<() => void> {
		const wrappedHandler = ((event: DomainEvent<unknown>) => {
			if (options?.filter && !options.filter(event)) return;
			(handler as EventHandler<unknown>)(event);
		}) as EventHandler;
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, new Set());
		}
		this.handlers.get(eventType)!.add(wrappedHandler);
		this.emitter.on(eventType, wrappedHandler);
		return () => {
			this.emitter.off(eventType, wrappedHandler);
			this.handlers.get(eventType)?.delete(wrappedHandler);
		};
	}

	async subscribeMultiple<T>(
		eventTypes: EventType[],
		handler: EventHandler<T>,
		options?: SubscriptionOptions,
	): Promise<() => void> {
		const unsubs = await Promise.all(
			eventTypes.map((et) => this.subscribe(et, handler, options)),
		);
		return () => unsubs.forEach((u) => u());
	}

	async request<TRequest, TResponse>(
		_subject: string,
		_payload: TRequest,
		_timeout?: number,
	): Promise<TResponse> {
		throw new Error("Request-response not supported in InMemoryEventBus");
	}

	isHealthy(): boolean {
		return this.connected;
	}
}
