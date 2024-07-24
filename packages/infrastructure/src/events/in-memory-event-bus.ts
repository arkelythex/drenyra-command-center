import { EventEmitter } from "events";
import {
	type DomainEvent,
	EVENT_SCHEMA_VERSION,
	type EventBusPort,
	type EventHandler,
	type EventMetadata,
	type EventType,
	type SubscriptionOptions,
} from "./event.port";

export type { DomainEvent, EventBusPort, EventHandler, EventType };

import { nanoid } from "nanoid";

interface TenantSubscription {
	handler: EventHandler;
	organizationId?: string;
}

export class InMemoryEventBus implements EventBusPort {
	private emitter = new EventEmitter();
	private handlers = new Map<string, Set<EventHandler>>();
	private tenantSubscriptions = new Map<string, TenantSubscription[]>();
	private connected = false;

	async connect(): Promise<void> {
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.handlers.clear();
		this.tenantSubscriptions.clear();
		this.emitter.removeAllListeners();
		this.connected = false;
	}

	async publish<T>(
		eventType: EventType,
		payload: T,
		metadata?: Partial<EventMetadata & { organizationId?: string }>,
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

		const eventOrgId = metadata?.organizationId;

		// Tenant isolation: if event is scoped, only deliver to matching subscribers
		if (eventOrgId !== undefined) {
			const subs = this.tenantSubscriptions.get(eventType);
			if (subs) {
				for (const sub of subs) {
					// Deliver if: subscriber has no org filter (backward compat)
					// OR subscriber's org matches the event's org
					if (
						sub.organizationId === undefined ||
						sub.organizationId === eventOrgId
					) {
						sub.handler(event as DomainEvent<unknown>);
					}
				}
			}
		} else {
			// No org filter on event: broadcast to all (backward compatible)
			this.emitter.emit(eventType, event);
		}
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

		// Store in tenant subscriptions map for org-filtered delivery
		const tenantSub: TenantSubscription = {
			handler: wrappedHandler,
			organizationId: options?.organizationId,
		};

		if (!this.tenantSubscriptions.has(eventType)) {
			this.tenantSubscriptions.set(eventType, []);
		}
		this.tenantSubscriptions.get(eventType)?.push(tenantSub);

		// Also register on EventEmitter (for backward-compat: events without orgId)
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, new Set());
		}
		this.handlers.get(eventType)?.add(wrappedHandler);
		this.emitter.on(eventType, wrappedHandler);

		return () => {
			this.emitter.off(eventType, wrappedHandler);
			this.handlers.get(eventType)?.delete(wrappedHandler);

			// Remove from tenant subscriptions
			const subs = this.tenantSubscriptions.get(eventType);
			if (subs) {
				const idx = subs.indexOf(tenantSub);
				if (idx !== -1) subs.splice(idx, 1);
			}
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
