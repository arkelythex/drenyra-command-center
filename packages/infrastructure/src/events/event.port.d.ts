export type EventType = "invoice.created" | "invoice.updated" | "invoice.sent-to-sunat" | "invoice.sunat-accepted" | "invoice.sunat-rejected" | "invoice.paid" | "invoice.voided" | "payment.received" | "payment.reconciled" | "payment.failed" | "tax.period-closed" | "tax.declaration.due" | "tax.benefit.applied" | "taxation.retention.applied" | "taxation.retention.declared" | "taxation.retention.paid" | "taxation.retention.cancelled" | "taxation.percepcion.applied" | "taxation.percepcion.declared" | "taxation.percepcion.paid" | "taxation.percepcion.cancelled" | "agent.task.started" | "agent.task.completed" | "agent.task.failed" | "agent.anomaly.detected" | "user.registered" | "user.login" | "system.backup-completed" | "system.error" | "drenyra.intent.routed" | "agent.tool.executed" | "agent.tool.failed" | "agent.approval.requested" | "agent.approval.resolved" | "agent.query.request" | "agent.query.response" | "finance.invoice.created" | "finance.payment.executed" | "finance.reconciliation.completed" | "finance.cashflow.alert" | "operations.sale_order.created" | "operations.inventory.low" | "operations.customer.updated" | "compliance.month.closed" | "compliance.sunat.submitted" | "compliance.sunat.failed" | "compliance.tax_declaration.due" | "system.integration.added" | "system.surface.toggled";
export interface EventMetadata {
    eventId: string;
    eventType: EventType;
    timestamp: Date;
    version: string;
    source: string;
    correlationId: string;
    causationId?: string;
}
export interface DomainEvent<T = unknown> {
    metadata: EventMetadata;
    payload: T;
}
export interface InvoiceCreatedPayload {
    invoiceId: string;
    companyId: string;
    customerId: string;
    series: string;
    correlative: number;
    totalAmount: string;
    currency: "PEN" | "USD";
    issueDate: string;
    createdBy: string;
}
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
export interface AgentTaskPayload {
    taskId: string;
    agentType: "reconciliation" | "tax-advisor" | "fraud-detector" | "forecaster";
    status: "started" | "completed" | "failed";
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    error?: string;
    executionTimeMs: number;
}
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void> | void;
export interface SubscriptionOptions {
    queue?: string;
    durable?: string;
    maxDeliveries?: number;
    backoff?: number[];
    filter?: (event: DomainEvent) => boolean;
    organizationId?: string;
}
export interface EventBusPort {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish<T>(eventType: EventType, payload: T, metadata?: Partial<EventMetadata>): Promise<void>;
    subscribe<T>(eventType: EventType, handler: EventHandler<T>, options?: SubscriptionOptions): Promise<() => void>;
    subscribeMultiple<T>(eventTypes: EventType[], handler: EventHandler<T>, options?: SubscriptionOptions): Promise<() => void>;
    request<TRequest, TResponse>(subject: string, payload: TRequest, timeout?: number): Promise<TResponse>;
    isHealthy(): boolean;
}
export interface EventBusFactory {
    createBus(config: EventBusConfig): EventBusPort;
}
export interface EventBusConfig {
    provider: "nats" | "redis" | "memory";
    url: string;
    options?: {
        reconnect?: boolean;
        maxReconnectAttempts?: number;
        reconnectTimeWait?: number;
    };
}
export interface RetentionAppliedPayload {
    retentionId: string;
    companyId: string;
    billId: string;
    supplierRuc: string;
    baseAmountCents: number;
    retentionAmountCents: number;
    currency: "PEN";
    declarationPeriod: string;
    sunatDueDate: string;
}
export interface RetentionDeclaredPayload {
    retentionId: string;
    companyId: string;
    pdtReference: string;
    declarationPeriod: string;
}
export declare const EVENT_SCHEMA_VERSION = "1.0.0";
//# sourceMappingURL=event.port.d.ts.map