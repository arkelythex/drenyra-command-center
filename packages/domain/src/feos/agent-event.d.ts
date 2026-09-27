import type { Actor, FiscalScope, Timestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";
export declare const EVENT_SEVERITY: {
    readonly DEBUG: "debug";
    readonly INFO: "info";
    readonly WARNING: "warning";
    readonly ERROR: "error";
    readonly CRITICAL: "critical";
};
export type EventSeverity = (typeof EVENT_SEVERITY)[keyof typeof EVENT_SEVERITY];
export type AgentEventKind = "tool_started" | "tool_progress" | "tool_completed" | "tool_error" | "agent_thinking" | "agent_message" | "workflow_transition" | "workflow_waiting" | "approval_requested" | "approval_granted" | "approval_rejected" | "evidence_generated" | "error" | "system";
export interface AgentEvent {
    id: string;
    kind: AgentEventKind;
    severity: EventSeverity;
    title: string;
    description: string;
    actor: Actor;
    scope: FiscalScope;
    timestamp: Timestamp;
    traceId: string;
    workspaceId?: string;
    toolName?: string;
    toolRiskLevel?: ToolRiskLevel;
    progress?: EventProgress;
    payload?: Record<string, unknown>;
    relatedEventIds?: string[];
    tags?: string[];
}
export interface EventProgress {
    current: number;
    total: number;
    label: string;
}
export interface WorkflowState {
    workspaceId: string;
    status: "running" | "waiting" | "completed" | "failed" | "unknown";
    currentTool?: string;
    progress?: EventProgress;
    lastEvent: AgentEvent;
    events: AgentEvent[];
    warnings: number;
    errors: number;
    startedAt: Timestamp;
    lastUpdated: Timestamp;
}
export interface AgentEventStore {
    append(event: AgentEvent): Promise<void>;
    getWorkspaceEvents(workspaceId: string, limit?: number): Promise<AgentEvent[]>;
    getTraceEvents(traceId: string): Promise<AgentEvent[]>;
    getLatestEvent(workspaceId: string): Promise<AgentEvent | null>;
    query(filter: EventFilter): Promise<AgentEvent[]>;
}
export interface EventFilter {
    workspaceId?: string;
    traceId?: string;
    kind?: AgentEventKind;
    severity?: EventSeverity;
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
}
export declare function createToolEvent(input: {
    kind: "tool_started" | "tool_progress" | "tool_completed" | "tool_error";
    title: string;
    description: string;
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    toolName: string;
    toolRiskLevel?: ToolRiskLevel;
    progress?: EventProgress;
    payload?: Record<string, unknown>;
    error?: string;
}): AgentEvent;
export declare function createWorkflowEvent(input: {
    kind: "workflow_transition" | "workflow_waiting";
    title: string;
    description: string;
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    payload?: Record<string, unknown>;
}): AgentEvent;
export declare function createApprovalEvent(input: {
    kind: "approval_requested" | "approval_granted" | "approval_rejected";
    title: string;
    description: string;
    actor: Actor;
    scope: FiscalScope;
    traceId: string;
    workspaceId?: string;
    payload?: Record<string, unknown>;
}): AgentEvent;
export declare function projectWorkflowState(events: AgentEvent[]): WorkflowState;
//# sourceMappingURL=agent-event.d.ts.map