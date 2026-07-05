import type { AgentContext } from "../types/agent-context";

/** All event types in the Drenyra fiscal system */
export type FiscalEventType =
	| "fiscal.cpe.received"
	| "fiscal.cpe.validated"
	| "fiscal.igv.calculated"
	| "fiscal.sire.submitted"
	| "fiscal.detraccion.applied"
	| "fiscal.retencion.applied"
	| "fiscal.approval.requested"
	| "fiscal.approval.resolved"
	| "fiscal.anomaly.detected"
	| "fiscal.evidence.recorded"
	| "agent.task.decomposed"
	| "agent.task.completed"
	| "agent.task.failed"
	| "agent.session.created"
	| "agent.session.closed"
	| "system.tenant.config.updated"
	| "system.alert.threshold.breached"
	| "system.audit.trail.persisted";

/** Base event structure */
export interface FiscalEvent<T = unknown> {
	id: string;
	type: FiscalEventType;
	payload: T;
	context: AgentContext;
	timestamp: Date;
	correlationId: string;
	causationId?: string;
	source: string;
}

/** Event handler function */
export type FiscalEventHandler<T = unknown> = (
	event: FiscalEvent<T>,
) => Promise<void> | void;

/**
 * Mastra-based Fiscal Event Bus.
 *
 * Uses Mastra's event system under the hood but provides
 * the same interface as the original AgentEventBus.
 */
export class AgentEventBus {
	private readonly handlers = new Map<
		FiscalEventType,
		Set<FiscalEventHandler>
	>();
	private readonly wildcardHandlers = new Set<FiscalEventHandler<unknown>>();

	async connect(): Promise<void> {
		// No-op for in-memory implementation
	}

	async disconnect(): Promise<void> {
		this.handlers.clear();
		this.wildcardHandlers.clear();
	}

	async publish<T>(
		eventType: FiscalEventType,
		payload: T,
		context: AgentContext,
		metadata?: {
			correlationId?: string;
			causationId?: string;
			source?: string;
		},
	): Promise<void> {
		const event: FiscalEvent<T> = {
			id: crypto.randomUUID(),
			type: eventType,
			payload,
			context,
			timestamp: new Date(),
			correlationId: metadata?.correlationId ?? crypto.randomUUID(),
			causationId: metadata?.causationId,
			source: metadata?.source ?? "drenyra-orchestrator",
		};

		// Call specific handlers
		const specificHandlers = this.handlers.get(eventType);
		if (specificHandlers) {
			const promises: Array<Promise<void>> = [];
			for (const handler of specificHandlers) {
				const result = handler(event as FiscalEvent<unknown>);
				if (result instanceof Promise) promises.push(result);
			}
			await Promise.allSettled(promises);
		}

		// Call wildcard handlers
		if (this.wildcardHandlers.size > 0) {
			const promises: Array<Promise<void>> = [];
			for (const handler of this.wildcardHandlers) {
				const result = handler(event as FiscalEvent<unknown>);
				if (result instanceof Promise) promises.push(result);
			}
			await Promise.allSettled(promises);
		}
	}

	async subscribe<T>(
		eventType: FiscalEventType,
		handler: FiscalEventHandler<T>,
	): Promise<() => void> {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, new Set());
		}

		this.handlers.get(eventType)!.add(handler as FiscalEventHandler<unknown>);

		return () => {
			this.handlers
				.get(eventType)
				?.delete(handler as FiscalEventHandler<unknown>);
		};
	}

	async subscribeMultiple<T>(
		eventTypes: FiscalEventType[],
		handler: FiscalEventHandler<T>,
	): Promise<() => void> {
		const unsubscribers = await Promise.all(
			eventTypes.map((type) => this.subscribe(type, handler)),
		);

		return () => {
			for (const unsub of unsubscribers) {
				unsub();
			}
		};
	}

	/** Subscribe to ALL event types (wildcard) */
	subscribeAll(handler: FiscalEventHandler<unknown>): () => void {
		this.wildcardHandlers.add(handler);
		return () => {
			this.wildcardHandlers.delete(handler);
		};
	}

	isHealthy(): boolean {
		return true;
	}

	/** Get current event type subscriptions (for observability) */
	getEventTypes(): FiscalEventType[] {
		return Array.from(this.handlers.keys());
	}
}
