import type { EventBusPort } from "./port";

/**
 * Event Bus Port - Contract for Event-Driven Architecture
 *
 * 2026 Best Practice: Event-driven microservices with NATS
 * All services communicate via events, not direct HTTP calls
 * This enables future migration to Rust/Go agents
 * @example
 * ```ts
 * const value: EventType = {} as EventType;
 * console.log(value);
 * ```
 */

export type EventType =
	// Invoice Events
	| "invoice.created"
	| "invoice.updated"
	| "invoice.sent-to-sunat"
	| "invoice.sunat-accepted"
	| "invoice.sunat-rejected"
	| "invoice.paid"
	| "invoice.voided"

	// Payment Events
	| "payment.received"
	| "payment.reconciled"
	| "payment.failed"

	// Tax Events
	| "tax.period-closed"
	| "tax.declaration.due"
	| "tax.benefit.applied"

	// Retention Events (RS 037-2002/SUNAT — Agente de Retención)
	| "taxation.retention.applied"
	| "taxation.retention.declared"
	| "taxation.retention.paid"
	| "taxation.retention.cancelled"

	// Percepcion Events (DL N° 940 — Régimen de Percepciones IGV)
	| "taxation.percepcion.applied"
	| "taxation.percepcion.declared"
	| "taxation.percepcion.paid"
	| "taxation.percepcion.cancelled"

	// Agent Events
	| "agent.task.started"
	| "agent.task.completed"
	| "agent.task.failed"
	| "agent.anomaly.detected"

	// System Events
	| "user.registered"
	| "user.login"
	| "system.backup-completed"
	| "system.error"

	// Cross-Agent Events
	| "drenyra.intent.routed"
	| "agent.tool.executed"
	| "agent.tool.failed"
	| "agent.approval.requested"
	| "agent.approval.resolved"
	| "agent.query.request"
	| "agent.query.response"

	// Domain Events (cross-agent coordination)
	| "finance.invoice.created"
	| "finance.payment.executed"
	| "finance.reconciliation.completed"
	| "finance.cashflow.alert"
	| "operations.sale_order.created"
	| "operations.inventory.low"
	| "operations.customer.updated"
	| "compliance.month.closed"
	| "compliance.sunat.submitted"
	| "compliance.sunat.failed"
	| "compliance.tax_declaration.due"
	| "system.integration.added"
	| "system.surface.toggled";

// Event Metadata
/**
 * EventMetadata interface.
 *
 * @example
 * ```ts
 * const value: EventMetadata = {} as EventMetadata;
 * console.log(value);
 * ```
 */
export interface EventMetadata {
	eventId: string;
	eventType: EventType;
	timestamp: Date;
	version: string;
	source: string; // Service that emitted the event
	correlationId: string; // For tracing request chains
	causationId?: string; // Previous event that caused this one
}

// Base Event Structure
/**
 * DomainEvent interface.
 *
 * @example
 * ```ts
 * const value: DomainEvent = {} as DomainEvent;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for DomainEvent.
 */

export interface DomainEvent<T = unknown> {
	metadata: EventMetadata;
	payload: T;
}

// Invoice Created Event
/**
 * InvoiceCreatedPayload interface.
 *
 * @example
 * ```ts
 * const value: InvoiceCreatedPayload = {} as InvoiceCreatedPayload;
 * console.log(value);
 * ```
 */
export interface InvoiceCreatedPayload {
	invoiceId: string;
	companyId: string;
	customerId: string;
	series: string;
	correlative: number;
	totalAmount: string; // Decimal as string
	currency: "PEN" | "USD";
	issueDate: string; // ISO date
	createdBy: string;
}

// Payment Received Event
/**
 * PaymentReceivedPayload interface.
 *
 * @example
 * ```ts
 * const value: PaymentReceivedPayload = {} as PaymentReceivedPayload;
 * console.log(value);
 * ```
 */
export interface PaymentReceivedPayload {
	paymentId: string;
	invoiceId: string;
	companyId: string;
	amount: string;
	currency: "PEN" | "USD";
	bankAccountId: string;
	transactionReference: string;
	paymentDate: string;
}

// Agent Task Event
/**
 * AgentTaskPayload interface.
 *
 * @example
 * ```ts
 * const value: AgentTaskPayload = {} as AgentTaskPayload;
 * console.log(value);
 * ```
 */
export interface AgentTaskPayload {
	taskId: string;
	agentType: "reconciliation" | "tax-advisor" | "fraud-detector" | "forecaster";
	status: "started" | "completed" | "failed";
	input?: Record<string, unknown>;
	output?: Record<string, unknown>;
	error?: string;
	executionTimeMs: number;
}

// Event Handler Type
/**
 * EventHandler type.
 *
 * @example
 * ```ts
 * const value: EventHandler = {} as EventHandler;
 * console.log(value);
 * ```
 * @typeParam T - Generic type parameter for EventHandler.
 */

export type EventHandler<T = unknown> = (
	event: DomainEvent<T>,
) => Promise<void> | void;

// Event Subscription Options
/**
 * SubscriptionOptions interface.
 *
 * @example
 * ```ts
 * const value: SubscriptionOptions = {} as SubscriptionOptions;
 * console.log(value);
 * ```
 */
export interface SubscriptionOptions {
	queue?: string; // For load balancing across consumers
	durable?: string; // Durable consumer name
	maxDeliveries?: number; // Max retry attempts
	backoff?: number[]; // Backoff intervals in ms
	filter?: (event: DomainEvent) => boolean;
}

// Event Bus Factory
/**
 * EventBusFactory interface.
 *
 * @example
 * ```ts
 * const value: EventBusFactory = {} as EventBusFactory;
 * console.log(value);
 * ```
 */
export interface EventBusFactory {
	createBus(config: EventBusConfig): EventBusPort;
}

/**
 * EventBusConfig interface.
 *
 * @example
 * ```ts
 * const value: EventBusConfig = {} as EventBusConfig;
 * console.log(value);
 * ```
 */
export interface EventBusConfig {
	provider: "nats" | "redis" | "memory";
	url: string;
	options?: {
		reconnect?: boolean;
		maxReconnectAttempts?: number;
		reconnectTimeWait?: number;
	};
}

// Retention Events Payloads (RS 037-2002/SUNAT)
/**
 * Payload emitted when a 3% IGV retention is applied to a bill.
 * Triggers cashflow projection adjustment (net to supplier + SUNAT due on day 15).
 *
 * @example
 * ```ts
 * const payload: RetentionAppliedPayload = {
 *   retentionId: 'ret_1',
 *   companyId: 'cmp_1',
 *   billId: 'bill_1',
 *   supplierRuc: '20123456789',
 *   baseAmountCents: 100000,
 *   retentionAmountCents: 3000,
 *   currency: 'PEN',
 *   declarationPeriod: '2026-03',
 *   sunatDueDate: '2026-04-15',
 * };
 * ```
 */
export interface RetentionAppliedPayload {
	retentionId: string;
	companyId: string;
	billId: string;
	supplierRuc: string;
	baseAmountCents: number;
	retentionAmountCents: number;
	currency: "PEN";
	declarationPeriod: string; // 'YYYY-MM'
	sunatDueDate: string; // ISO date — day 15 of following month
}

/**
 * Payload emitted when a retention is declared in PDT 626.
 *
 * @example
 * ```ts
 * const payload: RetentionDeclaredPayload = {
 *   retentionId: 'ret_1',
 *   companyId: 'cmp_1',
 *   pdtReference: 'PDT626-2026-03',
 *   declarationPeriod: '2026-03',
 * };
 * ```
 */
export interface RetentionDeclaredPayload {
	retentionId: string;
	companyId: string;
	pdtReference: string;
	declarationPeriod: string;
}

// Version tracking for event schema evolution
/**
 * EVENT_SCHEMA_VERSION const.
 *
 * @example
 * ```ts
 * console.log(EVENT_SCHEMA_VERSION);
 * ```
 */
export const EVENT_SCHEMA_VERSION = "1.0.0";
