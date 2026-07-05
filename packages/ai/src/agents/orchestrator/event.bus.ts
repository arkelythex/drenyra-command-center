/**
 * Event Bus
 * Pub/Sub event system for agent communication
 * Enables decoupled, asynchronous agent workflows
 */

import { randomUUID } from "crypto";
import { loggers } from "../../logger";
import type {
	AgentEvent,
	AgentEventHandler,
	AgentEventType,
	EventSubscription,
	EventBus as IEventBus,
} from "../types/workflow.types";

/**
 * EventBus class.
 *
 * @example
 * ```ts
 * const value = new EventBus();
 * console.log(value);
 * ```
 */
export class EventBus implements IEventBus {
	private subscriptions: Map<AgentEventType, Map<string, AgentEventHandler>>;
	private eventHistory: AgentEvent[];
	private readonly MAX_HISTORY = 1000;

	constructor() {
		this.subscriptions = new Map();
		this.eventHistory = [];
	}

	/**
	 * Emit an event to all subscribers
	 */
	emit<T extends AgentEvent>(event: T): void {
		const eventType = event.type;

		// Add to history
		this.addToHistory(event);

		// Log event
		loggers.ai.info("Event emitted", { eventType, processId: event.processId });

		// Get subscribers for this event type
		const subscribers = this.subscriptions.get(eventType);

		if (!subscribers || subscribers.size === 0) {
			loggers.ai.warn("No subscribers for event", { eventType });
			return;
		}

		// Call all handlers
		for (const [subscriptionId, handler] of subscribers.entries()) {
			try {
				// Execute handler (async or sync)
				const result = handler(event);
				if (result instanceof Promise) {
					result.catch((error) => {
						loggers.ai.error("Error in async handler", {
							subscriptionId,
							eventType,
							error: error instanceof Error ? error.message : String(error),
						});
					});
				}
			} catch (error) {
				loggers.ai.error("Error in handler", {
					subscriptionId,
					eventType,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
	}

	/**
	 * Subscribe to an event
	 */
	on<T extends AgentEvent>(
		eventType: AgentEventType,
		handler: AgentEventHandler<T>,
	): EventSubscription {
		const subscriptionId = randomUUID();

		// Get or create subscribers map for this event type
		if (!this.subscriptions.has(eventType)) {
			this.subscriptions.set(eventType, new Map());
		}

		const subscribers = this.subscriptions.get(eventType)!;
		subscribers.set(subscriptionId, handler as AgentEventHandler);

		loggers.ai.info("Subscribed to event", { eventType, subscriptionId });

		return {
			id: subscriptionId,
			eventType,
			handler: handler as AgentEventHandler,
		};
	}

	/**
	 * Unsubscribe from an event
	 */
	off(subscriptionId: string): void {
		let found = false;

		for (const [eventType, subscribers] of this.subscriptions.entries()) {
			if (subscribers.has(subscriptionId)) {
				subscribers.delete(subscriptionId);
				found = true;
				loggers.ai.info("Unsubscribed from event", {
					subscriptionId,
					eventType,
				});

				// Clean up empty subscription maps
				if (subscribers.size === 0) {
					this.subscriptions.delete(eventType);
				}
				break;
			}
		}

		if (!found) {
			loggers.ai.warn("Subscription not found", { subscriptionId });
		}
	}

	/**
	 * Subscribe to an event only once
	 */
	once<T extends AgentEvent>(
		eventType: AgentEventType,
		handler: AgentEventHandler<T>,
	): void {
		const wrappedHandler: AgentEventHandler<T> = (event: T) => {
			handler(event);
			// Unsubscribe after first call
			this.off(subscription.id);
		};

		const subscription = this.on(eventType, wrappedHandler);
	}

	/**
	 * Wait for an event (Promise-based)
	 */
	async waitFor<T extends AgentEvent>(
		eventType: AgentEventType,
		timeout: number = 30000,
		filter?: (event: T) => boolean,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				this.off(subscription.id);
				reject(new Error(`Timeout waiting for event: ${eventType}`));
			}, timeout);

			const subscription = this.on<T>(eventType, (event: T) => {
				// Apply filter if provided
				if (filter && !filter(event)) {
					return;
				}

				clearTimeout(timeoutId);
				this.off(subscription.id);
				resolve(event);
			});
		});
	}

	/**
	 * Get event history
	 */
	getHistory(eventType?: AgentEventType, processId?: string): AgentEvent[] {
		let history = this.eventHistory;

		if (eventType) {
			history = history.filter((e) => e.type === eventType);
		}

		if (processId) {
			history = history.filter((e) => e.processId === processId);
		}

		return history;
	}

	/**
	 * Clear event history
	 */
	clearHistory(): void {
		this.eventHistory = [];
		loggers.ai.info("Event history cleared");
	}

	/**
	 * Get active subscriptions
	 */
	getSubscriptions(): Map<AgentEventType, number> {
		const stats = new Map<AgentEventType, number>();

		for (const [eventType, subscribers] of this.subscriptions.entries()) {
			stats.set(eventType, subscribers.size);
		}

		return stats;
	}

	/**
	 * Get subscription stats
	 */
	getStats(): {
		totalSubscriptions: number;
		eventTypes: number;
		historySize: number;
	} {
		let totalSubscriptions = 0;
		for (const subscribers of this.subscriptions.values()) {
			totalSubscriptions += subscribers.size;
		}

		return {
			totalSubscriptions,
			eventTypes: this.subscriptions.size,
			historySize: this.eventHistory.length,
		};
	}

	/**
	 * Clear all subscriptions
	 */
	clearSubscriptions(): void {
		this.subscriptions.clear();
		loggers.ai.info("All subscriptions cleared");
	}

	/**
	 * Add event to history
	 */
	private addToHistory(event: AgentEvent): void {
		this.eventHistory.push(event);

		// Limit history size
		if (this.eventHistory.length > this.MAX_HISTORY) {
			this.eventHistory.shift(); // Remove oldest
		}
	}

	/**
	 * Destroy event bus
	 */
	destroy(): void {
		this.clearSubscriptions();
		this.clearHistory();
		loggers.ai.info("EventBus destroyed");
	}
}

/**
 * Global event bus singleton
 * @example
 * ```ts
 * console.log(globalEventBus);
 * ```
 */

export const globalEventBus = new EventBus();
