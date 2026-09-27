import type { AgentContext } from "../types/agent-context";
export type FiscalEventType = "fiscal.cpe.received" | "fiscal.cpe.validated" | "fiscal.igv.calculated" | "fiscal.sire.submitted" | "fiscal.detraccion.applied" | "fiscal.retencion.applied" | "fiscal.approval.requested" | "fiscal.approval.resolved" | "fiscal.anomaly.detected" | "fiscal.evidence.recorded" | "agent.task.decomposed" | "agent.task.completed" | "agent.task.failed" | "agent.session.created" | "agent.session.closed" | "system.tenant.config.updated" | "system.alert.threshold.breached" | "system.audit.trail.persisted";
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
export type FiscalEventHandler<T = unknown> = (event: FiscalEvent<T>) => Promise<void> | void;
export declare class AgentEventBus {
    private readonly handlers;
    private readonly wildcardHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    publish<T>(eventType: FiscalEventType, payload: T, context: AgentContext, metadata?: {
        correlationId?: string;
        causationId?: string;
        source?: string;
    }): Promise<void>;
    subscribe<T>(eventType: FiscalEventType, handler: FiscalEventHandler<T>): Promise<() => void>;
    subscribeMultiple<T>(eventTypes: FiscalEventType[], handler: FiscalEventHandler<T>): Promise<() => void>;
    subscribeAll(handler: FiscalEventHandler<unknown>): () => void;
    isHealthy(): boolean;
    getEventTypes(): FiscalEventType[];
}
//# sourceMappingURL=event-bus.d.ts.map