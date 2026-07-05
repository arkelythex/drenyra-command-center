import type {
	EventHandler,
	EventMetadata,
	EventType,
	SubscriptionOptions,
} from "./types";

/**
 * Event Bus Port - Interface that all implementations must follow
 *
 * Implementations:
 * - NATSEventBus (current) - Production grade, multi-language
 * - InMemoryEventBus (testing) - For unit tests
 * - RedisEventBus (alternative) - If NATS unavailable
 * @example
 * ```ts
 * const value: EventBusPort = {} as EventBusPort;
 * console.log(value);
 * ```
 */

export interface EventBusPort {
	/**
	 * Connect to the event bus
	 */
	connect(): Promise<void>;

	/**
	 * Disconnect gracefully
	 */
	disconnect(): Promise<void>;

	/**
	 * Publish an event
	 * Fire-and-forget (async)
	 */
	publish<T>(
		eventType: EventType,
		payload: T,
		metadata?: Partial<EventMetadata>,
	): Promise<void>;

	/**
	 * Subscribe to events
	 * Returns unsubscribe function
	 */
	subscribe<T>(
		eventType: EventType,
		handler: EventHandler<T>,
		options?: SubscriptionOptions,
	): Promise<() => void>;

	/**
	 * Subscribe to multiple event types
	 */
	subscribeMultiple<T>(
		eventTypes: EventType[],
		handler: EventHandler<T>,
		options?: SubscriptionOptions,
	): Promise<() => void>;

	/**
	 * Request-response pattern (for RPC-style communication)
	 * Waits for response
	 */
	request<TRequest, TResponse>(
		subject: string,
		payload: TRequest,
		timeout?: number,
	): Promise<TResponse>;

	/**
	 * Health check
	 */
	isHealthy(): boolean;
}
