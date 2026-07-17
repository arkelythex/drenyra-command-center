import type {
	PlatformEvent,
	PlatformEventHandler,
	PlatformEventType,
} from "./types";

/**
 * Platform-level Event Bus — generalized from AgentEventBus.
 *
 * Supports:
 * - Type-specific subscribers
 * - Wildcard subscribers (all events)
 * - Correlation IDs for tracing
 * - In-memory by default (Redis Streams backed in production)
 */
export class PlatformEventBus {
	private readonly handlers = new Map<
		PlatformEventType,
		Set<PlatformEventHandler>
	>();
	private readonly wildcardHandlers = new Set<PlatformEventHandler>();

	async connect(): Promise<void> {
		// No-op for in-memory implementation
	}

	async disconnect(): Promise<void> {
		this.handlers.clear();
		this.wildcardHandlers.clear();
	}

	async publish<T>(
		eventType: PlatformEventType,
		payload: T,
		metadata?: {
			source?: string;
			correlationId?: string;
			causationId?: string;
		},
	): Promise<void> {
		const event: PlatformEvent<T> = {
			id: crypto.randomUUID(),
			type: eventType,
			payload,
			source: metadata?.source ?? "core",
			timestamp: new Date(),
			correlationId: metadata?.correlationId ?? crypto.randomUUID(),
			causationId: metadata?.causationId,
		};

		// Call specific handlers
		const specificHandlers = this.handlers.get(eventType);
		if (specificHandlers) {
			const promises: Array<Promise<void>> = [];
			for (const handler of specificHandlers) {
				const result = handler(event as PlatformEvent<unknown>);
				if (result instanceof Promise) promises.push(result);
			}
			const results = await Promise.allSettled(promises);
			for (const result of results) {
				if (result.status === "rejected") {
					console.error(
						`[PlatformEventBus] Handler failed for event "${eventType}":`,
						result.reason,
					);
				}
			}
		}

		// Call wildcard handlers
		if (this.wildcardHandlers.size > 0) {
			const promises: Array<Promise<void>> = [];
			for (const handler of this.wildcardHandlers) {
				const result = handler(event as PlatformEvent<unknown>);
				if (result instanceof Promise) promises.push(result);
			}
			const results = await Promise.allSettled(promises);
			for (const result of results) {
				if (result.status === "rejected") {
					console.error(
						`[PlatformEventBus] Wildcard handler failed for event "${eventType}":`,
						result.reason,
					);
				}
			}
		}
	}

	async subscribe<T>(
		eventType: PlatformEventType,
		handler: PlatformEventHandler<T>,
	): Promise<() => void> {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, new Set());
		}
		this.handlers.get(eventType)?.add(handler as PlatformEventHandler<unknown>);
		return () => {
			this.handlers
				.get(eventType)
				?.delete(handler as PlatformEventHandler<unknown>);
		};
	}

	subscribeAll(handler: PlatformEventHandler<unknown>): () => void {
		this.wildcardHandlers.add(handler);
		return () => {
			this.wildcardHandlers.delete(handler);
		};
	}

	isHealthy(): boolean {
		return true;
	}

	getEventTypes(): PlatformEventType[] {
		return Array.from(this.handlers.keys());
	}
}
