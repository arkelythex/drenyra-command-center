/**
 * NATS Event Bus Implementation
 *
 * Production-grade event bus using NATS with JetStream
 * Supports persistence, delivery guarantees, and horizontal scaling
 *
 * 2026 Best Practices:
 * - JetStream for message persistence
 * - Durable consumers for reliable delivery
 * - Correlation IDs for distributed tracing
 */

import { nanoid } from "nanoid";
import {
	type DomainEvent,
	EVENT_SCHEMA_VERSION,
	type EventBusPort,
	type EventHandler,
	type EventMetadata,
	type EventType,
	type SubscriptionOptions,
} from "./event.port";

// NATS client (dynamically imported to avoid bundling issues)
let NATS: typeof import("nats") | null = null;

/**
 * NATSConfig interface.
 *
 * @example
 * ```ts
 * const value: NATSConfig = {} as NATSConfig;
 * console.log(value);
 * ```
 */
export interface NATSConfig {
	url: string;
	reconnect?: boolean;
	maxReconnectAttempts?: number;
	reconnectTimeWait?: number;
}

/**
 * NATSEventBus class.
 *
 * @example
 * ```ts
 * const value = new NATSEventBus();
 * console.log(value);
 * ```
 */
export class NATSEventBus implements EventBusPort {
	private nc: import("nats").NatsConnection | null = null;
	private js: import("nats").JetStreamClient | null = null;
	private subscriptions: Map<string, () => void> = new Map();
	private connected = false;

	constructor(private config: NATSConfig) {}

	async connect(): Promise<void> {
		if (this.connected) return;

		try {
			// Dynamic import to handle optional dependency
			if (!NATS) {
				NATS = await import("nats");
			}

			this.nc = await NATS.connect({
				servers: this.config.url,
				reconnect: this.config.reconnect ?? true,
				maxReconnectAttempts: this.config.maxReconnectAttempts ?? 10,
				reconnectTimeWait: this.config.reconnectTimeWait ?? 2000,
			});

			// Create JetStream client
			this.js = this.nc.jetstream();
			await this.ensureDomainEventStream();

			this.connected = true;
			console.log("✅ NATS Event Bus connected");

			// Setup graceful shutdown
			process.on("SIGTERM", () => this.disconnect());
			process.on("SIGINT", () => this.disconnect());
		} catch (error) {
			console.error("❌ Failed to connect to NATS:", error);
			throw error;
		}
	}

	async disconnect(): Promise<void> {
		if (!this.connected || !this.nc) return;

		// Unsubscribe all
		for (const [id, unsub] of this.subscriptions) {
			try {
				unsub();
				console.log(`Unsubscribed: ${id}`);
			} catch (e) {
				console.error(`Error unsubscribing ${id}:`, e);
			}
		}
		this.subscriptions.clear();

		await this.nc.close();
		this.connected = false;
		console.log("✅ NATS Event Bus disconnected");
	}

	async publish<T>(
		eventType: EventType,
		payload: T,
		partialMetadata?: Partial<EventMetadata>,
	): Promise<void> {
		if (!this.js) {
			throw new Error("Event bus not connected. Call connect() first.");
		}

		const event: DomainEvent<T> = {
			metadata: {
				eventId: partialMetadata?.eventId ?? nanoid(),
				eventType,
				timestamp: new Date(),
				version: EVENT_SCHEMA_VERSION,
				source: partialMetadata?.source ?? "drenyra-api",
				correlationId: partialMetadata?.correlationId ?? nanoid(),
				causationId: partialMetadata?.causationId,
			},
			payload,
		};

		try {
			// Convert event type to NATS subject (e.g., invoice.created -> invoice.created)
			const subject = eventType;

			await this.js.publish(subject, this.encode(event), {
				msgID: event.metadata.eventId, // Idempotency
			});

			console.log(`📤 Published: ${eventType} [${event.metadata.eventId}]`);
		} catch (error) {
			console.error(`❌ Failed to publish ${eventType}:`, error);
			throw error;
		}
	}

	async subscribe<T>(
		eventType: EventType,
		handler: EventHandler<T>,
		options?: SubscriptionOptions,
	): Promise<() => void> {
		if (!this.js) {
			throw new Error("Event bus not connected. Call connect() first.");
		}

		const subject = eventType;
		const consumerName = options?.durable ?? `consumer-${nanoid(8)}`;
		const queue = options?.queue;

		try {
			// Create JetStream consumer
			const opts = NATS?.consumerOpts();
			opts.durable(consumerName);
			opts.deliverAll(); // Deliver all messages (or use deliverNew for new only)
			opts.ackExplicit(); // Require explicit acknowledgment
			opts.deliverTo(NATS?.createInbox());

			if (queue) {
				opts.queue(queue); // Load balancing
			}

			// Max delivery attempts
			if (options?.maxDeliveries) {
				opts.maxDeliver(options.maxDeliveries);
			}

			const sub = await this.js.subscribe(subject, opts);

			// Process messages
			(async () => {
				for await (const msg of sub) {
					try {
						const event = this.decode<DomainEvent<T>>(msg.data);

						// Filter if provided
						if (options?.filter && !options.filter(event)) {
							msg.ack();
							continue;
						}

						console.log(
							`📥 Received: ${eventType} [${event.metadata.eventId}]`,
						);

						await handler(event);

						// Acknowledge successful processing
						msg.ack();
					} catch (error) {
						console.error(`❌ Error processing ${eventType}:`, error);
						// Negative acknowledgment - message will be redelivered
						msg.nak();
					}
				}
			})();

			// Return unsubscribe function
			const unsubscribe = async () => {
				await sub.unsubscribe();
				this.subscriptions.delete(consumerName);
			};

			this.subscriptions.set(consumerName, unsubscribe);
			console.log(`✅ Subscribed: ${eventType} [${consumerName}]`);

			return unsubscribe;
		} catch (error) {
			console.error(`❌ Failed to subscribe to ${eventType}:`, error);
			throw error;
		}
	}

	async subscribeMultiple<T>(
		eventTypes: EventType[],
		handler: EventHandler<T>,
		options?: SubscriptionOptions,
	): Promise<() => void> {
		const unsubscribes: (() => void)[] = [];

		for (const eventType of eventTypes) {
			const unsub = await this.subscribe(eventType, handler, options);
			unsubscribes.push(unsub);
		}

		// Return combined unsubscribe
		return async () => {
			for (const unsub of unsubscribes) {
				await unsub();
			}
		};
	}

	async request<TRequest, TResponse>(
		subject: string,
		payload: TRequest,
		timeout = 5000,
	): Promise<TResponse> {
		if (!this.nc) {
			throw new Error("Event bus not connected");
		}

		try {
			const msg = await this.nc.request(subject, this.encode(payload), {
				timeout: timeout,
			});

			return this.decode<TResponse>(msg.data);
		} catch (error) {
			console.error(`❌ Request failed for ${subject}:`, error);
			throw error;
		}
	}

	isHealthy(): boolean {
		return this.connected && !!this.nc && !this.nc.isClosed();
	}

	private encode(data: unknown): Uint8Array {
		return new TextEncoder().encode(JSON.stringify(data));
	}

	private decode<T>(data: Uint8Array): T {
		return JSON.parse(new TextDecoder().decode(data)) as T;
	}

	private async ensureDomainEventStream(): Promise<void> {
		if (!this.nc || !NATS) {
			throw new Error("NATS connection not ready");
		}

		const jsm = await this.nc.jetstreamManager();
		const streamName = process.env.NATS_STREAM_NAME?.trim() || "DRENYRA_EVENTS";
		const desiredSubjects = resolveDesiredStreamSubjects();

		try {
			const info = await jsm.streams.info(streamName);
			const currentSubjects = info.config.subjects ?? [];
			const mergedSubjects = Array.from(
				new Set([...currentSubjects, ...desiredSubjects]),
			);

			if (mergedSubjects.length !== currentSubjects.length) {
				await jsm.streams.update(streamName, {
					...info.config,
					subjects: mergedSubjects,
				});
				console.log(
					`✅ Updated NATS stream ${streamName}: ${mergedSubjects.join(", ")}`,
				);
			}
			return;
		} catch (error) {
			if (!isStreamNotFoundError(error)) {
				throw error;
			}
		}

		await jsm.streams.add({
			name: streamName,
			subjects: desiredSubjects,
		});
		console.log(
			`✅ Created NATS stream ${streamName}: ${desiredSubjects.join(", ")}`,
		);
	}
}

function resolveDesiredStreamSubjects(): string[] {
	const configured = process.env.NATS_STREAM_SUBJECTS?.split(",")
		.map((subject) => subject.trim())
		.filter((subject) => subject.length > 0);

	if (configured && configured.length > 0) {
		return Array.from(new Set(configured));
	}

	return [
		"invoice.>",
		"payment.>",
		"tax.>",
		"taxation.>",
		"agent.>",
		"user.>",
		"system.>",
	];
}

function isStreamNotFoundError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	return (
		/stream/i.test(error.message) && /not found|no stream/i.test(error.message)
	);
}

// Factory function
/**
 * createNATSEventBus operation.
 *
 * @param config - Input for config.
 * @returns Result of createNATSEventBus.
 * @example
 * ```ts
 * const result = createNATSEventBus({} as NATSConfig);
 * console.log(result);
 * ```
 */
export function createNATSEventBus(config: NATSConfig): EventBusPort {
	return new NATSEventBus(config);
}

// Singleton instance for application
let globalEventBus: EventBusPort | null = null;

/**
 * getEventBus operation.
 *
 * @returns Result of getEventBus.
 * @example
 * ```ts
 * const result = getEventBus();
 * console.log(result);
 * ```
 */
export function getEventBus(): EventBusPort {
	if (!globalEventBus) {
		const url = process.env.NATS_URL || "nats://localhost:4222";
		globalEventBus = createNATSEventBus({ url });
	}
	return globalEventBus;
}

/**
 * connectEventBus operation.
 *
 * @returns Result of connectEventBus.
 * @example
 * ```ts
 * const result = await connectEventBus();
 * console.log(result);
 * ```
 */
export async function connectEventBus(): Promise<void> {
	const bus = getEventBus();
	await bus.connect();
}
